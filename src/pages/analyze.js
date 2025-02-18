import React, { useState } from 'react';

const LeafAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);  // 清除任何之前的錯誤
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('分析請求失敗');
      }

      const data = await response.json();
      
      setAnalysisResult({
        colorLevel: data.analysis.colorLevel,
        fertilizer: data.analysis.fertilizer,
        description: data.analysis.description,
        imageUrl: data.url
      });
    } catch (error) {
      console.error('分析錯誤:', error);
      setError('圖片分析失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-4">
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-2xl font-bold mb-4">稻米葉色分析</h2>
        
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            請上傳稻米葉片與6色葉色板的對比照片（葉片置於上方）
          </div>
          
          <div className="relative h-48 bg-gray-100 rounded-lg mb-4">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="預覽" 
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">點擊選擇或拖放圖片</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex-1">
              <div className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer text-center transition-colors">
                選擇圖片
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </label>
            <button
              className={`flex-1 font-bold py-2 px-4 rounded transition-colors ${
                isLoading || !selectedFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              disabled={isLoading || !selectedFile}
              onClick={handleAnalyze}
            >
              {isLoading ? '分析中...' : '開始分析'}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-black">分析結果</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">葉色等級：</span>
                <span className="font-bold text-lg text-black">
                  {analysisResult.colorLevel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">建議施肥量：</span>
                <span className="font-bold text-lg text-green-600">
                  {analysisResult.fertilizer} 公斤/分地
                </span>
              </div>
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-green-700">
                  {analysisResult.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
        <div className="text-blue-700 text-sm">
          <p className="font-semibold mb-1">拍攝建議：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>確保光線充足且均勻</li>
            <li>葉片放置於圖片上方</li>
            <li>葉色板放置於圖片下方</li>
            <li>避免陰影和反光</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeafAnalysis;