import React from 'react';
import { Search, Loader2, Info } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string, respectRobots: boolean, depthCrawl: boolean) => void;
  isLoading: boolean;
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = React.useState('');
  const [respectRobots, setRespectRobots] = React.useState(true);
  const [depthCrawl, setDepthCrawl] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Vui lòng nhập đường dẫn website (URL).');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError('Định dạng URL không hợp lệ. Đảm bảo có chứa http:// hoặc https://');
      return;
    }

    onSubmit(trimmedUrl, respectRobots, depthCrawl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Đường dẫn Website (URL)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition-all ${
                error
                  ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-75 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Thu thập & Trích xuất</span>
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 pl-1">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/40 text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
          <input
            type="checkbox"
            checked={respectRobots}
            onChange={(e) => setRespectRobots(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
          />
          <span>Tuân thủ robots.txt</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
          <input
            type="checkbox"
            checked={depthCrawl}
            onChange={(e) => setDepthCrawl(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
          />
          <span className="flex items-center gap-1">
            Thu thập sâu (thêm 1 cấp liên kết)
            <span className="text-[10px] text-slate-400" title="Thu thập thêm các liên kết trên trang chính để tìm kiếm thông tin liên hệ.">
              <Info className="w-3.5 h-3.5" />
            </span>
          </span>
        </label>
      </div>
    </form>
  );
}
