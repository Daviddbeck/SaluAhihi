import { NextResponse } from 'next/server';
import { extractContactInfo } from '../../../lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url, text, images, apiKey } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required for context.' },
        { status: 400 }
      );
    }
    
    if (text === undefined) {
      return NextResponse.json(
        { error: 'Text content is required for extraction.' },
        { status: 400 }
      );
    }
    
    // Call the Gemini service
    const extractedData = await extractContactInfo(url, text, images || [], apiKey);
    
    return NextResponse.json(extractedData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Extract API error:', err);
    return NextResponse.json(
      { error: errorMsg || 'An unexpected error occurred during AI extraction.' },
      { status: 500 }
    );
  }
}
