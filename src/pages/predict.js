import React, { useState } from 'react';

const Predict = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [moistureValue, setMoistureValue] = useState(null);
  const [recommendationText, setRecommendationText] = useState('');

  // 處理圖片上傳並產生預覽圖
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // 預測按鈕事件，這裡可以呼叫 API 或執行相應邏輯
//   const handlePredict = async () => {
//     // 在這裡你可以加入調用後端 API 的程式碼
//     // 目前僅以假資料作示範
//     setMoistureValue('25%');
//     setRecommendationText('建議開始收割');
//   };

  const handlePredict = async () => {
    if (!selectedFile) return;
  
    const formData = new FormData();
    formData.append('image', selectedFile);
  
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
  
      if (res.ok) {
        // 假設 API 回傳的 key 為 moistureContent
        setMoistureValue(data.predict);
        // 可以根據 moistureContent 值來動態調整推薦文字
        setRecommendationText('建議開始收割');
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error calling API:', error);
    }
  };
  

  return (
    <div className="container mx-auto max-w-md p-4">
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-2xl font-bold mb-4">稻穀含水率分析</h2>

        <div className="mb-4">
          <div
            id="imagePreview"
            className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="預覽" className="object-contain h-full" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </div>

          <div className="flex justify-between">
            <label className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
              上傳圖片
              <input
                type="file"
                id="imageUpload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            <button
              id="predictButton"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              disabled={!selectedFile}
              onClick={handlePredict}
            >
              預測含水率
            </button>
          </div>
        </div>

        {moistureValue && (
          <div id="predictionResult" className="mt-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">預測結果</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold" id="moistureValue">
                {moistureValue}
              </span>
              <span id="recommendationText" className="text-sm">
                {recommendationText}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
        <p className="text-yellow-700">
          提示：含水率約25%時，稻穀呈現金黃色且堅硬，建議開始收割。
        </p>
      </div>
    </div>
  );
};

export default Predict;
