import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { anthropic, MODEL, ARTICLE_SYSTEM, buildSiteContext } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 300;

type ArticlePayload = {
  title?: string;
  meta_description?: string;
  h1?: string;
  body_markdown?: string;
  target_keyword?: string;
  secondary_keywords?: string[];
  internal_link_suggestions?: { anchor: string; page: string }[];
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const itemId = String(body.itemId ?? "");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const item = await prisma.contentItem.findUnique({ where: { id: itemId }, include: { site: true } });
  if (!item) return NextResponse.json({ error: "item not found" }, { status: 404 });

  await prisma.contentItem.update({ where: { id: itemId }, data: { status: "generating" } });

  const ctx = buildSiteContext(item.site);
  const userBrief = `Page type: ${item.pageType}
Target keyword: ${item.keyword}
Working title: ${item.title}

Write the article. Lean into ${item.site.businessName ?? item.site.domain}'s specific products, locations, and credentials wherever the topic invites it. Open by directly answering the search query in the first 2 sentences. Use H2/H3 + a short FAQ. Output the JSON object only.`;

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: [
        {
          type: "text",
          text: `${ARTICLE_SYSTEM}\n\n--- Brand context for every article ---\n${ctx}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userBrief }],
    });

    const final = await stream.finalMessage();
    const text = final.content.find((b) => b.type === "text")?.text ?? "";

    const parsed = parseArticle(text);
    if (!parsed) {
      await prisma.contentItem.update({ where: { id: itemId }, data: { status: "planned" } });
      return NextResponse.json({ error: "Could not parse article JSON from model output." }, { status: 500 });
    }

    const seoScore = scoreArticle(parsed, item.keyword);

    const updated = await prisma.contentItem.update({
      where: { id: itemId },
      data: {
        title: parsed.title ?? item.title,
        body: parsed.body_markdown ?? "",
        metaTitle: parsed.title ?? null,
        metaDescription: parsed.meta_description ?? null,
        seoScore,
        status: "for_review",
      },
    });

    await prisma.agentRun.create({
      data: {
        siteId: item.siteId,
        kind: "article_generation",
        status: "done",
        input: item.keyword,
        tokensIn: final.usage.input_tokens,
        tokensOut: final.usage.output_tokens,
        cacheRead: final.usage.cache_read_input_tokens ?? 0,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    await prisma.contentItem.update({ where: { id: itemId }, data: { status: "planned" } }).catch(() => undefined);
    await prisma.agentRun.create({
      data: {
        siteId: item.siteId,
        kind: "article_generation",
        status: "error",
        input: item.keyword,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "generation failed" },
      { status: 500 }
    );
  }
}

function parseArticle(text: string): ArticlePayload | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function scoreArticle(a: ArticlePayload, keyword: string): number {
  let score = 50;
  const body = (a.body_markdown ?? "").toLowerCase();
  const words = body.split(/\s+/).filter(Boolean).length;

  if ((a.title?.length ?? 0) >= 30 && (a.title?.length ?? 0) <= 65) score += 8;
  if ((a.meta_description?.length ?? 0) >= 140 && (a.meta_description?.length ?? 0) <= 165) score += 6;
  if (words >= 1200) score += 14;
  else if (words >= 800) score += 10;
  else if (words >= 500) score += 5;
  if (body.includes(keyword.toLowerCase())) score += 6;
  const h2Count = (body.match(/^## /gm) ?? []).length;
  if (h2Count >= 4) score += 8;
  else if (h2Count >= 2) score += 4;
  if (body.includes("faq") || body.includes("frequently asked")) score += 4;
  if ((a.internal_link_suggestions?.length ?? 0) >= 3) score += 4;

  return Math.max(0, Math.min(100, score));
}
