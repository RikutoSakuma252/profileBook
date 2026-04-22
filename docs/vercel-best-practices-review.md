# Vercel React ベストプラクティス レビュー

本ドキュメントは Vercel Engineering が公開している React / Next.js パフォーマンスガイドライン（70 項目・8 カテゴリ）に照らして、本プロジェクトの現状を評価・改善提案したものです。

レビュー時点のブランチは `perf/vercel-best-practices`（`bda4c4e` 基点）。

---

## 総合評価: **7 / 10**

| 観点 | 評価 | コメント |
|---|---|---|
| 構造・App Router の使い方 | 8/10 | Server/Client Component の境界が明確、`loading.tsx` / `error.tsx` / `proxy.ts` まで揃う |
| Waterfall 回避 | 7.5/10 | 主要ページで `Promise.all` 採用済、微小な並列化余地のみ |
| バンドル | 7/10 | Framer Motion を静的 import しているのが唯一の目立つ重し |
| キャッシュ戦略 | 5/10 | 全ページ `force-dynamic`、`revalidate` / `React.cache()` 未使用 |
| 再レンダリング最適化 | 7/10 | 現規模では十分、コールバック再生成・`memo` 不足あり |
| Mutation 実装 | 6/10 | `fetch + useState` パターン、Server Actions 未活用 |
| シリアライゼーション / DTO | 8/10 | `ProfileDto` / `FormConfigDto` 等で適切 |
| テスト | 2/10 | 皆無（`webapp-testing` / `playwright-best-practices` スキル導入済、実装は未着手） |

→ 基礎は堅牢、改善の主戦場は **キャッシュ戦略・Server Actions 移行・バンドル軽量化** の 3 領域。

---

## 優れている点

- `src/app/page.tsx` / `src/app/profiles/page.tsx` / `src/app/admin/page.tsx` などで `Promise.all` を使った並列クエリ（`async-parallel`）
- Server/Client Component の分離が明快（`ProfileBook` / `ImportRunner` / `ConfigEditor` / `AdminDeleteButton` がクライアント専用）
- `ProfileDto` / `FormConfigDto` 等の DTO で送信データを最小化（`server-serialization`）
- `src/lib/prisma.ts` のシングルトンパターン（`server-no-shared-module-state`）
- `loading.tsx` / `error.tsx` / `not-found.tsx` をルートおよびセグメント単位で配置（Suspense の基礎）
- パスエイリアス `@/` による静的解析可能な import（`bundle-analyzable-paths`）
- 管理系 API 各ルートでの認証チェック

---

## 優先度順の改善提案

### ① Priority 1 — Waterfalls（効果: 大）

**`src/app/profiles/[id]/page.tsx`** — `await params` → `auth()` → `findUnique` が直列になっている。`auth()` と `findUnique` は独立なので並列化可能。

```ts
// before
const { id } = await params;
const session = await auth();
const profile = await prisma.profile.findUnique({ where: { id }, include: { fields: { orderBy: { displayOrder: "asc" } } } });

// after
const [{ id }, session] = await Promise.all([params, auth()]);
const profile = await prisma.profile.findUnique({ where: { id }, include: { fields: { orderBy: { displayOrder: "asc" } } } });
```

`prev` / `next` は `profile.createdAt` に依存するため本質的に直列（`async-dependencies` として妥当）。

### ② Priority 2 — Bundle（効果: 大）

**`src/app/profiles/[id]/ProfileBook.tsx:4`** — `framer-motion` を静的 import（約 50KB gzipped）。閲覧体験の必須機能ではないので改善余地あり。

**選択肢 A**: `next/dynamic` で遅延ロード（見た目は維持）
```ts
const AnimatePresence = dynamic(
  () => import("framer-motion").then((m) => m.AnimatePresence),
  { ssr: false }
);
```

**選択肢 B**: CSS `transition` + `@keyframes` に置換（依存を完全に削除）
- 追加バンドル: 0 KB
- 見た目はやや簡素化する可能性

→ 未決定（次セッションで確認）。

### ③ Priority 3 — Server / Caching（効果: 大）

6 ファイルすべてが `export const dynamic = "force-dynamic"`。内容に応じた使い分けを推奨。

