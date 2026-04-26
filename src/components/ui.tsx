import * as React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type BadgeTone = "neutral" | "warn" | "ok" | "running" | "review";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  const cls: Record<BadgeTone, string> = {
    neutral: "bg-[var(--bg)] text-[var(--muted)] border-[var(--border)]",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    running: "bg-orange-50 text-[var(--accent)] border-orange-200",
    review: "bg-yellow-50 text-yellow-800 border-yellow-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border ${cls[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: {
  variant?: "primary" | "ghost" | "outline";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v: Record<string, string> = {
    primary: "bg-[var(--accent)] text-white hover:bg-[#C8471A]",
    ghost: "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]",
    outline: "border border-[var(--border)] hover:bg-[var(--bg)]",
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2 rounded-md border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] text-sm ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3.5 py-2 rounded-md border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] text-sm ${props.className ?? ""}`}
    />
  );
}
