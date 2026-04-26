export type AuditFinding = {
  check: string;
  passed: boolean;
  score: number;
  weight: number;
  detail: string;
};

export type AuditResult = {
  url: string;
  fetchedAt: string;
  overallScore: number;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
  imagesMissingAlt: number;
  findings: AuditFinding[];
};

export async function auditUrl(url: string): Promise<AuditResult> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AI-SEO-Agent/1.0 (+on-page-audit)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Failed to fetch (HTTP ${res.status})`);
  const html = await res.text();
  return scoreHtml(url, html);
}

function tag(html: string, name: string): string | null {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i");
  const m = html.match(re);
  return m ? stripTags(m[1]).trim() : null;
}

function metaContent(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countMatches(html: string, re: RegExp): number {
  return (html.match(re) ?? []).length;
}

function bodyText(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const noScript = body.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  return stripTags(noScript);
}

export function scoreHtml(url: string, html: string): AuditResult {
  const title = tag(html, "title");
  const metaDescription = metaContent(html, "description");
  const h1 = tag(html, "h1");
  const text = bodyText(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const host = new URL(url).hostname.replace(/^www\./, "");
  const linkRe = /<a[^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  let internalLinks = 0;
  let externalLinks = 0;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (/^https?:\/\//i.test(href)) {
      try {
        const h = new URL(href).hostname.replace(/^www\./, "");
        if (h === host) internalLinks++;
        else externalLinks++;
      } catch {
        /* ignore malformed */
      }
    } else {
      internalLinks++;
    }
  }

  const images = countMatches(html, /<img\b[^>]*>/gi);
  const imagesMissingAlt = countMatches(html, /<img\b(?![^>]*\balt=)[^>]*>/gi);

  const findings: AuditFinding[] = [];
  const titleLen = title?.length ?? 0;
  findings.push({
    check: "Title tag length (50-60 chars)",
    passed: titleLen >= 30 && titleLen <= 65,
    score: titleLen >= 50 && titleLen <= 60 ? 100 : titleLen >= 30 && titleLen <= 65 ? 75 : titleLen > 0 ? 40 : 0,
    weight: 12,
    detail: title ? `${titleLen} chars: "${title}"` : "No <title> tag found",
  });

  const metaLen = metaDescription?.length ?? 0;
  findings.push({
    check: "Meta description (140-165 chars)",
    passed: metaLen >= 120 && metaLen <= 170,
    score: metaLen >= 140 && metaLen <= 165 ? 100 : metaLen >= 120 && metaLen <= 170 ? 75 : metaLen > 0 ? 40 : 0,
    weight: 10,
    detail: metaDescription ? `${metaLen} chars` : "No meta description",
  });

  findings.push({
    check: "Single H1 present",
    passed: !!h1,
    score: h1 ? 100 : 0,
    weight: 10,
    detail: h1 ? `H1: "${h1.slice(0, 80)}"` : "No H1 found",
  });

  findings.push({
    check: "Word count ≥ 600",
    passed: wordCount >= 600,
    score: wordCount >= 1200 ? 100 : wordCount >= 600 ? 80 : wordCount >= 300 ? 50 : 20,
    weight: 14,
    detail: `${wordCount} words`,
  });

  findings.push({
    check: "Internal links (≥ 3)",
    passed: internalLinks >= 3,
    score: internalLinks >= 6 ? 100 : internalLinks >= 3 ? 75 : internalLinks >= 1 ? 40 : 0,
    weight: 12,
    detail: `${internalLinks} internal links`,
  });

  findings.push({
    check: "External authority links (≥ 1)",
    passed: externalLinks >= 1,
    score: externalLinks >= 3 ? 100 : externalLinks >= 1 ? 75 : 0,
    weight: 8,
    detail: `${externalLinks} external links`,
  });

  const altCoverage = images === 0 ? 100 : Math.round(((images - imagesMissingAlt) / images) * 100);
  findings.push({
    check: "Image alt coverage",
    passed: altCoverage >= 90,
    score: altCoverage,
    weight: 8,
    detail: `${images - imagesMissingAlt}/${images} images have alt text`,
  });

  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  findings.push({
    check: "Canonical link",
    passed: hasCanonical,
    score: hasCanonical ? 100 : 0,
    weight: 6,
    detail: hasCanonical ? "Canonical present" : "No <link rel=\"canonical\"> tag",
  });

  const hasOg = /<meta[^>]+property=["']og:title["']/i.test(html);
  findings.push({
    check: "Open Graph tags",
    passed: hasOg,
    score: hasOg ? 100 : 0,
    weight: 6,
    detail: hasOg ? "OG tags present" : "Missing og:title",
  });

  const hasSchema = /application\/ld\+json/i.test(html);
  findings.push({
    check: "Structured data (JSON-LD)",
    passed: hasSchema,
    score: hasSchema ? 100 : 0,
    weight: 8,
    detail: hasSchema ? "JSON-LD found" : "No structured data",
  });

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  findings.push({
    check: "Mobile viewport meta",
    passed: hasViewport,
    score: hasViewport ? 100 : 0,
    weight: 6,
    detail: hasViewport ? "Viewport set" : "Missing viewport meta",
  });

  const totalWeight = findings.reduce((s, f) => s + f.weight, 0);
  const weighted = findings.reduce((s, f) => s + f.score * f.weight, 0);
  const overallScore = Math.round(weighted / totalWeight);

  return {
    url,
    fetchedAt: new Date().toISOString(),
    overallScore,
    title,
    metaDescription,
    h1,
    wordCount,
    internalLinks,
    externalLinks,
    images,
    imagesMissingAlt,
    findings,
  };
}
