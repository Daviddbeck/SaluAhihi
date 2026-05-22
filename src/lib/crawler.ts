import * as cheerio from 'cheerio';
import { CrawlResult, CrawledImage } from '../types';

// Helper to resolve relative URLs to absolute
export function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

// Basic robots.txt parser
export async function checkRobotsTxt(url: string, userAgent = '*'): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
    
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) return true; // Assume permitted if no robots.txt or error
    
    const text = await res.text();
    const lines = text.split('\n');
    let currentAgent = '';
    let isAllowed = true;
    
    const relativePath = parsedUrl.pathname + parsedUrl.search;
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;
      
      const parts = cleanLine.split(':');
      if (parts.length < 2) continue;
      
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim();
      
      if (key === 'user-agent') {
        currentAgent = val.toLowerCase();
      } else if (currentAgent === '*' || currentAgent === userAgent.toLowerCase()) {
        if (key === 'disallow') {
          if (!val) continue; // Allow all
          
          // Match path prefix rules
          const regexPattern = '^' + val.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*');
          if (new RegExp(regexPattern).test(relativePath)) {
            isAllowed = false;
          }
        } else if (key === 'allow') {
          const regexPattern = '^' + val.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*');
          if (new RegExp(regexPattern).test(relativePath)) {
            isAllowed = true;
          }
        }
      }
    }
    
    return isAllowed;
  } catch {
    clearTimeout(timeoutId);
    return true; // Safe fallback
  }
}

// Helper to check if an image is likely a company logo
export function isLikelyLogo(src: string, alt: string, classAndId: string): boolean {
  const urlLower = src.toLowerCase();
  const altLower = alt.toLowerCase();
  const classIdLower = classAndId.toLowerCase();

  // Exclusions (common standard social icons, certification badges, etc.)
  if (
    urlLower.includes('daxacthuc') ||
    urlLower.includes('bocongthuong') ||
    urlLower.includes('dmca') ||
    urlLower.includes('zalo_txt') ||
    urlLower.includes('icon-sponsor') ||
    urlLower.includes('5_diamond') ||
    urlLower.includes('facebook') ||
    urlLower.includes('youtube') ||
    urlLower.includes('twitter') ||
    urlLower.includes('instagram') ||
    urlLower.includes('linkedin') ||
    urlLower.includes('pinterest')
  ) {
    return false;
  }

  // Check if image URL contains logo patterns
  if (
    urlLower.includes('logo') || 
    urlLower.includes('brand') || 
    urlLower.includes('avatar') || 
    urlLower.includes('favicon')
  ) {
    return true;
  }

  // Check if alt text contains logo terms
  if (
    altLower.includes('logo') || 
    altLower.includes('biểu trưng') || 
    altLower.includes('nhãn hiệu') || 
    altLower.includes('avatar')
  ) {
    return true;
  }

  // Check if class/id of image or parent contains logo terms
  if (
    classIdLower.includes('logo') || 
    classIdLower.includes('brand') || 
    classIdLower.includes('avatar')
  ) {
    return true;
  }

  return false;
}

export async function crawlWebsite(url: string, respectRobots = false): Promise<CrawlResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds limit
  
  try {
    // Validate URL format
    const parsedUrl = new URL(url);
    
    // Check robots.txt if needed
    if (respectRobots) {
      const allowed = await checkRobotsTxt(url);
      if (!allowed) {
        throw new Error('Crawling blocked by robots.txt');
      }
    }
    
    // Perform HTML fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract metadata
    const title = $('title').text().trim() || parsedUrl.hostname;
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';

    // Extract unique absolute links (DO BEFORE modifying DOM)
    const linksSet = new Set<string>();
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const absoluteUrl = resolveUrl(url, href);
        // Only keep links within the same domain to prevent uncontrolled spidering
        try {
          const linkDomain = new URL(absoluteUrl).hostname;
          if (linkDomain === parsedUrl.hostname && absoluteUrl !== url) {
            linksSet.add(absoluteUrl);
          }
        } catch {
          // Ignore invalid href
        }
      }
    });
    const links = Array.from(linksSet);

    // Extract unique absolute logo images (DO BEFORE modifying DOM)
    const imagesMap = new Map<string, CrawledImage>();
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        const absoluteUrl = resolveUrl(url, src);
        if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
          const alt = $(element).attr('alt')?.trim() || '';
          const id = $(element).attr('id') || '';
          const className = $(element).attr('class') || '';
          
          // Also look at parent container attributes (up to 3 levels)
          let parentAttributes = '';
          $(element).parents().slice(0, 3).each((_, parent) => {
            parentAttributes += ' ' + ($(parent).attr('class') || '') + ' ' + ($(parent).attr('id') || '');
          });

          const classAndId = id + ' ' + className + ' ' + parentAttributes;

          if (isLikelyLogo(absoluteUrl, alt, classAndId)) {
            imagesMap.set(absoluteUrl, { url: absoluteUrl, alt });
          }
        }
      }
    });

    // Fallback: If no logos are found, extract first 15 images on the page
    if (imagesMap.size === 0) {
      $('img').each((_, element) => {
        if (imagesMap.size >= 15) return;
        const src = $(element).attr('src');
        if (src) {
          const absoluteUrl = resolveUrl(url, src);
          if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
            const alt = $(element).attr('alt')?.trim() || '';
            imagesMap.set(absoluteUrl, { url: absoluteUrl, alt });
          }
        }
      });
    }
    const images = Array.from(imagesMap.values());
    
    // Now perform DOM cleanup for extracting clean text content
    // Remove unwanted script, style, iframe, noscript blocks to get clean text
    $('script, style, iframe, noscript, svg, header, footer, nav').remove();
    
    // Add spacing and newlines around block-level elements to preserve page layout structure
    $('h1, h2, h3, h4, h5, h6, p, div, li, tr, td, th, blockquote, article, section').each((_, el) => {
      $(el).prepend(' ');
      $(el).append('\n');
    });
    
    // Extract text content cleanly by collapsing whitespaces and multi-newlines
    const text = $('body').text()
      .replace(/[ \t]+/g, ' ')
      .replace(/\r/g, '')
      .replace(/\n\s*\n+/g, '\n\n')
      .slice(0, 30000)
      .trim();
    
    return {
      url,
      title,
      metaDescription,
      text,
      images,
      links,
      status: 'success'
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      url,
      title: '',
      metaDescription: '',
      text: '',
      images: [],
      links: [],
      status: 'failed',
      error: errorMsg || 'Unknown crawling error occurred'
    };
  }
}
