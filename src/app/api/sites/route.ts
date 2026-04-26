import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSitemap } from "@/lib/sitemap";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const domain = String(body.domain ?? "").trim();
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });

  let sitemapResult: Awaited<ReturnType<typeof fetchSitemap>> | null = null;
  try {
    sitemapResult = await fetchSitemap(domain);
  } catch (err) {
    return NextResponse.json(
      { error: `Couldn't read sitemap: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    );
  }

  const normalized = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  const site = await prisma.site.upsert({
    where: { domain: normalized },
    update: {
      sitemapUrl: sitemapResult.sitemapUrl,
      pagesCount: sitemapResult.pagesCount,
    },
    create: {
      domain: normalized,
      sitemapUrl: sitemapResult.sitemapUrl,
      pagesCount: sitemapResult.pagesCount,
    },
  });

  await ensureDefaultConnections(site.id, sitemapResult.sitemapUrl);

  return NextResponse.json({ site, sample: sitemapResult.sampleUrls });
}

async function ensureDefaultConnections(siteId: string, sitemapUrl: string) {
  const defaults = [
    { kind: "sitemap", category: "source", status: "connected", config: JSON.stringify({ url: sitemapUrl }) },
    { kind: "business_data", category: "source", status: "connected" },
    { kind: "google_search_console", category: "source", status: "not_connected" },
    { kind: "google_ads", category: "source", status: "not_connected" },
    { kind: "ahrefs", category: "source", status: "not_connected" },
    { kind: "cms", category: "destination", status: "not_connected" },
    { kind: "google_ads_publish", category: "destination", status: "not_connected" },
    { kind: "backlink_club", category: "destination", status: "not_connected" },
  ];

  for (const c of defaults) {
    await prisma.connection.upsert({
      where: { siteId_kind: { siteId, kind: c.kind } },
      update: { status: c.status, config: c.config ?? null },
      create: { siteId, ...c },
    });
  }
}
