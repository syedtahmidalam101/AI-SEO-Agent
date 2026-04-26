import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ConnectionToggle } from "./toggle";

const SOURCE_META: Record<string, { title: string; subtitle: string; icon: string }> = {
  sitemap: { title: "Sitemap", subtitle: "Used for finding content gaps and internal linking.", icon: "🗺" },
  business_data: { title: "Business Data", subtitle: "Basic business information and continuous AI learnings.", icon: "ℹ" },
  google_search_console: { title: "Google Search Console", subtitle: "Keyword rankings and SEO performance data directly from Google.", icon: "🔎" },
  google_ads: { title: "Google Ads", subtitle: "Sync keywords data from paid ads campaigns.", icon: "💸" },
  ahrefs: { title: "Ahrefs Data", subtitle: "Domain authority score and backlink analysis.", icon: "🔗" },
};

const DEST_META: Record<string, { title: string; subtitle: string; icon: string }> = {
  cms: { title: "CMS", subtitle: "Integrate with your CMS to publish directly to your website automatically.", icon: "✏" },
  google_ads_publish: { title: "Google Ads", subtitle: "Run paid ads on Google with AI.", icon: "💸" },
  backlink_club: { title: "Backlink Club", subtitle: "Automatically get links from real, topic-relevant websites.", icon: "🔗" },
};

export default async function ConnectionsPage() {
  const site = await prisma.site.findFirst({ orderBy: { createdAt: "desc" }, include: { connections: true } });
  if (!site) redirect("/onboarding");

  const sources = site.connections.filter((c) => c.category === "source");
  const destinations = site.connections.filter((c) => c.category === "destination");

  return (
    <div className="px-10 py-10 max-w-[1280px]">
      <PageHeader
        title="Connections"
        subtitle="Configure how your AI agents access data sources and where their output is delivered."
      />

      <div className="grid grid-cols-3 gap-8 items-start">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Data sources</div>
          {sources.map((c) => {
            const meta = SOURCE_META[c.kind] ?? { title: c.kind, subtitle: "", icon: "•" };
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-[var(--bg)] grid place-items-center text-sm">{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm">{meta.title}</div>
                      {c.status === "connected" ? <Badge tone="ok">connected</Badge> : <Badge tone="warn">not connected</Badge>}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1">{meta.subtitle}</div>
                    <div className="mt-3">
                      <ConnectionToggle id={c.id} status={c.status} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="self-start sticky top-10">
          <Card className="p-6 text-center bg-[var(--accent-soft)] border-[var(--accent)]/30">
            <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">AI Agent</div>
            <div className="w-14 h-14 rounded-xl bg-[var(--accent)] text-white grid place-items-center mx-auto font-display text-xl font-semibold">
              M
            </div>
            <div className="mt-2 font-medium">{site.businessName ? `"Mark" — ${site.businessName}` : '"Mark"'}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{site.domain}</div>
            <div className="mt-4">
              <Badge tone="running">{site.businessSummary ? "ready" : "configuring"}</Badge>
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">
              <div className="flex justify-between">
                <span>Pages indexed</span>
                <span className="text-[var(--ink)]">{site.pagesCount}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Sources connected</span>
                <span className="text-[var(--ink)]">{sources.filter((s) => s.status === "connected").length}/{sources.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Destinations connected</span>
                <span className="text-[var(--ink)]">{destinations.filter((d) => d.status === "connected").length}/{destinations.length}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Output destinations</div>
          {destinations.map((c) => {
            const meta = DEST_META[c.kind] ?? { title: c.kind, subtitle: "", icon: "•" };
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-[var(--bg)] grid place-items-center text-sm">{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm">{meta.title}</div>
                      {c.status === "connected" ? <Badge tone="ok">connected</Badge> : <Badge tone="warn">not connected</Badge>}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1">{meta.subtitle}</div>
                    <div className="mt-3">
                      <ConnectionToggle id={c.id} status={c.status} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