| ページ | 現状 | 推奨 | 理由 |
|---|---|---|---|
| `/` トップ | force-dynamic | `export const revalidate = 60;` | 統計値なのでキャッシュ可 |
| `/profiles` | force-dynamic | 維持 | searchParams があり動的 |
| `/profiles/[id]` | force-dynamic | `revalidate = 60` + `generateStaticParams()` 検討 | auth() 呼び出しを外せれば ISR 化可能 |
| `/admin/*` | force-dynamic | 維持 | 管理系は常に最新を見たい |

`src/lib/prisma.ts` に `React.cache()` でリクエストスコープ dedup ヘルパーを追加（`server-cache-react`）:

```ts
import { cache } from "react";

export const getProfileById = cache((id: string) =>
  prisma.profile.findUnique({
    where: { id },
    include: { fields: { orderBy: { displayOrder: "asc" } } },
  })
);
```

### ④ Priority 4 — Mutation（効果: 中）

**`src/app/admin/import/ImportRunner.tsx`** / **`src/app/admin/config/ConfigEditor.tsx`** / **`src/app/profiles/[id]/AdminDeleteButton.tsx`** — 全て `fetch + useState + router.refresh()` で mutation 実装。

React 19 の **Server Actions + `useActionState`** に移行することで:
- コード量が減少（`fetch`・エラー state・ローディング state を `useActionState` に集約）
- 楽観的 UI を `useOptimistic` で標準化
- CSRF 耐性がデフォルトで向上

→ スコープが大きいので別 PR に切る選択肢もあり。未決定。

### ⑤ Priority 5 — Re-render（効果: 中〜小）

**`src/app/profiles/[id]/ProfileBook.tsx:28-38`** — `toggle` / `openAll` / `closeAll` が毎レンダー新規生成され、`FieldRow` 全体が再レンダー。

```ts
const toggle = useCallback((id: string) => {
  setRevealed((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}, []);

// FieldRow を memo で包む
const FieldRow = memo(function FieldRow({ ... }) { ... });
```

**`src/app/admin/config/ConfigEditor.tsx`** — マッピング行の `updateMapping` が毎 keystroke で `mappings.map(...)` を回し全行再レンダー。行コンポーネントを分離 + `memo` + 行 ID を key に。

現規模（約 15 行）では体感差は小さいので **実施するかどうかは判断次第**。

### ⑥ Priority 6 — Rendering（効果: 小）

- **`src/app/page.tsx:7-14`** — ambient deco の 6 本の絶対配置 `div` は静的 JSX。コンポーネント外に定数として切り出し（`rendering-hoist-jsx`）
- 条件レンダー `{result && (...)}` が複数箇所 — ternary `{result ? (...) : null}` に寄せる（`rendering-conditional-render`）

### ⑦ 周辺改善（ベストプラクティス 70 項目外）

- **テスト不在**: 導入済みの `webapp-testing` / `playwright-best-practices` スキルを使って、まず `/profiles` 一覧 → 詳細 → reveal のハッピーパス E2E を 1 本書くと回帰検出可能
- **観測性**: `console.error` のみ。Vercel デプロイ時に Vercel Analytics か Sentry を追加検討
- **個別 mutation のエラー UI**: `error.tsx` は備えたが、個別操作（import / config 保存 / delete）は手書きエラー表示。Server Actions 移行と合わせて整理

---

## 短時間で 7 → 8 に上がる「一撃」3 つ

1. **Framer Motion の dynamic import か CSS 置換** — `ProfileBook.tsx`
2. **トップと詳細の `revalidate` 化** — `src/app/page.tsx` / `src/app/profiles/[id]/page.tsx`
3. **Mutation 3 箇所の Server Actions 移行** — `ImportRunner` / `ConfigEditor` / `AdminDeleteButton`

---

## 次セッションで確認したいこと

1. Framer Motion: `next/dynamic` か CSS 置換か
2. Server Actions 移行: 今回の PR に含めるか別 PR か
3. `ConfigEditor` の行分割 + memo 化: やるかスキップか

残りの項目（`profile-detail` の `Promise.all` 化、トップの `revalidate=60`、`ProfileBook` の `useCallback` / `memo`、ambient deco の JSX hoist、条件レンダー ternary 化）は確認不要で進行可。
