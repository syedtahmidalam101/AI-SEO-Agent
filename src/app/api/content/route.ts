import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const siteId = String(body.siteId ?? "");
  const keyword = String(body.keyword ?? "").trim();
  const pageType = String(body.pageType ?? "Article");
  if (!siteId || !keyword) return NextResponse.json({ error: "siteId + keyword required" }, { status: 400 });

  const item = await prisma.contentItem.create({
    data: {
      siteId,
      keyword,
      pageType,
      title: titleFromKeyword(keyword),
      status: "planned",
    },
  });

  return NextResponse.json({ item });
}

function titleFromKeyword(k: string): string {
  return k
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
