
import React, { useState, useCallback, useRef } from 'react';
import { generateAvatar } from './services/geminiService';
import { AvatarStyle, AppState } from './types';
import { 
  CameraIcon, 
  ArrowPathIcon, 
  ArrowDownTrayIcon, 
  SparklesIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface ExtendedAppState extends AppState {
  isDragging: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<ExtendedAppState>({
    originalImage: null,
    generatedAvatar: null,
    isGenerating: false,
    style: AvatarStyle.PIXAR,
    error: null,
    isDragging: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setState(prev => ({ ...prev, error: "请上传有效的图片文件。" }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setState(prev => ({ 
        ...prev, 
        originalImage: reader.result as string, 
        error: null,
        generatedAvatar: null 
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragging: true }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragging: false }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragging: false }));
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!state.originalImage) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const result = await generateAvatar(state.originalImage, state.style);
      setState(prev => ({ ...prev, generatedAvatar: result, isGenerating: false }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: err.message || "生成失败，请重试。" 
      }));
    }
  };

  const handleDownload = () => {
    if (!state.generatedAvatar) return;
    const link = document.createElement('a');
    link.href = state.generatedAvatar;
    link.download = `avatar-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="w-full max-w-5xl mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <SparklesIcon className="w-10 h-10 text-indigo-600" />
          卡通头像生成器
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          上传您的照片，AI 将为您定制相似度极高的专属卡通形象
        </p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Area */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* Original Image Card */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">原始照片</h2>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`aspect-[3/4] rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed transition-all relative group ${
                state.isDragging 
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.98]' 
                : 'border-slate-300 bg-slate-100'
              }`}
            >
              {state.originalImage ? (
                <img src={state.originalImage} alt="Original" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 pointer-events-none">
                  <ArrowUpTrayIcon className={`w-12 h-12 mx-auto mb-2 transition-transform ${state.isDragging ? 'text-indigo-600 scale-110' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${state.isDragging ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {state.isDragging ? '松开以上传图片' : '拖拽图片到这里 或 点击下方上传'}
                  </p>
                </div>
              )}
              
              {/* Overlay for drag effect when image exists */}
              {state.originalImage && state.isDragging && (
                <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-[2px] flex items-center justify-center border-4 border-indigo-600 rounded-lg">
                   <ArrowUpTrayIcon className="w-16 h-16 text-white animate-bounce" />
                </div>
              )}
            </div>
            <div className="mt-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                {state.originalImage ? '更换照片' : '上传照片'}
              </button>
            </div>
          </div>

          {/* Generated Avatar Card */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">生成的头像</h2>
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 relative">
              {state.isGenerating ? (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-600 font-medium">正在绘制中...</p>
                </div>
              ) : state.generatedAvatar ? (
                <img src={state.generatedAvatar} alt="Generated Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">点击生成按钮开始魔法</p>
                </div>
              )}
            </div>
            {state.generatedAvatar && (
              <button 
                onClick={handleDownload}
                className="mt-4 w-full py-2.5 px-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                保存高清头像
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            设置选项
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">选择卡通风格</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(AvatarStyle).map((s) => (
                  <button
                    key={s}
                    onClick={() => setState(prev => ({ ...prev, style: s }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      state.style === s 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={!state.originalImage || state.isGenerating}
                className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
                  !state.originalImage || state.isGenerating
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transform hover:scale-[1.02]'
                }`}
              >
                <ArrowPathIcon className={`w-6 h-6 ${state.isGenerating ? 'animate-spin' : ''}`} />
                {state.isGenerating ? '处理中...' : '立即生成头像'}
              </button>
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">使用提示</h3>
            <ul className="text-sm text-slate-500 space-y-2">
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                直接拖拽图片到左侧框内即可快速上传
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                使用正面、清晰、光线均匀的照片效果最佳
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                特殊的配饰（如眼镜、帽子）将被精准还原
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                尝试不同风格以获得最满意的结果
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="mt-16 text-slate-400 text-sm">
        Powered by Gemini 2.5 Flash Image & React
      </footer>
    </div>
  );
};

export default App;
