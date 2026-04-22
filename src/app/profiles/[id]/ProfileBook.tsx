"use client";

import { memo, useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ProfileFieldDto } from "@/types";

const FieldReveal = dynamic(() => import("./FieldReveal"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center gap-2 rounded-sm bg-ink/90 px-2.5 py-1 font-dot text-[11px] tracking-[0.3em] text-paper">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon animate-blink" />
      LOCKED · tap to reveal
    </span>
  ),
});

interface Props {
  displayName: string;
  subtitle: string | null;
  avatarColor: string;
  createdAt: string;
  fields: ProfileFieldDto[];
}

export function ProfileBook({
  displayName,
  subtitle,
  avatarColor,
  createdAt,
  fields,
}: Props) {
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());

  const allIds = useMemo(() => fields.map((f) => f.id), [fields]);
  const allOpen = revealed.size === allIds.length && allIds.length > 0;
  const recDate = createdAt.slice(0, 10);

  const toggle = useCallback((id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openAll = useCallback(() => setRevealed(new Set(allIds)), [allIds]);
  const closeAll = useCallback(() => setRevealed(new Set()), []);

  return (
    <article className="relative">
      <span className="tape left-10 -top-3 rotate-[-4deg] z-10" aria-hidden />
      <span className="tape right-14 -top-3 rotate-[5deg] z-10" aria-hidden />
      <span className="tape left-1/2 -bottom-2 -translate-x-1/2 rotate-[1deg] z-10" aria-hidden />

      <div className="paper-grain relative rounded-sm p-8 text-ink shadow-card md:p-10">
        <header className="flex flex-col gap-5 border-b border-dashed border-ink/30 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="grid h-16 w-16 place-items-center rounded-sm font-dot text-2xl text-ink shadow-sm"
              style={{ backgroundColor: avatarColor }}
            >
              {displayName.slice(0, 1)}
            </span>
            <div>
              <div className="font-dot text-[11px] tracking-[0.3em] text-ink/60">
                📻 RADIO NAME
              </div>
              <h1 className="mt-1 font-dot text-3xl tracking-[0.05em] text-ink md:text-4xl">
                {displayName}
              </h1>
              {subtitle ? (
                <p className="mt-1 font-handwritten text-lg text-ink/70">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-ink/50">
              rec. {recDate}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openAll}
                disabled={allOpen || allIds.length === 0}
                className="rounded-sm bg-ink px-3 py-1 font-dot text-[10px] tracking-[0.2em] text-paper transition-opacity disabled:opacity-30"
              >
                すべて開く
              </button>
              <button
                type="button"
                onClick={closeAll}
                disabled={revealed.size === 0}
                className="rounded-sm border border-ink/60 px-3 py-1 font-dot text-[10px] tracking-[0.2em] text-ink transition-opacity disabled:opacity-30"
              >
                すべて閉じる
              </button>
            </div>
          </div>
        </header>

        {fields.length === 0 ? (
          <p className="mt-10 text-center font-handwritten text-ink/60">
            この帳面にはまだ記入がありません。
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {fields.map((f, i) => (
              <FieldRow
                key={f.id}
                field={f}
                index={i}
                revealed={revealed.has(f.id)}
                onToggle={toggle}
              />
            ))}
          </ul>
        )}

        <footer className="mt-8 flex items-center justify-between border-t border-dotted border-ink/30 pt-4 font-typewriter text-[10px] uppercase tracking-[0.3em] text-ink/50">
          <span>tap each card to reveal</span>
          <span className="text-rouge">取扱注意 · 秘</span>
        </footer>
      </div>
    </article>
  );
}

const FieldRow = memo(function FieldRow({
  field,
  index,
  revealed,
  onToggle,
}: {
  field: ProfileFieldDto;
  index: number;
  revealed: boolean;
  onToggle: (id: string) => void;
}) {
  const handleClick = useCallback(() => onToggle(field.id), [onToggle, field.id]);

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={revealed}
        className="group flex w-full items-start gap-4 rounded-sm border border-ink/10 bg-ink/[0.03] px-4 py-3 text-left transition-colors hover:border-ink/40 hover:bg-ink/[0.05]"
      >
        <span className="mt-0.5 shrink-0 font-dot text-[10px] tracking-[0.2em] text-ink/40">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="text-xl leading-none" aria-hidden>
              {field.emoji}
            </span>
            <span className="font-dot text-sm tracking-[0.1em] text-ink">
              {field.label}
            </span>
            {field.isRequired ? (
              <span className="rounded-sm bg-rouge/15 px-1.5 py-0.5 font-dot text-[9px] tracking-[0.2em] text-rouge">
                必
              </span>
            ) : null}
          </span>

          <span className="mt-2 block min-h-[1.5rem]">
            <FieldReveal revealed={revealed} value={field.value} />
          </span>
        </span>
      </button>
    </li>
  );
});
