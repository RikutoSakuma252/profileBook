"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminDeleteButton({ id, displayName }: { id: string; displayName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const run = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "削除に失敗しました");
        setDeleting(false);
        return;
      }
      startTransition(() => {
        router.push("/profiles");
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-sm border border-rouge/60 px-3 py-1.5 font-typewriter text-[11px] uppercase tracking-[0.25em] text-rouge transition-colors hover:bg-rouge hover:text-paper"
      >
        admin · delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-sm border border-rouge/60 bg-rouge/10 px-3 py-2 font-typewriter text-[11px] uppercase tracking-[0.2em]">
      <span className="text-rose">
        「{displayName}」を削除します。取り消せません。
      </span>
      <button
        type="button"
        onClick={run}
        disabled={deleting}
        className="rounded-sm bg-rouge px-3 py-1 text-paper disabled:opacity-40"
      >
        {deleting ? "削除中…" : "confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="rounded-sm border border-paper/30 px-3 py-1 text-paper/70 hover:border-paper hover:text-paper"
      >
        cancel
      </button>
      {error && <span className="w-full text-rose">{error}</span>}
    </div>
  );
}
