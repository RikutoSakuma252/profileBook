"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ImportResult } from "@/types";

interface ConfigSummary {
  id: string;
  label: string;
  spreadsheetId: string;
}

export function ImportRunner({ configs }: { configs: ConfigSummary[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(configs[0]?.id ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const disabled =
    running ||
    !selectedId ||
    configs.find((c) => c.id === selectedId)?.spreadsheetId ===
      "PLACEHOLDER_SPREADSHEET_ID";

  const handleRun = async () => {
    if (!selectedId) return;
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formConfigId: selectedId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "import failed");
      } else {
        setResult(json as ImportResult);
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  if (configs.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-rose/40 bg-ink-soft/40 p-5 font-handwritten text-rose">
        取り込み対象のフォーム設定がありません。先に{" "}
        <a
          href="/admin/config"
          className="underline underline-offset-2 hover:text-neon"
        >
          フォーム設定
        </a>
        で Spreadsheet ID を登録してください。
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-paper/10 bg-ink-soft/40 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1">
          <span className="font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/60">
            対象フォーム
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-2 w-full rounded-sm border border-paper/15 bg-ink px-3 py-2 font-typewriter text-sm text-paper focus:border-neon focus:outline-none"
          >
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleRun}
          disabled={disabled}
          className="rounded-sm bg-neon px-5 py-2.5 font-dot text-sm tracking-[0.2em] text-ink shadow-neon transition-opacity disabled:opacity-40"
        >
          {running ? "取り込み中…" : "取り込み実行"}
        </button>
      </div>

      {result && (
        <div className="mt-5 rounded-sm border border-neon/40 bg-neon/5 px-4 py-3 font-typewriter text-sm text-paper">
          <span className="font-dot text-neon">OK —</span>{" "}
          {result.imported} 件追加 / {result.skipped} 件スキップ
          {result.errors.length > 0 && (
            <>
              {" "}
              / <span className="text-rose">{result.errors.length} 件エラー</span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-sm border border-rouge/60 bg-rouge/10 px-4 py-3 font-typewriter text-sm text-rose">
          取り込み失敗: {error}
        </div>
      )}
    </div>
  );
}
