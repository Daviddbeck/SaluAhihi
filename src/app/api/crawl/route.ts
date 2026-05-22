import { NextResponse } from 'next/server';
import { crawlWebsite } from '../../../lib/crawler';

const rateLimitMap = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const activeTimestamps = timestamps.filter(ts => now - ts < WINDOW_MS);
  
  if (activeTimestamps.length >= MAX_REQUESTS) {
    rateLimitMap.set(ip, activeTimestamps);
    return false;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(ip, activeTimestamps);
  return true;
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 crawls per minute.' },
        { status: 429 }
      );
    }
    
    const body = await request.json().catch(() => ({}));
    const { url, respectRobots, depthCrawl } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required.' },
        { status: 400 }
      );
    }
    
    // 1. Crawl the main page
    const mainCrawl = await crawlWebsite(url, !!respectRobots);
    
    if (mainCrawl.status === 'failed') {
      return NextResponse.json(
        { error: mainCrawl.error || 'Failed to crawl website.' },
        { status: 422 }
      );
    }
    
    // 2. Perform depth crawl if requested
    if (depthCrawl && mainCrawl.links.length > 0) {
      // Limit depth crawl to first 4 internal links to keep response time reasonable (<15s)
      const targetLinks = mainCrawl.links.slice(0, 4);
      
      const subCrawlsPromises = targetLinks.map(link => 
        crawlWebsite(link, !!respectRobots).catch(() => null)
      );
      
      const subCrawlsResults = await Promise.all(subCrawlsPromises);
      
      let combinedText = mainCrawl.text;
      const combinedImagesMap = new Map<string, any>();
      mainCrawl.images.forEach(img => {
        const urlKey = typeof img === 'string' ? img : img.url;
        const obj = typeof img === 'string' ? { url: img, alt: '' } : img;
        combinedImagesMap.set(urlKey, obj);
      });
      const combinedLinks = new Set<string>(mainCrawl.links);
      
      for (const subCrawl of subCrawlsResults) {
        if (subCrawl && subCrawl.status === 'success') {
          // Merge text
          if (subCrawl.text) {
            combinedText += '\n\n' + subCrawl.text;
          }
          // Merge images
          subCrawl.images.forEach(img => {
            const urlKey = typeof img === 'string' ? img : img.url;
            const obj = typeof img === 'string' ? { url: img, alt: '' } : img;
            if (!combinedImagesMap.has(urlKey)) {
              combinedImagesMap.set(urlKey, obj);
            }
          });
          // Merge links
          subCrawl.links.forEach(link => combinedLinks.add(link));
        }
      }
      
      // Re-truncate to 30,000 characters limit
      mainCrawl.text = combinedText.slice(0, 30000).trim();
      mainCrawl.images = Array.from(combinedImagesMap.values());
      mainCrawl.links = Array.from(combinedLinks);
    }
    
    return NextResponse.json(mainCrawl);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Crawl API error:', err);
    return NextResponse.json(
      { error: errorMsg || 'An unexpected error occurred during crawling.' },
      { status: 500 }
    );
  }
}
