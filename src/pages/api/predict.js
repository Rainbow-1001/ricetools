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

// 6色葉色版的標準 RGB 值和對應的施肥建議
const LEAF_COLOR_STANDARDS = [
  {
    level: 1,
    rgb: [238, 238, 187], // 淺黃綠
    fertilizer: 6.0,
    description: "葉色極淺，建議立即追施氮肥6.0公斤/分地"
  },
  {
    level: 2,
    rgb: [205, 225, 151], // 淺綠
    fertilizer: 5.0,
    description: "葉色偏淺，建議追施氮肥5.0公斤/分地"
  },
  {
    level: 3,
    rgb: [182, 212, 126], // 綠
    fertilizer: 4.0,
    description: "葉色稍淺，建議追施氮肥4.0公斤/分地"
  },
  {
    level: 4,
    rgb: [159, 199, 101], // 深綠
    fertilizer: 3.0,
    description: "葉色正常，建議追施氮肥3.0公斤/分地"
  },
  {
    level: 5,
    rgb: [136, 186, 76], // 更深綠
    fertilizer: 2.0,
    description: "葉色深綠，建議追施氮肥2.0公斤/分地"
  },
  {
    level: 6,
    rgb: [113, 173, 51], // 最深綠
    fertilizer: 1.0,
    description: "葉色很深，建議追施氮肥1.0公斤/分地"
  }
];

// 計算兩個 RGB 值之間的歐氏距離
function calculateColorDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  upload.single('image')(req, {}, async (err) => {
    if (err) return res.status(400).json({ error: 'Error parsing form-data' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      // 使用 sharp 處理圖片，取得上半部分（假設是葉片區域）
      const image = sharp(req.file.buffer);
      const metadata = await image.metadata();
      
      // 裁切圖片上半部分（假設是葉片區域）
      const croppedImage = await image
        .extract({
          left: 0,
          top: 0,
          width: metadata.width,
          height: Math.floor(metadata.height / 2)
        })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = croppedImage;
      const { width, height, channels } = info;
      const pixelCount = width * height;

      // 計算平均 RGB 值
      let totalR = 0, totalG = 0, totalB = 0;
      for (let i = 0; i < data.length; i += channels) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
      }

      const avgRGB = [
        Math.round(totalR / pixelCount),
        Math.round(totalG / pixelCount),
        Math.round(totalB / pixelCount)
      ];

      // 找出最接近的葉色標準
      let minDistance = Infinity;
      let closestStandard = null;

      for (const standard of LEAF_COLOR_STANDARDS) {
        const distance = calculateColorDistance(avgRGB, standard.rgb);
        if (distance < minDistance) {
          minDistance = distance;
          closestStandard = standard;
        }
      }

      // 建立分析結果
      const analysisResult = {
        colorLevel: closestStandard.level,
        fertilizer: closestStandard.fertilizer,
        description: closestStandard.description,
        avgRGB: avgRGB
      };

      // 上傳圖片到 S3
      const fileStream = stream.Readable.from(req.file.buffer);
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `leaf-analysis/${Date.now()}_${req.file.originalname}`,
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
      
      // 返回結果
      res.status(200).json({
        status: 200,
        url,
        analysis: analysisResult,
        predict: `${analysisResult.fertilizer}公斤/分地`
      });

    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Failed to process image' });
    }
  });
}