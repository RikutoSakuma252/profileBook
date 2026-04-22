"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { saveConfigAction, type SaveConfigState } from "./actions";
import type { FieldMapping, FormConfigDto } from "@/types";

interface Props {
  initialConfigs: FormConfigDto[];
}

export function ConfigEditor({ initialConfigs }: Props) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [activeId, setActiveId] = useState(initialConfigs[0]?.id ?? "");
  const [creating, setCreating] = useState(initialConfigs.length === 0);

  const active = useMemo(
    () => configs.find((c) => c.id === activeId),
    [configs, activeId]
  );

  const handleSaved = (saved: FormConfigDto) => {
    setConfigs((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved];
    });
    setActiveId(saved.id);
    setCreating(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2 font-typewriter text-[11px] uppercase tracking-[0.2em]">
        {configs.map((c) => {
          const isActive = !creating && c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCreating(false);
                setActiveId(c.id);
              }}
              className={
                isActive
                  ? "rounded-sm bg-neon px-3 py-1.5 text-ink"
                  : "rounded-sm border border-paper/15 px-3 py-1.5 text-paper/70 transition-colors hover:border-neon hover:text-neon"
              }
            >
              {c.spreadsheetId === "PLACEHOLDER_SPREADSHEET_ID"
                ? "未設定フォーム"
                : `${c.sheetName} · ${c.spreadsheetId.slice(0, 6)}…`}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setActiveId("");
          }}
          className={
            creating
              ? "rounded-sm bg-neon px-3 py-1.5 text-ink"
              : "rounded-sm border border-dashed border-paper/30 px-3 py-1.5 text-paper/60 transition-colors hover:border-neon hover:text-neon"
          }
        >
          + 新規
        </button>
      </div>

      {creating ? (
        <EditorForm
          key="new"
          mode="create"
          initial={emptyConfig()}
          onSaved={handleSaved}
          onCancel={
            configs.length > 0
              ? () => {
                  setCreating(false);
                  setActiveId(configs[0].id);
                }
              : undefined
          }
        />
      ) : active ? (
        <EditorForm
          key={active.id}
          mode="edit"
          initial={active}
          onSaved={handleSaved}
        />
      ) : (
        <p className="font-handwritten text-paper/60">
          左のタブからフォームを選択するか「+ 新規」で作成してください。
        </p>
      )}
    </div>
  );
}

function emptyConfig(): FormConfigDto {
  return {
    id: "",
    spreadsheetId: "",
    sheetName: "フォームの回答 1",
    fieldMappings: [],
    webhookSecret: "",
    createdAt: "",
    updatedAt: "",
  };
}

interface FormState {
  spreadsheetId: string;
  sheetName: string;
  mappings: FieldMapping[];
}

const initialState: SaveConfigState = { status: "idle" };

