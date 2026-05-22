'use client';

import React, { useState, useEffect } from 'react';
import HistorySidebar from '../components/HistorySidebar';
import UrlInput from '../components/UrlInput';
import BulkUploader from '../components/BulkUploader';
import ResultsPanel from '../components/ResultsPanel';
import ExportButton from '../components/ExportButton';
import { ProcessedUrl } from '../types';
import { 
  Sparkles, 
  Mail, 
  Phone, 
  Image as ImageIcon, 
  Sun, 
  Moon, 
  Globe2, 
  Layers,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'error' | 'info';
}

export default function Home() {
  // Theme & State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [history, setHistory] = useState<ProcessedUrl[]>([]);
  const [activeItem, setActiveItem] = useState<ProcessedUrl | null>(null);
  
  // Single url state
  const [isLoading, setIsLoading] = useState(false);
  
  // Bulk state
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<ProcessedUrl[]>([]);
  
  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Gemini API Key Client-Side State
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Load theme and history from localStorage on mount (prevents hydration mismatch)
  useEffect(() => {
    // Theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // History
    const savedHistory = localStorage.getItem('crawl_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as ProcessedUrl[];
        setHistory(parsed);
        if (parsed.length > 0) {
          setActiveItem(parsed[0]);
        }
      } catch (e) {
        console.error('Error parsing history:', e);
      }
    }

    // Load Gemini API Key
    const savedApiKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(savedApiKey);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (title: string, description: string, type: 'success' | 'error' | 'info') => {
    const newToast: Toast = {
      id: Math.random().toString(36).substring(7),
      title,
      description,
      type
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      removeToast(newToast.id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Single URL Crawl & AI Extract
  const handleSingleSubmit = async (url: string, respectRobots: boolean, depthCrawl: boolean) => {
    if (!apiKey) {
      showToast('Yêu cầu API Key', 'Vui lòng cấu hình Gemini API Key của bạn trong phần Cài đặt trước.', 'error');
      setIsSettingsOpen(true);
      return;
    }
    setIsLoading(true);
    const tempId = Math.random().toString(36).substring(7);
    
    const initialItem: ProcessedUrl = {
      id: tempId,
      url,
      status: 'crawling',
      timestamp: Date.now()
    };

    setActiveItem(initialItem);

    try {
      // Step A: Web Crawling
      const crawlRes = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, respectRobots, depthCrawl })
      });

      if (!crawlRes.ok) {
        const errData = await crawlRes.json();
        throw new Error(errData.error || `Crawling failed (HTTP ${crawlRes.status})`);
      }

      const crawlData = await crawlRes.json();
      
      // Update state to extracting
      const crawlingStateItem: ProcessedUrl = {
        ...initialItem,
        status: 'extracting',
        crawlData
      };
      setActiveItem(crawlingStateItem);

      // Step B: AI Extraction
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, text: crawlData.text, images: crawlData.images, apiKey })
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json();
        throw new Error(errData.error || `AI Extraction failed (HTTP ${extractRes.status})`);
      }

      const extractedData = await extractRes.json();

      // Step C: Success
      const completedItem: ProcessedUrl = {
        ...initialItem,
        status: 'completed',
        crawlData,
        extractedData,
        timestamp: Date.now()
      };

      setActiveItem(completedItem);
      setHistory(prev => {
        const updated = [completedItem, ...prev];
        localStorage.setItem('crawl_history', JSON.stringify(updated));
        return updated;
      });

      showToast('Trích xuất hoàn thành', `Đã xử lý thành công trang ${new URL(url).hostname}`, 'success');

    } catch (error: unknown) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : String(error);
      const failedItem: ProcessedUrl = {
        ...initialItem,
        status: 'failed',
        error: errMsg || 'Đã xảy ra lỗi',
        timestamp: Date.now()
      };

      setActiveItem(failedItem);
      setHistory(prev => {
        const updated = [failedItem, ...prev];
        localStorage.setItem('crawl_history', JSON.stringify(updated));
        return updated;
      });

      showToast('Trích xuất thất bại', errMsg || 'Không thể xử lý trang web.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Bulk URLs Crawler Queue
  const handleStartBulk = async (urls: string[]) => {
    if (!apiKey) {
      showToast('Yêu cầu API Key', 'Vui lòng cấu hình Gemini API Key của bạn trong phần Cài đặt trước.', 'error');
      setIsSettingsOpen(true);
      return;
    }
    setIsBulkProcessing(true);
    
    // Initialize bulk queue
    const queue = urls.map(url => ({
      id: Math.random().toString(36).substring(7),
      url,
      status: 'idle' as const,
      timestamp: Date.now()
    }));
    
    setBulkQueue(queue);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      
      // Update queue state: crawling
      setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'crawling' } : q));

      try {
        // Step A: Crawl
        const crawlRes = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url, respectRobots: true, depthCrawl: false })
        });

        if (!crawlRes.ok) {
          const errData = await crawlRes.json();
          throw new Error(errData.error || 'Crawl failed');
        }

        const crawlData = await crawlRes.json();

        // Update queue state: extracting
        setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'extracting', crawlData } : q));

        // Step B: Extract
        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url, text: crawlData.text, images: crawlData.images, apiKey })
        });

        if (!extractRes.ok) {
          const errData = await extractRes.json();
          throw new Error(errData.error || 'AI extraction failed');
        }

        const extractedData = await extractRes.json();

        // Update queue state: completed
        const completedItem: ProcessedUrl = {
          ...item,
          status: 'completed',
          crawlData,
          extractedData,
          timestamp: Date.now()
        };

        setBulkQueue(prev => prev.map(q => q.id === item.id ? completedItem : q));
        
        // Save to general history list
        setHistory(prev => {
          const updated = [completedItem, ...prev];
          localStorage.setItem('crawl_history', JSON.stringify(updated));
          return updated;
        });

        setActiveItem(completedItem);
        showToast('Trích xuất hàng loạt thành công', `Đã xử lý xong ${new URL(item.url).hostname}`, 'success');

      } catch (err: unknown) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : String(err);
        const failedItem: ProcessedUrl = {
          ...item,
          status: 'failed',
          error: errMsg || 'Xử lý trong hàng đợi thất bại',
          timestamp: Date.now()
        };

        setBulkQueue(prev => prev.map(q => q.id === item.id ? failedItem : q));
        
        setHistory(prev => {
          const updated = [failedItem, ...prev];
          localStorage.setItem('crawl_history', JSON.stringify(updated));
          return updated;
        });
        
        showToast('Lỗi URL hàng loạt', `Thất bại khi xử lý ${new URL(item.url).hostname}: ${errMsg}`, 'error');
      }
    }
    setIsBulkProcessing(false);
  };

  // 3. Clear and deletion actions
  const handleClearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?')) {
      setHistory([]);
      localStorage.removeItem('crawl_history');
      setActiveItem(null);
      showToast('Đã xóa lịch sử', 'Tất cả các bản ghi thu thập đã được xóa.', 'info');
    }
  };

  const handleDeleteOne = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('crawl_history', JSON.stringify(updated));
      return updated;
    });
    if (activeItem?.id === id) {
      setActiveItem(null);
    }
  };

  const handleSelectHistoryItem = (item: ProcessedUrl) => {
    setActiveItem(item);
  };

  // 4. Aggregate stats from history items
  const stats = React.useMemo(() => {
    let emails = 0;
    let phones = 0;
    let images = 0;

    history.forEach(item => {
      if (item.status === 'completed' && item.extractedData) {
        const d = item.extractedData;
        if (d.companies && d.companies.length > 0) {
          d.companies.forEach(c => {
            emails += c.emails?.length || 0;
            phones += c.phones?.length || 0;
          });
        } else {
          emails += d.emails?.length || 0;
          phones += d.phones?.length || 0;
        }
      }
      if (item.crawlData?.images) {
        images += item.crawlData.images.length;
      }
    });

    return { emails, phones, images };
  }, [history]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* History Sidebar */}
      <HistorySidebar
        history={history}
        onSelect={handleSelectHistoryItem}
        onClear={handleClearHistory}
        onDeleteOne={handleDeleteOne}
        activeId={activeItem?.id}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        {/* Navigation / Header */}
        <header className="px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-bold text-slate-800 dark:text-slate-100 leading-tight">Prospector AI</h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Trích xuất Liên hệ Web</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ExportButton items={history} />
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all relative"
              title="Cài đặt"
            >
              <Settings className="w-4 h-4" />
              {!apiKey && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse border border-white dark:border-slate-950" />
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Chuyển chế độ Giao diện"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Contents Area */}
        <main className="p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {/* Stats Bar */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat: Emails */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/40 dark:border-indigo-900/30">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số Email đã trích xuất</span>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{stats.emails}</h3>
              </div>
            </div>

            {/* Stat: Phones */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/40 dark:border-emerald-900/30">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số Điện thoại đã trích xuất</span>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{stats.phones}</h3>
              </div>
            </div>

            {/* Stat: Images */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-100/40 dark:border-cyan-900/30">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số Hình ảnh đã xử lý</span>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{stats.images}</h3>
              </div>
            </div>
          </section>

          {/* Input Panel Controls */}
          <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            {/* Input Mode Selector Tabs */}
            <div className="flex gap-4 border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
              <button
                onClick={() => setActiveTab('single')}
                disabled={isBulkProcessing}
                className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all flex items-center gap-1.5 focus:outline-none ${
                  activeTab === 'single'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                } disabled:opacity-55`}
              >
                <Globe2 className="w-4 h-4" />
                Một URL
              </button>
              
              <button
                onClick={() => setActiveTab('bulk')}
                disabled={isLoading}
                className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all flex items-center gap-1.5 focus:outline-none ${
                  activeTab === 'bulk'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                } disabled:opacity-55`}
              >
                <Layers className="w-4 h-4" />
                Nhiều URL (Hàng loạt)
              </button>
            </div>

            {activeTab === 'single' ? (
              <UrlInput onSubmit={handleSingleSubmit} isLoading={isLoading} />
            ) : (
              <BulkUploader
                onStartBulk={handleStartBulk}
                bulkQueue={bulkQueue}
                isProcessing={isBulkProcessing}
              />
            )}
          </section>

          {/* Results displaying panel */}
          <section className="min-h-[400px]">
            {/* Loading skeletons while crawling/extracting */}
            {isLoading && activeItem?.status === 'crawling' && (
              <div className="space-y-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-850 rounded-lg" />
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg" />
                </div>
                <div className="space-y-3 pt-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-5/6" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-4/5" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-850 rounded-xl w-32 mt-6" />
                </div>
                <div className="flex items-center gap-2.5 mt-8 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang thu thập dữ liệu HTML của trang web mục tiêu...</span>
                </div>
              </div>
            )}

            {isLoading && activeItem?.status === 'extracting' && (
              <div className="space-y-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-850 rounded-lg" />
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg" />
                </div>
                <div className="space-y-3 pt-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-5/6" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-850 rounded-xl w-32 mt-6" />
                </div>
                <div className="flex items-center gap-2.5 mt-8 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gemini 2.5 Flash đang trích xuất dữ liệu liên hệ...</span>
                </div>
              </div>
            )}

            {/* Normal Display of Active Item */}
            {(!isLoading || (activeItem && activeItem.status !== 'crawling' && activeItem.status !== 'extracting')) && activeItem && (
              <ResultsPanel item={activeItem} />
            )}

            {/* If no items selected/available */}
            {!activeItem && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <Sparkles className="w-10 h-10 mb-3 text-indigo-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sẵn sàng trích xuất</h3>
                <p className="text-xs text-center max-w-xs mt-1">
                  Nhập một URL ở trên và nhấp Thu thập & Trích xuất để bắt đầu phân tích thông tin liên hệ.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in mx-4">
            {/* Close button */}
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-405 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100">Cài đặt</h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Gemini API Key
                </label>
                <div className="relative flex items-center">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="Nhập mã Gemini API Key của bạn..."
                    value={apiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setApiKey(val);
                      localStorage.setItem('gemini_api_key', val);
                    }}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 rounded"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-405 dark:text-slate-400 leading-normal mt-1">
                  API Key của bạn được lưu cục bộ trên trình duyệt của bạn và không bao giờ được lưu trữ trên máy chủ. Bạn có thể lấy API Key miễn phí từ{' '}
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setApiKey('');
                    localStorage.removeItem('gemini_api_key');
                    showToast('Đã xóa API Key', 'Gemini API Key đã được xóa khỏi bộ nhớ cục bộ.', 'info');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                >
                  Xóa Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    if (apiKey) {
                      showToast('Đã lưu API Key', 'Cấu hình Gemini API Key thành công.', 'success');
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-650 text-white rounded-xl transition-colors shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Area */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-slide-in relative overflow-hidden group"
          >
            {/* Color Accent Indicator */}
            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
            }`} />

            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-500" />}
            </div>

            {/* Text */}
            <div className="flex-1 pr-4 min-w-0">
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate">{toast.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{toast.description}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute right-2 top-2 p-1 text-slate-405 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
