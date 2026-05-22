import React from 'react';
import { FileSpreadsheet, FileJson } from 'lucide-react';
import { ProcessedUrl } from '../types';
import { exportToCSV, exportToJSON } from '../lib/exportUtils';

interface ExportButtonProps {
  items: ProcessedUrl[];
}

export default function ExportButton({ items }: ExportButtonProps) {
  const successItems = React.useMemo(() => {
    return items.filter(item => item.status === 'completed' && item.extractedData);
  }, [items]);

  const isDisabled = successItems.length === 0;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToCSV(successItems)}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        title={isDisabled ? 'Không có dữ liệu để xuất' : 'Xuất danh sách liên hệ đã trích xuất thành công dưới dạng CSV'}
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>Xuất CSV ({successItems.length})</span>
      </button>

      <button
        onClick={() => exportToJSON(successItems)}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        title={isDisabled ? 'Không có dữ liệu để xuất' : 'Xuất toàn bộ kết quả thô dưới dạng JSON'}
      >
        <FileJson className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <span>Xuất JSON</span>
      </button>
    </div>
  );
}