function EditorForm({
  mode,
  initial,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  initial: FormConfigDto;
  onSaved: (c: FormConfigDto) => void;
  onCancel?: () => void;
}) {
  const [state, runAction, isPending] = useActionState(
    saveConfigAction,
    initialState
  );

  const [form, setForm] = useState<FormState>({
    spreadsheetId:
      initial.spreadsheetId === "PLACEHOLDER_SPREADSHEET_ID"
        ? ""
        : initial.spreadsheetId,
    sheetName: initial.sheetName,
    mappings:
      initial.fieldMappings.length > 0
        ? initial.fieldMappings.map((m) => ({ ...m }))
        : [],
  });
  const [secret, setSecret] = useState(initial.webhookSecret);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      setSecret(state.config.webhookSecret);
      onSaved(state.config);
    }
  }, [state, onSaved]);

  const updateMapping = (i: number, patch: Partial<FieldMapping>) => {
    setForm((s) => ({
      ...s,
      mappings: s.mappings.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    }));
  };

  const addMapping = () => {
    setForm((s) => ({
      ...s,
      mappings: [
        ...s.mappings,
        {
          columnHeader: "",
          fieldKey: "",
          label: "",
          emoji: "",
          displayOrder: s.mappings.length + 1,
          isRequired: false,
        },
      ],
    }));
  };

  const removeMapping = (i: number) => {
    setForm((s) => ({
      ...s,
      mappings: s.mappings.filter((_, idx) => idx !== i),
    }));
  };

  const setDisplayName = (i: number) => {
    setForm((s) => ({
      ...s,
      mappings: s.mappings.map((m, idx) => ({
        ...m,
        isDisplayName: idx === i ? true : false,
      })),
    }));
  };

  const setSubtitle = (i: number) => {
    setForm((s) => ({
      ...s,
      mappings: s.mappings.map((m, idx) => ({
        ...m,
        isSubtitle: idx === i ? true : false,
      })),
    }));
  };

  const save = (regenerateSecret = false) => {
    runAction({
      id: mode === "edit" ? initial.id : null,
      spreadsheetId: form.spreadsheetId.trim(),
      sheetName: form.sheetName.trim(),
      fieldMappings: form.mappings,
      regenerateSecret,
    });
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-sm border border-paper/10 bg-ink-soft/30 p-5 md:grid-cols-2">
        <Field label="Spreadsheet ID">
          <input
            value={form.spreadsheetId}
            onChange={(e) =>
              setForm((s) => ({ ...s, spreadsheetId: e.target.value }))
            }
            placeholder="1AbCdE…"
            className="mt-2 w-full rounded-sm border border-paper/15 bg-ink px-3 py-2 font-typewriter text-sm text-paper focus:border-neon focus:outline-none"
          />
        </Field>
        <Field label="シート名">
          <input
            value={form.sheetName}
            onChange={(e) =>
              setForm((s) => ({ ...s, sheetName: e.target.value }))
            }
            className="mt-2 w-full rounded-sm border border-paper/15 bg-ink px-3 py-2 font-typewriter text-sm text-paper focus:border-neon focus:outline-none"
          />
        </Field>
      </section>

      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="font-dot text-base tracking-[0.1em] text-paper">
            フィールドマッピング
          </h2>
          <button
            type="button"
            onClick={addMapping}
            className="rounded-sm border border-neon/60 px-3 py-1 font-typewriter text-[11px] uppercase tracking-[0.25em] text-neon transition-colors hover:bg-neon hover:text-ink"
          >
            + 行を追加
          </button>
        </header>

        {form.mappings.length === 0 ? (
          <div className="rounded-sm border border-dashed border-paper/15 bg-ink-soft/30 p-6 text-center font-handwritten text-paper/60">
            マッピングがありません。「+ 行を追加」から登録してください。
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-paper/10">
            <table className="min-w-full divide-y divide-paper/10 text-left font-typewriter text-[11px] uppercase tracking-[0.15em] text-paper/70">
              <thead className="bg-ink-soft/50 text-paper/50">
                <tr>
                  <th className="px-3 py-2">列名</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">ラベル</th>
                  <th className="px-3 py-2">絵文字</th>
                  <th className="px-3 py-2">順</th>
                  <th className="px-3 py-2 text-center">必須</th>
                  <th className="px-3 py-2 text-center">表示名</th>
                  <th className="px-3 py-2 text-center">副題</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper/10 bg-ink-soft/20">
                {form.mappings.map((m, i) => (
                  <tr key={i}>
                    <td className="p-1">
                      <input
                        value={m.columnHeader}
                        onChange={(e) =>
                          updateMapping(i, { columnHeader: e.target.value })
                        }
                        className="w-44 rounded-sm border border-paper/10 bg-ink px-2 py-1 text-paper focus:border-neon focus:outline-none"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        value={m.fieldKey}
                        onChange={(e) =>
                          updateMapping(i, { fieldKey: e.target.value })
                        }
                        className="w-28 rounded-sm border border-paper/10 bg-ink px-2 py-1 text-paper focus:border-neon focus:outline-none"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        value={m.label}
                        onChange={(e) =>
                          updateMapping(i, { label: e.target.value })
                        }
                        className="w-32 rounded-sm border border-paper/10 bg-ink px-2 py-1 text-paper focus:border-neon focus:outline-none"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        value={m.emoji}
                        onChange={(e) =>
                          updateMapping(i, { emoji: e.target.value })
                        }
                        className="w-14 rounded-sm border border-paper/10 bg-ink px-2 py-1 text-center text-paper focus:border-neon focus:outline-none"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        value={m.displayOrder}
                        onChange={(e) =>
                          updateMapping(i, {
                            displayOrder: Number(e.target.value),
                          })
                        }
                        className="w-16 rounded-sm border border-paper/10 bg-ink px-2 py-1 text-paper focus:border-neon focus:outline-none"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <input
                        type="checkbox"
                        checked={m.isRequired}
                        onChange={(e) =>
                          updateMapping(i, { isRequired: e.target.checked })
                        }
                      />
                    </td>
                    <td className="p-1 text-center">
                      <input
                        type="radio"
                        name="displayName"
                        checked={!!m.isDisplayName}
                        onChange={() => setDisplayName(i)}
                      />
                    </td>
                    <td className="p-1 text-center">
                      <input
                        type="radio"
                        name="subtitle"
                        checked={!!m.isSubtitle}
                        onChange={() => setSubtitle(i)}
                      />
                    </td>
                    <td className="p-1">
                      <button
                        type="button"
                        onClick={() => removeMapping(i)}
                        className="rounded-sm border border-rose/40 px-2 py-1 text-[10px] text-rose transition-colors hover:bg-rose hover:text-ink"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mode === "edit" ? (
        <section className="rounded-sm border border-paper/10 bg-ink-soft/30 p-5">
          <h2 className="font-dot text-base tracking-[0.1em] text-paper">
            Webhook Secret
          </h2>
          <p className="mt-1 font-handwritten text-sm text-paper/60">
            Google Apps Script から呼ぶ際に <code>X-Webhook-Secret</code> ヘッダーに設定します。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 break-all rounded-sm border border-paper/10 bg-ink px-3 py-2 font-typewriter text-xs text-paper">
              {showSecret ? secret : "•".repeat(Math.min(48, secret.length))}
            </code>
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="rounded-sm border border-paper/20 px-3 py-2 font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/70 transition-colors hover:border-neon hover:text-neon"
            >
              {showSecret ? "hide" : "show"}
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={isPending}
              className="rounded-sm border border-rose/60 px-3 py-2 font-typewriter text-[11px] uppercase tracking-[0.25em] text-rose transition-colors hover:bg-rose hover:text-ink disabled:opacity-40"
            >
              regenerate
            </button>
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-paper/20 px-4 py-2 font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/60 transition-colors hover:border-paper hover:text-paper"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => save(false)}
          disabled={isPending}
          className="rounded-sm bg-neon px-5 py-2 font-dot text-sm tracking-[0.2em] text-ink shadow-neon transition-opacity disabled:opacity-40"
        >
          {isPending ? "保存中…" : mode === "create" ? "作成する" : "保存する"}
        </button>
      </div>

      {state.status === "success" ? (
        <div className="rounded-sm border border-neon/40 bg-neon/5 px-4 py-2 font-typewriter text-sm text-neon">
          {state.mode === "create" ? "作成しました" : "保存しました"}
        </div>
      ) : null}
      {state.status === "error" ? (
        <div className="rounded-sm border border-rouge/60 bg-rouge/10 px-4 py-2 font-typewriter text-sm text-rose">
          {state.message}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/60">
        {label}
      </span>
      {children}
    </label>
  );
}
