
import React, { useState, useEffect, useRef } from 'react';
import { generateAvatar } from './services/geminiService';
import { AvatarStyle, AppState, HistoryItem } from './types';
import { 
  CameraIcon, 
  ArrowPathIcon, 
  ArrowDownTrayIcon, 
  SparklesIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
  CheckBadgeIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface ExtendedAppState extends AppState {
  isDragging: boolean;
  progressStep: number;
  progressPercent: number;
}

const PROGRESS_MESSAGES = [
  "正在识别面部特征...",
  "分析五官比例...",
  "勾勒艺术轮廓...",
  "匹配专属风格色彩...",
  "精细还原服饰细节...",
  "正在进行光影渲染...",
  "即将完成，正在收尾..."
];

const LOCAL_STORAGE_KEY = 'cartoon_avatar_history';

const App: React.FC = () => {
  const [state, setState] = useState<ExtendedAppState>({
    originalImage: null,
    generatedAvatar: null,
    isGenerating: false,
    style: AvatarStyle.PIXAR,
    error: null,
    isDragging: false,
    progressStep: 0,
    progressPercent: 0,
    history: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setState(prev => ({ ...prev, history: parsed }));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.history));
  }, [state.history]);

  // Handle progress animation logic
  useEffect(() => {
    if (state.isGenerating) {
      const startTime = Date.now();
      const expectedDuration = 15000; // Estimated 15s for generation

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawPercent = Math.min((elapsed / expectedDuration) * 100, 98);
        const stepIndex = Math.min(
          Math.floor((rawPercent / 100) * PROGRESS_MESSAGES.length),
          PROGRESS_MESSAGES.length - 1
        );

        setState(prev => ({
          ...prev,
          progressPercent: rawPercent,
          progressStep: stepIndex
        }));
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setState(prev => ({ ...prev, progressPercent: 0, progressStep: 0 }));
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [state.isGenerating]);

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

  const handleRandomStyle = () => {
    if (state.isGenerating) return;
    const styles = Object.values(AvatarStyle);
    const availableStyles = styles.filter(s => s !== state.style);
    const randomStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)];
    setState(prev => ({ ...prev, style: randomStyle }));
  };

  const handleGenerate = async () => {
    if (!state.originalImage) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null, generatedAvatar: null }));
    try {
      const result = await generateAvatar(state.originalImage, state.style);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        originalImage: state.originalImage,
        generatedAvatar: result,
        style: state.style,
        timestamp: Date.now(),
      };

      setState(prev => ({ 
        ...prev, 
        generatedAvatar: result, 
        isGenerating: false, 
        progressPercent: 100,
        history: [newHistoryItem, ...prev.history].slice(0, 20) // Keep last 20
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: err.message || "生成失败，请重试。" 
      }));
    }
  };

  const handleDownload = (imageUrl: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `avatar-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      originalImage: item.originalImage,
      generatedAvatar: item.generatedAvatar,
      style: item.style,
      error: null
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setState(prev => ({
      ...prev,
      history: prev.history.filter(item => item.id !== id)
    }));
  };

  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      setState(prev => ({ ...prev, history: [] }));
    }
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

      <main className="w-full max-w-6xl flex flex-col gap-12">
        
        {/* Creation Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Area */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* Original Image Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider flex justify-between items-center">
                原始照片
                {state.originalImage && <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />}
              </h2>
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
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CameraIcon className="w-5 h-5" />
                  {state.originalImage ? '更换照片' : '上传照片'}
                </button>
              </div>
            </div>

            {/* Generated Avatar Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">生成的头像</h2>
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 relative">
                {state.isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-6 w-full px-8">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <SparklesIcon className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    
                    <div className="w-full space-y-3">
                      <div className="flex justify-between text-xs font-semibold text-indigo-600">
                        <span>{PROGRESS_MESSAGES[state.progressStep]}</span>
                        <span>{Math.round(state.progressPercent)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
                          style={{ width: `${state.progressPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-400 text-center italic">
                        AI 正在深度学习并还原您的特征
                      </p>
                    </div>
                  </div>
                ) : state.generatedAvatar ? (
                  <img src={state.generatedAvatar} alt="Generated Avatar" className="w-full h-full object-cover transition-opacity duration-500" />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <SparklesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">定制您的专属形象</p>
                  </div>
                )}
              </div>
              {state.generatedAvatar && !state.isGenerating && (
                <button 
                  onClick={() => handleDownload(state.generatedAvatar!)}
                  className="mt-4 w-full py-2.5 px-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
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
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">选择卡通风格</label>
                  <button 
                    onClick={handleRandomStyle}
                    disabled={state.isGenerating}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                    随机选择
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(AvatarStyle).map((s) => (
                    <button
                      key={s}
                      disabled={state.isGenerating}
                      onClick={() => setState(prev => ({ ...prev, style: s }))}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border text-center ${
                        state.style === s 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-white disabled:opacity-50'
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
                  className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all relative overflow-hidden group ${
                    !state.originalImage || state.isGenerating
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transform active:scale-95'
                  }`}
                >
                  {state.isGenerating && (
                    <div className="absolute inset-0 bg-white/10 animate-shimmer" style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}></div>
                  )}
                  <ArrowPathIcon className={`w-6 h-6 ${state.isGenerating ? 'animate-spin' : ''}`} />
                  {state.isGenerating ? 'AI 正在全力创作' : '开始魔法生成'}
                </button>
                
                {!state.originalImage && (
                  <p className="text-center text-xs text-slate-400 mt-3 font-medium">请先在左侧上传一张照片</p>
                )}
              </div>

              {state.error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600 leading-relaxed font-medium">{state.error}</p>
                </div>
              )}
            </div>

            <div className="mt-12 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">使用小贴士</h3>
              <ul className="text-sm text-slate-500 space-y-3">
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>直接将图片从文件夹拖入预览框即可上传。</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>照片越清晰，生成的五官相似度越高。</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span>如对结果不满意，可以尝试更换不同风格再次生成。</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* History Section */}
        {state.history.length > 0 && (
          <section className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <ClockIcon className="w-7 h-7 text-indigo-600" />
                创作历史
              </h2>
              <button 
                onClick={handleClearHistory}
                className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                清空记录
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {state.history.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative bg-white rounded-xl border border-slate-200 p-2 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer overflow-hidden"
                  onClick={() => handleSelectHistoryItem(item)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative">
                    <img src={item.generatedAvatar} alt="History Avatar" className="w-full h-full object-cover" />
                    
                    {/* Hover Overlays */}
                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                       <div className="flex gap-2">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDownload(item.generatedAvatar); }}
                           className="p-2 bg-white text-indigo-600 rounded-full shadow-lg hover:scale-110 transition-transform"
                           title="下载"
                         >
                           <ArrowDownTrayIcon className="w-4 h-4" />
                         </button>
                         <button 
                           className="p-2 bg-white text-emerald-600 rounded-full shadow-lg hover:scale-110 transition-transform"
                           title="查看详情"
                         >
                           <EyeIcon className="w-4 h-4" />
                         </button>
                       </div>
                    </div>

                    {/* Delete Button */}
                    <button 
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      className="absolute top-1 right-1 p-1.5 bg-white/90 text-slate-400 rounded-full shadow hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 px-1">
                    <p className="text-[10px] font-bold text-indigo-600 truncate">{item.style}</p>
                    <p className="text-[9px] text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-16 text-slate-400 text-sm flex items-center gap-4">
        <span>Powered by Gemini 2.5 Flash Image</span>
        <span className="text-slate-200">|</span>
        <span>© 2024 Cartoon Creator</span>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default App;
