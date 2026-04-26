"use client";

import { useState } from "react";
import { Badge, Button, Card, Input } from "@/components/ui";
import type { AuditResult } from "@/lib/seo-scorer";

export function AuditClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <form onSubmit={run} className="flex gap-2">
          <Input
            placeholder="https://example.com/page-to-audit"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Auditing…" : "Run audit"}
          </Button>
        </form>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </Card>

      {result && (
        <>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[var(--muted)] truncate">{result.url}</div>
                <h2 className="font-medium mt-1 truncate">{result.title ?? "(No title)"}</h2>
                <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">{result.metaDescription ?? "(No meta description)"}</p>
              </div>
              <div className="text-right shrink-0 ml-6">
                <div className={`text-5xl font-display font-semibold ${scoreColor(result.overallScore)}`}>
                  {result.overallScore}
                </div>
                <div className="text-xs text-[var(--muted)]">Overall score</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)] text-sm">
              <Stat label="Word count" value={result.wordCount.toLocaleString()} />
              <Stat label="Internal links" value={result.internalLinks} />
              <Stat label="External links" value={result.externalLinks} />
              <Stat
                label="Image alt coverage"
                value={result.images === 0 ? "—" : `${result.images - result.imagesMissingAlt}/${result.images}`}
              />
            </div>
          </Card>

          <div className="space-y-2">
            {result.findings.map((f, i) => (
              <Card key={i} className="p-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-md grid place-items-center text-sm font-semibold ${
                  f.score >= 80 ? "bg-emerald-50 text-emerald-700" : f.score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                }`}>
                  {f.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{f.check}</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">{f.detail}</div>
                </div>
                <Badge tone={f.passed ? "ok" : "warn"}>{f.passed ? "Pass" : "Improve"}</Badge>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="text-lg font-medium mt-0.5">{value}</div>
    </div>
  );
}

function scoreColor(s: number): string {
  if (s >= 90) return "text-emerald-600";
  if (s >= 75) return "text-amber-600";
  if (s >= 50) return "text-orange-600";
  return "text-red-600";
}
