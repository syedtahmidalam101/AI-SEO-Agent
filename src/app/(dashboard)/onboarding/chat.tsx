"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui";

type Site = {
  id: string;
  domain: string;
  businessName: string | null;
  businessSummary: string | null;
  idealCustomer: string | null;
  productsList: string | null;
  advantages: string | null;
  sitemapUrl: string | null;
  pagesCount: number;
};

type Msg = { role: "user" | "assistant"; content: string };

const PROGRESS_STEPS = [
  { key: "businessName", label: "Identifying business name" },
  { key: "businessSummary", label: "Analysing business description" },
  { key: "idealCustomer", label: "Defining ideal customer" },
  { key: "productsList", label: "Mapping products & services" },
  { key: "advantages", label: "Finding competitive advantages" },
];

export function OnboardingChat({ initialSite }: { initialSite: Site | null }) {
  const [site, setSite] = useState<Site | null>(initialSite);
  const [domainInput, setDomainInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (site && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi 👋 I'm your search visibility AI agent.\n\nYou can call me "Mark".\n\nI'll start by scanning your website.\n\nSitemap found ✅ — it contains ${site.pagesCount} pages.\n\nNow let me build a business summary so I understand your brand and audience.\n\nWhat's the name of your business and what do you do, in one sentence?`,
        },
      ]);
    }
  }, [site, messages.length]);

  async function scanDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setSite(data.site);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !site || streaming) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const res = await fetch("/api/agent/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: site.id, messages: next }),
    });
    if (!res.body) {
      setStreaming(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      assistantText += chunk;
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: assistantText };
        return copy;
      });
    }

    const summaryMatch = assistantText.match(/SUMMARY:\s*({[\s\S]+?})\s*$/);
    if (summaryMatch) {
      try {
        const summary = JSON.parse(summaryMatch[1]);
        const updated = await fetch(`/api/sites/${site.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: summary.businessName,
            businessSummary: summary.summary,
            idealCustomer: summary.idealCustomer,
            productsList: summary.products,
            advantages: summary.advantages,
          }),
        }).then((r) => r.json());
        setSite(updated.site);
      } catch {
        /* ignore parse errors */
      }
    }

    setStreaming(false);
  }

  if (!site) {
    return (
      <div className="px-10 py-10 max-w-3xl">
        <PageHeader
          title="Connect your website"
          subtitle="Add your domain — I'll scan the sitemap and learn what your business is about."
        />
        <Card className="p-6">
          <form onSubmit={scanDomain} className="flex gap-2">
            <Input
              placeholder="e.g. yourbrand.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              autoFocus
            />
            <Button type="submit" disabled={scanning}>
              {scanning ? "Scanning…" : "Scan site"}
            </Button>
          </form>
          {scanError && <div className="mt-3 text-sm text-red-600">{scanError}</div>}
          <p className="mt-4 text-xs text-[var(--muted)]">
            I'll look for <code>/sitemap.xml</code> and count your pages. No credentials needed for this step.
          </p>
        </Card>
      </div>
    );
  }

  const progress = PROGRESS_STEPS.map((s) => ({
    ...s,
    done: !!site[s.key as keyof Site],
  }));

  return (
    <div className="grid grid-cols-[420px_1fr] h-screen">
      <div className="border-r border-[var(--border)] bg-[var(--surface)] flex flex-col h-screen">
        <div className="px-5 py-4 border-b border-[var(--border)] text-sm font-medium">{site.domain}</div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.content || (streaming && i === messages.length - 1 ? <Typing /> : null)}
            </Bubble>
          ))}
          <ProgressCard steps={progress} />
        </div>
        <form onSubmit={send} className="border-t border-[var(--border)] p-3 flex gap-2">
          <Input
            placeholder="Reply…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            autoFocus
          />
          <Button type="submit" disabled={streaming || !input.trim()}>
            Send
          </Button>
        </form>
      </div>

      <div className="p-10 overflow-y-auto">
        <PageHeader
          title="Connections"
          subtitle="Configure how your AI agents access data sources and where their output is delivered."
        />
        <ConnectionsPreview siteId={site.id} sitemapUrl={site.sitemapUrl} pagesCount={site.pagesCount} />
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] bg-[var(--accent)] text-white px-3.5 py-2 rounded-2xl rounded-br-sm text-sm whitespace-pre-wrap">
        {children}
      </div>
    );
  }
  return (
    <div className="max-w-[85%] bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2 rounded-2xl rounded-bl-sm text-sm whitespace-pre-wrap">
      {children}
    </div>
  );
}

function Typing() {
  return (
    <span className="inline-flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-pulse-soft" />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-pulse-soft" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-pulse-soft" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

function ProgressCard({ steps }: { steps: { label: string; done: boolean }[] }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3">Progress</div>
      <ul className="space-y-1.5 text-sm">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className={s.done ? "text-emerald-500" : "text-[var(--muted)]"}>{s.done ? "✓" : "•"}</span>
            <span className={s.done ? "text-[var(--ink)]" : "text-[var(--muted)]"}>{s.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ConnectionsPreview({
  siteId,
  sitemapUrl,
  pagesCount,
}: {
  siteId: string;
  sitemapUrl: string | null;
  pagesCount: number;
}) {
  void siteId;
  return (
    <div className="grid grid-cols-3 gap-6 items-start">
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Data sources</div>
        <SourceCard
          title="Sitemap"
          subtitle="Used for finding content gaps and internal linking."
          status="connected"
          detail={sitemapUrl ? `${pagesCount} pages` : undefined}
        />
        <SourceCard title="Business Data" subtitle="Basic business information and continuous AI learnings." status="connected" />
        <SourceCard title="Google Search Console" subtitle="Keyword rankings and SEO performance data directly from Google." status="not_connected" />
      </div>

      <div className="self-center">
        <Card className="p-6 text-center bg-[var(--accent-soft)] border-[var(--accent)]/20">
          <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">AI Agent</div>
          <div className="w-12 h-12 rounded-lg bg-[var(--accent)] text-white grid place-items-center mx-auto font-display text-lg font-semibold">
            M
          </div>
          <div className="mt-2 font-medium">"Mark"</div>
          <Badge tone="running">running</Badge>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Output destinations</div>
        <SourceCard title="CMS" subtitle="Integrate with your CMS to publish directly to your website automatically." status="not_connected" />
        <SourceCard title="Google Ads" subtitle="Run paid ads on Google with AI." status="not_connected" />
        <SourceCard title="Backlink Club" subtitle="Automatically get links from real, topic-relevant websites." status="not_connected" />
      </div>
    </div>
  );
}

function SourceCard({
  title,
  subtitle,
  status,
  detail,
}: {
  title: string;
  subtitle: string;
  status: "connected" | "not_connected";
  detail?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</div>
          {detail && <div className="text-xs text-[var(--ink)] mt-2">{detail}</div>}
        </div>
        {status === "connected" ? <Badge tone="ok">connected</Badge> : <Badge tone="warn">not connected</Badge>}
      </div>
    </Card>
  );
}
