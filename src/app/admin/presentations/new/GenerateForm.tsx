"use client";

import { useActionState, useRef } from "react";
import { generatePresentationAction } from "./actions";

const INITIAL: { status: "idle" } = { status: "idle" };

export function GenerateForm({ profileId }: { profileId: string }) {
  const [state, action, pending] = useActionState(generatePresentationAction, INITIAL);
  const colorRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="profileId" value={profileId} />

      {/* テーマカラー */}
      <div className="space-y-2">
        <label className="block font-typewriter text-[10px] uppercase tracking-[0.35em] text-paper/60">
          テーマカラー
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => colorRef.current?.click()}
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-paper/20 transition-all hover:border-neon"
            aria-label="カラーピッカーを開く"
          >
            <input
              ref={colorRef}
              type="color"
              name="themeColor"
              defaultValue="#6366f1"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div
              className="h-full w-full"
              style={{ background: "var(--preview-color, #6366f1)" }}
              id="color-preview"
            />
          </button>
          <input
            type="text"
            readOnly
            id="color-display"
            defaultValue="#6366f1"
            className="w-28 bg-transparent font-typewriter text-[12px] tracking-widest text-paper/70 outline-none"
          />
          <span className="font-typewriter text-[10px] text-paper/30">
            ← クリックして選択
          </span>
        </div>
        <ColorSyncScript />
      </div>

      {/* イメージキーワード */}
      <div className="space-y-2">
        <label
          htmlFor="imageKeywords"
          className="block font-typewriter text-[10px] uppercase tracking-[0.35em] text-paper/60"
        >
          ゲストのイメージ・キーワード
        </label>
        <textarea
          id="imageKeywords"
          name="imageKeywords"
          required
          rows={4}
          placeholder="例: 落ち着いた雰囲気、読書好き、知的でちょっとシャイ、クラシック音楽が好き"
          className="w-full resize-none rounded-sm border border-paper/15 bg-paper/3 px-4 py-3 font-typewriter text-[12px] leading-relaxed text-paper/80 placeholder-paper/20 outline-none transition-colors focus:border-neon/50"
        />
        <p className="font-typewriter text-[9px] text-paper/30">
          AIがこのキーワードをもとにデザインを生成します。具体的なほどイメージに合った結果になります。
        </p>
      </div>

      {/* エラー表示 */}
      {state.status === "error" && (
        <p className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 font-typewriter text-[11px] text-red-400">
          {state.message}
        </p>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={pending}
        className="group relative w-full overflow-hidden rounded-sm border border-neon/40 bg-neon/5 px-6 py-4 font-typewriter text-[11px] uppercase tracking-[0.4em] text-neon transition-all hover:bg-neon/10 hover:border-neon disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-3">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-neon/40 border-t-neon" />
            AI が生成中…しばらくお待ちください
          </span>
        ) : (
          "▶ 収録プレゼンを生成"
        )}
      </button>
    </form>
  );
}

function ColorSyncScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  var input = document.querySelector('input[name="themeColor"]');
  var preview = document.getElementById('color-preview');
  var display = document.getElementById('color-display');
  if (!input) return;
  function sync(v) {
    if (preview) preview.style.background = v;
    if (display) display.value = v;
  }
  input.addEventListener('input', function() { sync(this.value); });
  sync(input.value);
})();
`,
      }}
    />
  );
}
