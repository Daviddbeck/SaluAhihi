import React from 'react';
import { ProcessedUrl } from '../types';
import { Trash2, Link2, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';

interface HistorySidebarProps {
  history: ProcessedUrl[];
  onSelect: (item: ProcessedUrl) => void;
  onClear: () => void;
  onDeleteOne: (id: string) => void;
  activeId?: string;
}

export default function HistorySidebar({
  history,
  onSelect,
  onClear,
  onDeleteOne,
  activeId
}: HistorySidebarProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredHistory = React.useMemo(() => {
    return history.filter((item) =>
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.extractedData?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  return (
    <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
            Lịch sử thu thập
          </h2>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30"
              title="Xóa toàn bộ lịch sử"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm kiếm lịch sử..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
            {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có URL nào được thu thập.'}
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isCompleted = item.status === 'completed';
            const isFailed = item.status === 'failed';
            const companyName = item.extractedData?.companyName;
            const emailsCount = item.extractedData?.emails.length || 0;
            const phonesCount = item.extractedData?.phones.length || 0;
            
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  activeId === item.id
                    ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900'
                    : 'bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 pr-6">
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      {isFailed && (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      {!isCompleted && !isFailed && (
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      )}
                      <span className="truncate">{companyName || new URL(item.url).hostname}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <Link2 className="w-3 h-3 text-slate-400" />
                      <span className="truncate hover:underline">{item.url}</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOne(item.id);
                    }}
                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa mục này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                      {emailsCount}E • {phonesCount}P
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
