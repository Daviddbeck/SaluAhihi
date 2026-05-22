import Papa from 'papaparse';
import { ProcessedUrl } from '../types';

export function exportToCSV(items: ProcessedUrl[]) {
  const rows: Record<string, string>[] = [];
  
  items.forEach(item => {
    const d = item.extractedData;
    if (d && d.companies && d.companies.length > 0) {
      d.companies.forEach(c => {
        rows.push({
          'Source URL': item.url,
          'Crawl Status': item.status,
          'Company Name': c.companyName || '',
          'Industry': c.industry || d.industry || '',
          'Confidence': d.confidence !== undefined ? `${(d.confidence * 100).toFixed(0)}%` : '',
          'Emails': c.emails?.join('; ') || '',
          'Phones': c.phones?.join('; ') || '',
          'Contact Persons': c.contactPersons?.map(p => `${p.name} (${p.title || 'N/A'})`).join('; ') || '',
          'Address': c.address || '',
          'Website': c.website || '',
          'Logo URL': c.logoUrl || '',
          'Facebook': c.socialMedia?.facebook || '',
          'LinkedIn': c.socialMedia?.linkedin || '',
          'Instagram': c.socialMedia?.instagram || '',
          'Twitter': c.socialMedia?.twitter || '',
          'Notes': c.notes || '',
          'Crawl Timestamp': new Date(item.timestamp).toLocaleString()
        });
      });
    } else {
      rows.push({
        'Source URL': item.url,
        'Crawl Status': item.status,
        'Company Name': d?.companyName || '',
        'Industry': d?.industry || '',
        'Confidence': d?.confidence !== undefined ? `${(d.confidence * 100).toFixed(0)}%` : '',
        'Emails': d?.emails?.join('; ') || '',
        'Phones': d?.phones?.join('; ') || '',
        'Contact Persons': d?.contactPersons?.map(p => `${p.name} (${p.title || 'N/A'})`).join('; ') || '',
        'Address': d?.address || '',
        'Website': d?.website || '',
        'Logo URL': d?.logoUrl || '',
        'Facebook': d?.socialMedia?.facebook || '',
        'LinkedIn': d?.socialMedia?.linkedin || '',
        'Instagram': d?.socialMedia?.instagram || '',
        'Twitter': d?.socialMedia?.twitter || '',
        'Notes': d?.notes || '',
        'Crawl Timestamp': new Date(item.timestamp).toLocaleString()
      });
    }
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel UTF-8 compliance
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `extracted_contacts_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(items: ProcessedUrl[]) {
  const jsonString = JSON.stringify(items, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `extracted_data_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
