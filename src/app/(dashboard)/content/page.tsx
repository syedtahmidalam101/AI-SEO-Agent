import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { NewItem } from "./new-item";

const STATUS_TONE = {
  planned: { tone: "neutral" as const, label: "Planned", icon: "🕒" },
  generating: { tone: "running" as const, label: "Generating…", icon: "✦" },
  for_review: { tone: "review" as const, label: "For review", icon: "📝" },
  published: { tone: "ok" as const, label: "Published", icon: "✓" },
};

const PAGE_TYPE_TONE: Record<string, string> = {
  Article: "bg-blue-50 text-blue-700 border-blue-200",
  Services: "bg-purple-50 text-purple-700 border-purple-200",
  LLM: "bg-pink-50 text-pink-700 border-pink-200",
};

export default async function ContentPage() {
  const site = await prisma.site.findFirst({ orderBy: { createdAt: "desc" } });
  if (!site) redirect("/onboarding");

  const items = await prisma.contentItem.findMany({
    where: { siteId: site.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="px-10 py-10 max-w-[1280px]">
      <PageHeader
        title="Content plan"
        subtitle={`${items.length} pieces in pipeline for ${site.businessName ?? site.domain}.`}
        action={<NewItem siteId={site.id} />}
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
              <th className="px-5 py-3 w-8"></th>
              <th className="px-5 py-3">Page type</th>
              <th className="px-5 py-3">Keyword</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Tags</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const meta = STATUS_TONE[it.status as keyof typeof STATUS_TONE] ?? STATUS_TONE.planned;
              const cls = PAGE_TYPE_TONE[it.pageType] ?? "bg-[var(--bg)] text-[var(--muted)] border-[var(--border)]";
              return (
                <tr key={it.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]/40">
                  <td className="px-5 py-4">
                    <input type="checkbox" className="accent-[var(--accent)]" />
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs ${cls}`}>{it.pageType}</span>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">{it.keyword}</td>
                  <td className="px-5 py-4">
                    <Link className="hover:underline" href={`/content/${it.id}`}>
                      {it.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={meta.tone}>
                      <span>{meta.icon}</span>
                      {meta.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">{it.seoScore != null ? `${it.seoScore}` : "—"}</td>
                  <td className="px-5 py-4 text-[var(--muted)]">{formatDate(it.createdAt)}</td>
                  <td className="px-5 py-4">
                    {it.customTags && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs bg-amber-50 text-amber-700 border-amber-200">
                        {it.customTags}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-[var(--muted)] text-sm">
                  No content items yet. Click "New item" to add one or run the agent.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
