import Link from "next/link";

const NAV = [
  { href: "/onboarding", label: "Onboarding", icon: "✦" },
  { href: "/connections", label: "Connections", icon: "◇" },
  { href: "/content", label: "Content plan", icon: "▤" },
  { href: "/audit", label: "On-page audit", icon: "◷" },
];

export function Sidebar({ siteName, current }: { siteName?: string; current?: string }) {
  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--accent)] text-white grid place-items-center font-display font-semibold">A</div>
          <div className="text-sm font-medium">{siteName || "Add a site"}</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => {
          const active = current?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--ink)] font-medium"
                  : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
              }`}
            >
              <span className="w-4 text-center text-[var(--accent)]">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-xs text-[var(--muted)] border-t border-[var(--border)]">
        <div>Powered by</div>
        <div className="font-medium text-[var(--ink)]">Claude Opus 4.7</div>
      </div>
    </aside>
  );
}
