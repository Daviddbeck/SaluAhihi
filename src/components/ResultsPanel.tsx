import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ProcessedUrl } from '../types';
import ContactCard from './ContactCard';
import ImageGrid from './ImageGrid';
import {
  Mail,
  Phone,
  Building,
  MapPin,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  Twitter,
  Tag,
  StickyNote,
  Copy,
  Check,
  FileText,
  User,
  Sparkles,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Building2
} from 'lucide-react';

interface ResultsPanelProps {
  item: ProcessedUrl;
}

export default function ResultsPanel({ item }: ResultsPanelProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const crawlData = item.crawlData;
  const data = item.extractedData;

  const companiesList = React.useMemo(() => {
    return data?.companies || [];
  }, [data?.companies]);

  const filteredCompanies = React.useMemo(() => {
    if (!searchTerm.trim()) return companiesList;
    const term = searchTerm.toLowerCase();
    return companiesList.filter(c => 
      c.companyName?.toLowerCase().includes(term) ||
      c.emails.some(e => e.toLowerCase().includes(term)) ||
      c.phones.some(p => p.toLowerCase().includes(term)) ||
      c.address?.toLowerCase().includes(term) ||
      c.website?.toLowerCase().includes(term)
    );
  }, [companiesList, searchTerm]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!crawlData || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <Sparkles className="w-10 h-10 mb-3 text-indigo-400 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sẵn sàng trích xuất</h3>
        <p className="text-xs text-center max-w-xs mt-1">
          Nhập một URL ở trên và nhấp Thu thập & Trích xuất để bắt đầu phân tích thông tin liên hệ.
        </p>
      </div>
    );
  }

  // Helper for confidence color
  const confidenceColor = data.confidence >= 0.8 
    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/55'
    : data.confidence >= 0.5 
    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/55'
    : 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/55';

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Info */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              {data.companyName || crawlData.title || new URL(item.url).hostname}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 truncate">
                  {item.url}
                  <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              </span>
              {data.industry && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {data.industry}
                </span>
              )}
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 ${confidenceColor}`}>
            <span>Độ tin cậy AI:</span>
            <span>{(data.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Tabs System */}
      <Tabs.Root defaultValue="contacts" className="flex-1 flex flex-col min-h-0">
        <Tabs.List className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950 px-6 gap-6">
          <Tabs.Trigger
            value="contacts"
            className="py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400 transition-all focus:outline-none"
          >
            Thông tin liên hệ
          </Tabs.Trigger>
          <Tabs.Trigger
            value="images"
            className="py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400 transition-all focus:outline-none"
          >
            Hình ảnh ({data.logoUrl ? 1 : 0 + data.productImages.length + data.teamImages.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="raw"
            className="py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400 transition-all focus:outline-none"
          >
            Nội dung Web thô
          </Tabs.Trigger>
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <Tabs.Content value="contacts" className="space-y-6 focus:outline-none">
            {companiesList.length > 1 ? (
              <div className="space-y-6">
                {/* Search and Summary */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/45">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                      Danh sách doanh nghiệp ({companiesList.length})
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Tìm thấy {companiesList.length} công ty trên trang danh bạ này
                    </p>
                  </div>
                  
                  {/* Search input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm công ty, SĐT, website..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>

                {/* Companies list */}
                {filteredCompanies.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs">Không tìm thấy công ty nào phù hợp với bộ lọc.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCompanies.map((company, index) => {
                      const isExpanded = expandedIndex === index;
                      const letter = company.companyName ? company.companyName.trim().charAt(0).toUpperCase() : 'C';
                      const bgColors = [
                        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', 
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', 
                        'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400', 
                        'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', 
                        'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400'
                      ];
                      const colorIndex = letter.charCodeAt(0) % bgColors.length;
                      const avatarClass = bgColors[colorIndex];

                      return (
                        <div 
                          key={index} 
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden hover:shadow-sm transition-all duration-200"
                        >
                          {/* Main Row */}
                          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Logo & Company Name */}
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              {company.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={company.logoUrl} 
                                  alt={company.companyName || 'Logo'} 
                                  className="w-12 h-12 rounded-xl object-contain border border-slate-200 dark:border-slate-800 bg-white p-1 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                    const parent = (e.target as HTMLElement).parentElement;
                                    if (parent) {
                                      const fallback = parent.querySelector('.avatar-fallback');
                                      if (fallback) fallback.classList.remove('hidden');
                                    }
                                  }}
                                />
                              ) : null}
                              
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 avatar-fallback ${company.logoUrl ? 'hidden' : ''} ${avatarClass}`}>
                                {letter}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {company.companyName || 'Công ty không có tên'}
                                </h4>
                                {company.address && (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-start gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="truncate max-w-lg">{company.address}</span>
                                  </p>
                                )}
                                {company.website && (
                                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5 shrink-0" />
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5 truncate max-w-md">
                                      {company.website}
                                      <ExternalLink className="w-2.5 h-2.5 inline" />
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Middle: Contacts */}
                            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 lg:gap-2 xl:gap-4 shrink-0 justify-end">
                              {/* Phones list */}
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Điện thoại</span>
                                {company.phones.length === 0 ? (
                                  <span className="text-xs text-slate-400 dark:text-slate-600">Trống</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                    {company.phones.slice(0, 2).map((p, i) => {
                                      const id = `phone-${index}-${i}`;
                                      const isCopied = copiedField === id;
                                      return (
                                        <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-650 dark:text-slate-400 font-semibold">
                                          <span>{p}</span>
                                          <button onClick={() => copyToClipboard(p, id)} className="p-0.5 text-slate-400 hover:text-emerald-500 rounded transition-colors">
                                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      );
                                    })}
                                    {company.phones.length > 2 && (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">+{company.phones.length - 2}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Emails list */}
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email</span>
                                {company.emails.length === 0 ? (
                                  <span className="text-xs text-slate-400 dark:text-slate-600">Trống</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                    {company.emails.slice(0, 2).map((e, i) => {
                                      const id = `email-${index}-${i}`;
                                      const isCopied = copiedField === id;
                                      return (
                                        <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-655 dark:text-slate-400 font-medium">
                                          <span className="truncate max-w-[120px]">{e}</span>
                                          <button onClick={() => copyToClipboard(e, id)} className="p-0.5 text-slate-400 hover:text-indigo-500 rounded transition-colors">
                                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      );
                                    })}
                                    {company.emails.length > 2 && (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">+{company.emails.length - 2}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Expand Button */}
                            <div className="flex items-center justify-end shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-850">
                              <button
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                  isExpanded 
                                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200' 
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-400 border-transparent'
                                }`}
                              >
                                <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details section */}
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10 space-y-4 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Industry, Notes, Socials */}
                                <div className="space-y-4">
                                  {company.industry && (
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Lĩnh vực hoạt động</span>
                                      <span className="text-xs text-slate-700 dark:text-slate-350 font-medium block mt-1">{company.industry}</span>
                                    </div>
                                  )}

                                  {company.notes && (
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider block">Ghi chú doanh nghiệp</span>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{company.notes}</p>
                                    </div>
                                  )}

                                  {/* Social Media links */}
                                  {(company.socialMedia?.facebook || company.socialMedia?.linkedin || company.socialMedia?.instagram || company.socialMedia?.twitter) && (
                                    <div className="space-y-1.5">
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider block">Mạng xã hội</span>
                                      <div className="flex gap-2">
                                        {company.socialMedia.facebook && (
                                          <a href={company.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors" title="Facebook">
                                            <Facebook className="w-4 h-4" />
                                          </a>
                                        )}
                                        {company.socialMedia.linkedin && (
                                          <a href={company.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors" title="LinkedIn">
                                            <Linkedin className="w-4 h-4" />
                                          </a>
                                        )}
                                        {company.socialMedia.instagram && (
                                          <a href={company.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors" title="Instagram">
                                            <Instagram className="w-4 h-4" />
                                          </a>
                                        )}
                                        {company.socialMedia.twitter && (
                                          <a href={company.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors" title="Twitter">
                                            <Twitter className="w-4 h-4" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Right Column: Leadership / Contact Persons & Images */}
                                <div className="space-y-4">
                                  {/* Company Logo */}
                                  {company.logoUrl && (
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Logo doanh nghiệp</span>
                                      <div className="flex">
                                        <a 
                                          href={company.logoUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="group relative w-32 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white p-2 shrink-0 block hover:border-indigo-400 transition-colors flex items-center justify-center"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img 
                                            src={company.logoUrl} 
                                            alt={company.companyName || 'Logo'} 
                                            className="max-w-full max-h-full object-contain rounded-md group-hover:scale-105 transition-transform" 
                                          />
                                        </a>
                                      </div>
                                    </div>
                                  )}

                                  {/* Contact Persons */}
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider block mb-1.5">Nhân sự liên hệ ({company.contactPersons?.length || 0})</span>
                                    {!company.contactPersons || company.contactPersons.length === 0 ? (
                                      <span className="text-xs text-slate-450 dark:text-slate-500 italic block">Không phát hiện thông tin nhân sự</span>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {company.contactPersons.map((p, pIdx) => (
                                          <div key={pIdx} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                              <User className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-350 truncate leading-snug">{p.name}</div>
                                              {p.title && <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">{p.title}</div>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Company Images specific */}
                                  {company.images && company.images.length > 0 && (
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block mb-1.5">Hình ảnh doanh nghiệp ({company.images.length})</span>
                                      <div className="flex flex-wrap gap-2">
                                        {company.images.slice(0, 4).map((img, imgIdx) => (
                                          <a 
                                            key={imgIdx} 
                                            href={img} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="group relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white p-0.5 shrink-0 block hover:border-indigo-400 transition-colors"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img} alt="Product/service" className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform" />
                                          </a>
                                        ))}
                                        {company.images.length > 4 && (
                                          <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-bold text-slate-555 dark:text-slate-400">
                                            +{company.images.length - 4}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // This is the original single company view
              <div className="space-y-6">
                {/* Email and Phone Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emails Block */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-indigo-500" />
                      Địa chỉ Email
                    </h3>
                    {data.emails.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                        Không tìm thấy địa chỉ email nào.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {data.emails.map((email) => {
                          const id = `email-${email}`;
                          const isCopied = copiedField === id;
                          return (
                            <div
                              key={email}
                              className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/50 dark:hover:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 group transition-all"
                            >
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-all truncate">{email}</span>
                              <button
                                onClick={() => copyToClipboard(email, id)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-950 rounded-lg shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all shrink-0"
                                title="Sao chép vào bộ nhớ tạm"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Phones Block */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      Số điện thoại
                    </h3>
                    {data.phones.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                        Không tìm thấy số điện thoại nào.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {data.phones.map((phone) => {
                          const id = `phone-${phone}`;
                          const isCopied = copiedField === id;
                          return (
                            <div
                              key={phone}
                              className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/50 dark:hover:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 group transition-all"
                            >
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-all truncate">{phone}</span>
                              <button
                                onClick={() => copyToClipboard(phone, id)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-950 rounded-lg shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all shrink-0"
                                title="Sao chép vào bộ nhớ tạm"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Corporate Profile Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-900">
                  {/* Left Column: Core Fields */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Thông tin doanh nghiệp
                    </h3>

                    {/* Company Name */}
                    <div className="flex gap-3 items-start">
                      <Building className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Tên doanh nghiệp</div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">{data.companyName || 'Không tìm thấy'}</div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex gap-3 items-start">
                      <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ vật lý</div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">{data.address || 'Không tìm thấy'}</div>
                      </div>
                    </div>

                    {/* Website */}
                    <div className="flex gap-3 items-start">
                      <Globe className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Trang web</div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {data.website ? (
                            <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                              {data.website}
                              <ExternalLink className="w-3 h-3 inline" />
                            </a>
                          ) : (
                            'Không tìm thấy'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Social Media */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mạng xã hội
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Facebook */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                        <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Facebook</div>
                          {data.socialMedia?.facebook ? (
                            <a href={data.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold hover:underline truncate block mt-0.5">
                              Link
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-600 block mt-0.5">Trống</span>
                          )}
                        </div>
                      </div>

                      {/* LinkedIn */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                        <Linkedin className="w-4 h-4 text-sky-700 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">LinkedIn</div>
                          {data.socialMedia?.linkedin ? (
                            <a href={data.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold hover:underline truncate block mt-0.5">
                              Link
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-600 block mt-0.5">Trống</span>
                          )}
                        </div>
                      </div>

                      {/* Instagram */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                        <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Instagram</div>
                          {data.socialMedia?.instagram ? (
                            <a href={data.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold hover:underline truncate block mt-0.5">
                              Link
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-600 block mt-0.5">Trống</span>
                          )}
                        </div>
                      </div>

                      {/* Twitter */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                        <Twitter className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Twitter</div>
                          {data.socialMedia?.twitter ? (
                            <a href={data.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold hover:underline truncate block mt-0.5">
                              Link
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-600 block mt-0.5">Trống</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Persons Block */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-900 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    Nhân sự & Ban lãnh đạo ({data.contactPersons.length})
                  </h3>
                  {data.contactPersons.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                      Không phát hiện nhân sự liên hệ nào bằng AI.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {data.contactPersons.map((person, idx) => (
                        <ContactCard key={idx} person={person} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                {data.notes && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-900 bg-amber-50/20 dark:bg-amber-950/5 p-4 rounded-xl border border-amber-200/30 dark:border-amber-900/20">
                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <StickyNote className="w-3.5 h-3.5" />
                      Ghi chú phân tích AI
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {data.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Tabs.Content>

          {/* Tab 2: Images */}
          <Tabs.Content value="images" className="focus:outline-none">
            <ImageGrid
              logoUrl={data.logoUrl}
              productImages={data.productImages}
              teamImages={data.teamImages}
              allImages={crawlData.images ? crawlData.images.map(img => typeof img === 'string' ? img : img.url) : []}
            />
          </Tabs.Content>

          {/* Tab 3: Raw Data */}
          <Tabs.Content value="raw" className="space-y-4 focus:outline-none">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/65 dark:border-slate-800/65 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Nội dung văn bản thô: {crawlData.text.length.toLocaleString()} ký tự (giới hạn tối đa 30k)
              </span>
              <button
                onClick={() => copyToClipboard(crawlData.text, 'rawText')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 transition-all"
              >
                {copiedField === 'rawText' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép văn bản thô</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-900 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-450 h-96 overflow-y-auto whitespace-pre-wrap select-all">
              {crawlData.text || 'Không có văn bản nào được trích xuất.'}
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
