import React from 'react';
import { Play, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ProcessedUrl } from '../types';

interface BulkUploaderProps {
  onStartBulk: (urls: string[]) => void;
  bulkQueue: ProcessedUrl[];
  isProcessing: boolean;
}

export default function BulkUploader({ onStartBulk, bulkQueue, isProcessing }: BulkUploaderProps) {
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState('');

  const handleStart = () => {
    setError('');
    const urls = text
      .split('\n')
      .map(url => url.trim())
      .filter(url => {
        if (!url) return false;
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

    if (urls.length === 0) {
      setError('Vui lòng nhập ít nhất một URL hợp lệ (bao gồm cả http:// hoặc https://)');
      return;
    }

    onStartBulk(urls);
  };

  const completedCount = bulkQueue.filter(item => item.status === 'completed').length;
  const failedCount = bulkQueue.filter(item => item.status === 'failed').length;
  const processingCount = bulkQueue.filter(item => ['crawling', 'extracting'].includes(item.status)).length;
  const totalCount = bulkQueue.length;
  const percent = totalCount > 0 ? Math.round(((completedCount + failedCount) / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Danh sách URL (Mỗi dòng một URL)
        </label>
        <textarea
          rows={6}
          placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError('');
          }}
          disabled={isProcessing}
          className={`w-full p-3 rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition-all font-mono text-xs ${
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        />
        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 pl-1">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Các URL không hợp lệ hoặc trống sẽ được tự động lọc bỏ.
        </div>
        <button
          onClick={handleStart}
          disabled={isProcessing || !text.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý hàng đợi...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Bắt đầu thu thập hàng loạt</span>
            </>
          )}
        </button>
      </div>

      {bulkQueue.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
          {/* Progress Bar Header */}
          <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                Tiến trình hàng đợi
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />}
              </span>
              <span>
                Đã hoàn thành {completedCount + failedCount} / {totalCount} ({percent}%)
              </span>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex gap-4 mt-1 text-[10px] font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {completedCount} Thành công
              </span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {failedCount} Thất bại
              </span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {processingCount} Đang xử lý
              </span>
            </div>
          </div>

          {/* Queue list */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
            {bulkQueue.map((item, idx) => {
              const companyName = item.extractedData?.companyName;
              return (
                <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-100/50 dark:hover:bg-slate-900/30">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {idx + 1}. {companyName || new URL(item.url).hostname}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{item.url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'idle' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Đang chờ
                      </span>
                    )}
                    {item.status === 'crawling' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang thu thập
                      </span>
                    )}
                    {item.status === 'extracting' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> AI Trích xuất
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-1"
                        title={item.error}
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Thất bại
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
