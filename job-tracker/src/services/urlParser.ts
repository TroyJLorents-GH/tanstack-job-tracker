// Lightweight client-side URL parser for job pages.
// Uses a CORS-friendly reader endpoint to fetch page content and applies heuristics
// for LinkedIn, Indeed, Glassdoor, Google Jobs, ZipRecruiter, and generic sites.

export type ParsedJob = {
  company?: string;
  position?: string;
  location?: string;
  salary?: string;
  jobUrl: string;
};

// Jina AI Reader is a public, CORS-friendly proxy that returns readable text from webpages
// Ref: https://r.jina.ai
const buildReaderUrl = (targetUrl: string) => {
  // Ensure we have protocol
  const normalized = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`;
  return `https://r.jina.ai/http://${normalized.replace(/^https?:\/\//i, '')}`;
};

function safeSlice(text: string, max = 50000) {
  return text.length > max ? text.slice(0, max) : text;
}

function inferFromTitle(title: string) {
  // Try patterns like "Job Title - Company - LinkedIn" or "Job Title - Company - Indeed"
  const parts = title.split(' - ').map((p) => p.trim());
  let position: string | undefined;
  let company: string | undefined;
  if (parts.length >= 2) {
    position = parts[0];
    company = parts[1] && !/linkedin|indeed|glassdoor|ziprecruiter|google/i.test(parts[1]) ? parts[1] : undefined;
  }
  return { position, company };
}

function extractLine(regex: RegExp, text: string): string | undefined {
  const m = text.match(regex);
  return m?.[1]?.trim();
}

export async function parseJobFromUrl(url: string): Promise<ParsedJob> {
  // Prefer server-side parsing if available
  const apiBase = (import.meta as any).env?.VITE_PARSE_API_URL as string | undefined;
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/parse-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          jobUrl: url,
          company: data.company || undefined,
          position: data.title || data.position || undefined,
          location: data.location || undefined,
          salary: data.salary || data.compensation || undefined,
        };
      }
    } catch (_) {
      // fall back to client-side reader below
    }
  }
  const readerUrl = buildReaderUrl(url);
  const res = await fetch(readerUrl);
  if (!res.ok) {
    return { jobUrl: url };
  }
  const body = safeSlice(await res.text());

  // Extract title line (first non-empty line often is the title from reader)
  const firstLine = body.split('\n').find((l) => l.trim().length > 0) || '';
  const inferred = inferFromTitle(firstLine);

  // Heuristics for common fields
  const salary = extractLine(/\b(?:\$\s?\d{2,3}(?:,\d{3})*(?:\.\d{2})?)\b(?:\s?-\s?\$?\d{2,3}(?:,\d{3})*)?/i, body)
    || extractLine(/salary[:\s]+([^\n]+)/i, body);

  const location = extractLine(/\blocation[:\s]+([^\n]+)/i, body)
    || extractLine(/\b(Remote|Hybrid|Onsite)\b[^\n]*/i, body);

  // Company from patterns
  const company = inferred.company
    || extractLine(/company[:\s]+([^\n]+)/i, body)
    || extractLine(/at\s+([A-Z][A-Za-z0-9&.,\- ]{2,})/i, body);

  // Position from patterns
  const position = inferred.position
    || extractLine(/title[:\s]+([^\n]+)/i, body)
    || extractLine(/position[:\s]+([^\n]+)/i, body)
    || extractLine(/role[:\s]+([^\n]+)/i, body);

  return {
    jobUrl: url,
    company: company?.slice(0, 100),
    position: position?.slice(0, 120),
    location: location?.slice(0, 120),
    salary: salary?.slice(0, 120),
  };
}


