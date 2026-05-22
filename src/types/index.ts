export interface CrawledImage {
  url: string;
  alt: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  text: string;
  images: CrawledImage[];
  links: string[];
  status: 'success' | 'failed';
  error?: string;
}

export interface ContactPerson {
  name: string;
  title: string;
}

export interface SocialMedia {
  facebook?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  twitter?: string | null;
}

export interface CompanyInfo {
  companyName: string | null;
  emails: string[];
  phones: string[];
  address: string | null;
  website: string | null;
  logoUrl: string | null;
  images?: string[];
  socialMedia?: SocialMedia;
  contactPersons?: ContactPerson[];
  industry?: string | null;
  notes?: string | null;
}

export interface ExtractionResult {
  companies?: CompanyInfo[];
  pageType?: 'single_company' | 'directory_listing' | 'other';
  
  // Legacy / single company root fields for backwards compatibility
  emails: string[];
  phones: string[];
  companyName: string | null;
  contactPersons: ContactPerson[];
  address: string | null;
  website: string | null;
  socialMedia: SocialMedia;
  industry: string | null;
  logoUrl: string | null;
  productImages: string[];
  teamImages: string[];
  confidence: number;
  notes: string | null;
}

export interface ProcessedUrl {
  id: string;
  url: string;
  status: 'idle' | 'crawling' | 'extracting' | 'completed' | 'failed';
  error?: string;
  crawlData?: CrawlResult;
  extractedData?: ExtractionResult;
  timestamp: number;
}
