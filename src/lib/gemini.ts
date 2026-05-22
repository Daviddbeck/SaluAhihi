import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractionResult, CrawledImage } from '../types';

interface RawCompanyInfo {
  companyName?: string | null;
  emails?: string[];
  phones?: string[];
  address?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  images?: string[];
  socialMedia?: {
    facebook?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    twitter?: string | null;
  } | null;
  contactPersons?: { name: string; title?: string | null }[];
  industry?: string | null;
  notes?: string | null;
}

interface RawParsedData {
  companies?: RawCompanyInfo[];
  companyName?: string | null;
  emails?: string[];
  phones?: string[];
  address?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  productImages?: string[];
  socialMedia?: {
    facebook?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    twitter?: string | null;
  } | null;
  contactPersons?: { name: string; title?: string | null }[];
  industry?: string | null;
  notes?: string | null;
  pageType?: 'single_company' | 'directory_listing' | 'other';
  confidence?: number;
}

export async function extractContactInfo(
  url: string,
  text: string,
  images: CrawledImage[],
  userApiKey?: string
): Promise<ExtractionResult> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng thiết lập trong phần Cài đặt.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use gemini-2.5-flash as specified
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
  });

  const prompt = `You are a contact information extractor for sales prospecting.
Your job is to analyze the webpage content and extract information for ALL companies mentioned on the page.

IMPORTANT INSTRUCTIONS:
1. Page Type Classification:
   - Determine if this page is a "single_company" website, a "directory_listing" (like a listing or catalog page showing multiple companies), or "other". Set the "pageType" field accordingly.
   - If the page lists multiple different companies (e.g. search results, directory list, catalog), it is a "directory_listing".

2. Extract EVERY single company:
   - If the page is a "directory_listing", you MUST extract details of ALL companies listed on the page. For example, if there are 10 companies listed on the page (e.g. Mison Trans, Logistics Vinalink, Logistic T-H, VOSA DANANG, etc.), you MUST extract all of them. DO NOT stop after the first company! Extract every single one of them.
   - If the page is about one single company, the "companies" array should have exactly 1 item.

3. For each company in the list, extract:
   - "companyName": Full name of the company.
   - "emails": Array of emails belonging to this specific company.
   - "phones": Array of phone numbers for this specific company. Format Vietnamese phone numbers cleanly.
   - "address": Physical address if mentioned.
   - "website": The company's own official website link (especially if listed on a directory page).
   - "logoUrl": Look through the provided Image list (which contains both the image URLs and their associated "alt" texts). Find the image where the "alt" text or the URL matches this company's name/brand. Return the exact "url" of that image. If no logo matches this company, set to null.
   - "socialMedia": {"facebook": "", "linkedin": "", "instagram": "", "twitter": ""} for this specific company.
   - "contactPersons": Array of leadership or sales representatives mentioned, e.g. [{"name": "Nguyen Van A", "title": "Giam doc"}].
   - "industry": The business category or industry of this specific company.
   - "notes": A brief description/summary of this company in Vietnamese.

4. Output Format:
   Extract and return ONLY a valid JSON object with this exact structure:
   {
     "companies": [
       {
         "companyName": "Tên công ty",
         "emails": ["email@company.com"],
         "phones": ["0281234567", "0901234567"],
         "address": "Địa chỉ",
         "website": "http://example.com",
         "logoUrl": "http://example.com/logo.png",
         "socialMedia": {"facebook": "", "linkedin": "", "instagram": "", "twitter": ""},
         "contactPersons": [{"name": "Tên", "title": "Chức vụ"}],
         "industry": "Ngành nghề",
         "notes": "Tóm tắt về công ty bằng tiếng Việt"
       }
     ],
     "confidence": 0.95,
     "pageType": "directory_listing",
     "notes": "Nhận xét chung về trang này bằng tiếng Việt"
   }

Rules:
1. Only include emails that look legitimate (no placeholders like example@).
2. Write "notes" and "industry" descriptions in Vietnamese.
3. Do not include any product or team images. For images, only find the logo and put it in "logoUrl".
4. Return ONLY the valid raw JSON object, without any markdown blocks or explanation.

---

Website URL: ${url}

Images found on page (potential logos with their associated "alt" texts):
${JSON.stringify(images, null, 2)}

Website Content:
${text}

---
CRITICAL REMINDER: If this page is a directory listing of multiple companies (such as Trang Vang, Yellow Pages, etc.), you MUST extract EVERY SINGLE company listed in the content above. Do not skip any of them. Return a complete list of all companies.`;

  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.response.text();
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedData = JSON.parse(responseText) as RawParsedData;
    
    // Normalize companies list
    const rawCompanies = Array.isArray(parsedData.companies) ? (parsedData.companies as RawCompanyInfo[]) : [];
    
    // If no companies were found/extracted in the list but root-level fields exist, wrap them in a single company
    if (rawCompanies.length === 0 && (parsedData.companyName || (parsedData.phones && parsedData.phones.length > 0))) {
      rawCompanies.push({
        companyName: parsedData.companyName || null,
        emails: Array.isArray(parsedData.emails) ? parsedData.emails : [],
        phones: Array.isArray(parsedData.phones) ? parsedData.phones : [],
        address: parsedData.address || null,
        website: parsedData.website || null,
        logoUrl: parsedData.logoUrl || null,
        images: [],
        socialMedia: parsedData.socialMedia || {},
        contactPersons: Array.isArray(parsedData.contactPersons) ? parsedData.contactPersons : [],
        industry: parsedData.industry || null,
        notes: parsedData.notes || null
      });
    }

    const companies = rawCompanies.map((c: RawCompanyInfo) => ({
      companyName: c.companyName || null,
      emails: Array.isArray(c.emails) ? c.emails : [],
      phones: Array.isArray(c.phones) ? c.phones : [],
      address: c.address || null,
      website: c.website || null,
      logoUrl: c.logoUrl || null,
      images: [], // We only want the logo
      socialMedia: {
        facebook: c.socialMedia?.facebook || null,
        linkedin: c.socialMedia?.linkedin || null,
        instagram: c.socialMedia?.instagram || null,
        twitter: c.socialMedia?.twitter || null,
      },
      contactPersons: Array.isArray(c.contactPersons)
        ? c.contactPersons.map((p) => ({
            name: String(p?.name || ''),
            title: String(p?.title || ''),
          }))
        : [],
      industry: c.industry || null,
      notes: c.notes || null
    }));

    const firstCompany = companies[0] || null;

    return {
      companies,
      pageType: parsedData.pageType || 'single_company',
      
      // Populate root fields for legacy backwards compatibility
      emails: firstCompany ? firstCompany.emails : [],
      phones: firstCompany ? firstCompany.phones : [],
      companyName: firstCompany ? firstCompany.companyName : null,
      contactPersons: firstCompany ? firstCompany.contactPersons : [],
      address: firstCompany ? firstCompany.address : null,
      website: firstCompany ? firstCompany.website : null,
      socialMedia: firstCompany ? firstCompany.socialMedia : { facebook: null, linkedin: null, instagram: null, twitter: null },
      industry: firstCompany ? firstCompany.industry : null,
      logoUrl: firstCompany ? firstCompany.logoUrl : null,
      productImages: [], // Empty since we only want logo
      teamImages: [],
      confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0.5,
      notes: parsedData.notes || (firstCompany ? firstCompany.notes : null),
    };
  } catch (error: unknown) {
    console.error('Gemini extraction error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini AI extraction failed: ${errMsg}`);
  }
}
