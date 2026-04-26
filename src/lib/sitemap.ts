export type SitemapResult = {
  sitemapUrl: string;
  pagesCount: number;
  sampleUrls: string[];
};

function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/\/.*$/, "");
  return domain;
}

export async function fetchSitemap(rawDomain: string): Promise<SitemapResult> {
  const domain = normalizeDomain(rawDomain);
  const candidates = [
    `https://${domain}/sitemap.xml`,
    `https://www.${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
  ];

  let lastError: Error | null = null;
  for (const sitemapUrl of candidates) {
    try {
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": "AI-SEO-Agent/1.0 (+sitemap-scan)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${sitemapUrl}`);
        continue;
      }
      const xml = await res.text();
      const urls = extractUrls(xml);
      return { sitemapUrl, pagesCount: urls.length, sampleUrls: urls.slice(0, 10) };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error(`No sitemap found for ${domain}`);
}

function extractUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) urls.push(m[1]);
  return urls;
}
