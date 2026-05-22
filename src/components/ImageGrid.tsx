import React from 'react';
import { Image as ImageIcon, ExternalLink, Copy, Check } from 'lucide-react';

interface ImageGridProps {
  logoUrl: string | null;
  productImages: string[];
  teamImages: string[];
  allImages: string[];
}

interface ImageItem {
  url: string;
  category: 'Logo' | 'Sản phẩm' | 'Đội ngũ' | 'Chưa phân loại';
}

export default function ImageGrid({ logoUrl, productImages, teamImages, allImages }: ImageGridProps) {
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  const imagesList = React.useMemo(() => {
    const list: ImageItem[] = [];
    const processedUrls = new Set<string>();

    if (logoUrl) {
      list.push({ url: logoUrl, category: 'Logo' });
      processedUrls.add(logoUrl);
    }

    teamImages.forEach(url => {
      if (url && !processedUrls.has(url)) {
        list.push({ url, category: 'Đội ngũ' });
        processedUrls.add(url);
      }
    });

    productImages.forEach(url => {
      if (url && !processedUrls.has(url)) {
        list.push({ url, category: 'Sản phẩm' });
        processedUrls.add(url);
      }
    });

    // Add remaining crawled images as uncategorized
    allImages.forEach(url => {
      if (url && !processedUrls.has(url)) {
        list.push({ url, category: 'Chưa phân loại' });
        processedUrls.add(url);
      }
    });

    return list;
  }, [logoUrl, productImages, teamImages, allImages]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (imagesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs">Không có hình ảnh nào được trích xuất từ trang này.</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {imagesList.map((img, idx) => {
        const isCopied = copiedUrl === img.url;
        
        return (
          <div
            key={idx}
            className="group relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-48"
          >
            {/* Image display */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`${img.category} ${idx}`}
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback for failed images
                  (e.target as HTMLElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    const placeholder = parent.querySelector('.img-error-placeholder');
                    if (placeholder) {
                      placeholder.classList.remove('hidden');
                    }
                  }
                }}
              />
              {/* Fallback element */}
              <div className="img-error-placeholder hidden flex-col items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span className="text-[9px] mt-1 text-center truncate max-w-[120px]">Lỗi tải ảnh</span>
              </div>

              {/* Float action buttons on hover */}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyToClipboard(img.url)}
                  className="p-2 bg-white text-slate-800 hover:bg-slate-100 rounded-lg shadow-lg transition-transform hover:scale-110"
                  title="Sao chép URL hình ảnh"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white text-slate-800 hover:bg-slate-100 rounded-lg shadow-lg transition-transform hover:scale-110"
                  title="Mở trong tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Image footer with category and URL */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    img.category === 'Logo'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      : img.category === 'Đội ngũ'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : img.category === 'Sản phẩm'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {img.category}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate select-all flex-1 text-right">
                  {img.url.split('/').pop() || 'image'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
