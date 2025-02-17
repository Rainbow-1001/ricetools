import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import multer from 'multer';
import stream from 'stream';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: { bodyParser: false },
};

const upload = multer();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let moistureContentPercent;

  // 使用 multer 解析 multipart/form-data
  upload.single('image')(req, {}, async (err) => {
    if (err) return res.status(400).json({ error: 'Error parsing form-data' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // ================================
    // 圖片色彩分析邏輯開始
    // ================================
    let moistureContent = null;
    try {
      // 使用 sharp 處理圖片，轉換成原始 RGB 資料
      const image = sharp(req.file.buffer);
      const { data, info } = await image
        .removeAlpha() // 移除 alpha 通道，確保資料為 RGB 三通道
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const { width, height, channels } = info;
      const pixelCount = width * height;
      let totalRed = 0;
      let totalGreen = 0;

      // 資料排列順序為 R, G, B, (A)
      for (let i = 0; i < data.length; i += channels) {
        totalRed += data[i];       // R 通道
        totalGreen += data[i + 1];   // G 通道
      }
      
      const avgRed = totalRed / pixelCount;
      const avgGreen = totalGreen / pixelCount;
      
      // 避免除以 0，加 1
      const colorRatio = avgGreen / (avgRed + 1);
      
      // 根據簡單公式計算含水率（公式可根據需求調整）
      moistureContent = 31 - (colorRatio - 0.8) * 20;
      moistureContent = Math.max(22, Math.min(31, moistureContent));
      moistureContent = Number(moistureContent.toFixed(2));
      moistureContentPercent = `${moistureContent}%`;
    } catch (error) {
      console.error('Color analysis error:', error);
      // 如果分析失敗，可以選擇中斷或繼續上傳
      // 這裡我們繼續，但返回 null 表示分析失敗
    }
    // ================================
    // 圖片色彩分析邏輯結束
    // ================================

    // 建立一個 stream 以便上傳至 S3
    const fileStream = stream.Readable.from(req.file.buffer);

    try {
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `uploads/${Date.now()}_${req.file.originalname}`,
        Body: fileStream,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
      };

      const parallelUpload = new Upload({
        client: s3Client,
        params: uploadParams,
      });

      const result = await parallelUpload.done();
      const url = result.Location || `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
      
      res.status(200).json({ status: 200, url, moistureContentPercent });
    } catch (error) {
      console.error('S3 upload error:', error);
      res.status(500).json({ error: 'Failed to upload image to S3' });
    }
  });
}
