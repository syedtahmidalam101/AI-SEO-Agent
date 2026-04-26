import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { GenerateButton } from "./generate";

export default async function ContentItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.contentItem.findUnique({ where: { id }, include: { site: true } });
  if (!item) notFound();

  return (
    <div className="px-10 py-10 max-w-4xl">
      <Link href="/content" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        ← Back to content plan
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-[var(--muted)]">{item.pageType}</span>
            <span className="text-xs text-[var(--muted)]">·</span>
            <span className="text-xs text-[var(--muted)]">target: {item.keyword}</span>
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">{item.title}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={item.status} />
          {item.seoScore != null && <ScoreRing value={item.seoScore} />}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[1fr_280px] gap-8">
        <div>
          {!item.body ? (
            <Card className="p-10 text-center">
              <div className="text-sm text-[var(--muted)] mb-1">No content generated yet</div>
              <div className="text-xs text-[var(--muted)] mb-6">
                The agent will use {item.site.businessName ?? item.site.domain}'s business context to write a long-form,
                EEAT-aligned article targeting "{item.keyword}".
              </div>
              <GenerateButton itemId={item.id} />
            </Card>
          ) : (
            <Card className="p-8">
              <article className="prose prose-sm max-w-none whitespace-pre-wrap font-[15px] leading-relaxed">
                {item.body}
              </article>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">SEO meta</div>
            <div className="text-xs text-[var(--muted)]">Title</div>
            <div className="text-sm">{item.metaTitle ?? "—"}</div>
            <div className="text-xs text-[var(--muted)] mt-3">Description</div>
            <div className="text-sm">{item.metaDescription ?? "—"}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">Generation</div>
            <GenerateButton itemId={item.id} compact />
            <div className="text-xs text-[var(--muted)] mt-3">
              Uses Claude Opus 4.7 with adaptive thinking + prompt caching for the brand-context prefix.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: "neutral" | "running" | "review" | "ok"; label: string }> = {
    planned: { tone: "neutral", label: "Planned" },
    generating: { tone: "running", label: "Generating…" },
    for_review: { tone: "review", label: "For review" },
    published: { tone: "ok", label: "Published" },
  };
  const m = map[status] ?? map.planned;
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function ScoreRing({ value }: { value: number }) {
  const tone = value >= 90 ? "text-emerald-600" : value >= 75 ? "text-amber-600" : "text-red-600";
  return (
    <div className={`flex items-baseline gap-1 ${tone}`}>
      <span className="text-3xl font-display font-semibold">{value}</span>
      <span className="text-xs text-[var(--muted)]">/100</span>
    </div>
  );
}
