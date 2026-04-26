import { NextResponse } from "next/server";
import { auditUrl } from "@/lib/seo-scorer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const url = String(body.url ?? "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "url must start with http(s)://" }, { status: 400 });
  }
  try {
    const result = await auditUrl(url);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Audit failed" },
      { status: 400 }
    );
  }
}
