"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function GenerateButton({ itemId, compact = false }: { itemId: string; compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Generation failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <Button onClick={go} disabled={pending} className={compact ? "w-full justify-center" : ""}>
        {pending ? "Writing… (60–90s)" : "Generate article"}
      </Button>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
}
