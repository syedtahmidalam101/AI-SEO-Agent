"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

export function NewItem({ siteId }: { siteId: string }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [pageType, setPageType] = useState("Article");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, keyword: keyword.trim(), pageType }),
      });
      if (res.ok) {
        const { item } = await res.json();
        setOpen(false);
        setKeyword("");
        router.push(`/content/${item.id}`);
      }
    });
  }

  if (!open) return <Button onClick={() => setOpen(true)}>+ New item</Button>;

  return (
    <form onSubmit={submit} className="flex gap-2 items-center">
      <select
        value={pageType}
        onChange={(e) => setPageType(e.target.value)}
        className="px-3 py-2 rounded-md border border-[var(--border)] text-sm bg-[var(--surface)]"
      >
        <option>Article</option>
        <option>Services</option>
        <option>LLM</option>
      </select>
      <Input
        placeholder="Target keyword…"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        autoFocus
        className="min-w-[260px]"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
