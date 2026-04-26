"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ConnectionToggle({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(status);
  const router = useRouter();

  const next = optimistic === "connected" ? "not_connected" : "connected";
  const label = optimistic === "connected" ? "Disconnect" : "Connect";

  function toggle() {
    setOptimistic(next);
    startTransition(async () => {
      await fetch(`/api/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={toggle} disabled={pending} className="text-xs">
      {pending ? "…" : label}
    </Button>
  );
}
