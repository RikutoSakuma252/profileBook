# ダマテンラジオ プロフィール帳 — テスト計画

## 使用スキル一覧

| スキル | 役割 | 対象テスト種別 |
|---|---|---|
| `playwright-best-practices` | E2E・API・コンポーネントテストの記述ガイド | 認証フロー、ルート保護、管理機能、Webhook API |
| `webapp-testing` | ローカル起動中アプリへのブラウザ操作・スクリーンショット | UI 操作の実動確認（フィールド開閉など） |
| `vitest` | Server Actions・ユーティリティ関数のユニットテスト | Server Actions の純粋ロジック、Prisma モック |
| `security-review` | 認証・入力バリデーション・API 保護のセキュリティ検証 | Webhook 認証、ロールバイパス試行 |
| `accessibility` | WCAG 2.2 準拠チェック（axe-core 統合） | ログインページ、プロフィール詳細のキーボード操作 |

---

## テスト一覧

### A. 認証 / アクセス制御

> 使用スキル: `playwright-best-practices` / `security-review`

| ID | テスト内容 | 期待結果 | 優先度 |
|---|---|---|---|
| A-1 | 未ログインで `/profiles` へアクセス | `/login` へリダイレクト | 高 |
| A-2 | 未ログインで `/admin` へアクセス | `/login` へリダイレクト | 高 |
| A-3 | viewer ロールで `/admin` へアクセス | `/?forbidden=1` へリダイレクト | 高 |
| A-4 | dev ログインフォームに `test@e3sys.co.jp` を入力してログイン | viewer セッション確立、`/` へ遷移 | 高 |
| A-5 | dev ログインフォームに `test@e3sys.co.jp` で admin 昇格後にログイン | admin セッション確立、`/admin` アクセス可 | 高 |
| A-6 | 許可ドメイン外メールでログイン試行（Google OAuth モック） | `/login?error=domain` が表示される | 中 |
| A-7 | 未ログイン状態で `/api/admin/*` を直接 fetch | `{ error: "forbidden" }` / 403 | 高 |

---

### P. プロフィール表示

> 使用スキル: `webapp-testing` / `playwright-best-practices`

| ID | テスト内容 | 期待結果 | 優先度 |
|---|---|---|---|
| P-1 | viewer ログイン後に `/profiles` を開く | プロフィールカード一覧が表示される | 高 |
| P-2 | プロフィールカードをクリック | `/profiles/[id]` 詳細ページへ遷移 | 高 |
| P-3 | 詳細ページのフィールド行をクリック（LOCKED 状態） | `LOCKED` が消え、内容テキストが表示される | 高 |
| P-4 | 同じフィールドをもう一度クリック（開いた状態） | `LOCKED` に戻る | 中 |
| P-5 | 「すべて開く」ボタンをクリック | 全フィールドの内容が表示される | 高 |
| P-6 | 「すべて閉じる」ボタンをクリック | 全フィールドが LOCKED に戻る | 高 |
| P-7 | 「すべて開く」ボタンは全開時に disabled になる | ボタンが `disabled` 属性を持つ | 中 |
| P-8 | 「すべて閉じる」ボタンは全閉時に disabled になる | ボタンが `disabled` 属性を持つ | 中 |
| P-9 | viewer ロールで詳細ページを開く | 削除ボタンが表示されない | 高 |
| P-10 | admin ロールで詳細ページを開く | 削除ボタンが表示される | 高 |
| P-11 | 存在しない `/profiles/invalid-id` へアクセス | 404 ページが表示される | 中 |

---

### M. 管理機能（admin 限定）

> 使用スキル: `playwright-best-practices` / `webapp-testing`

| ID | テスト内容 | 期待結果 | 優先度 |
|---|---|---|---|
| M-1 | admin で `/admin/config` を開く | FormConfig の内容が表示される | 中 |
| M-2 | ConfigEditor でスプレッドシートID を変更して保存 | success 状態になり、更新値が反映される | 中 |
| M-3 | ConfigEditor で spreadsheetId を空にして保存 | エラーメッセージが表示される | 中 |
| M-4 | 「Webhook シークレット再生成」を実行 | 新しいシークレットが表示される | 低 |
| M-5 | `/admin/import` でインポート実行ボタンをクリック | インポート結果（件数）が表示される | 中 |
| M-6 | viewer で `/admin/config` に直接アクセス | `/?forbidden=1` へリダイレクト | 高 |

---

### S. Server Actions（ユニットテスト）

> 使用スキル: `vitest`

| ID | テスト内容 | 期待結果 | 優先度 |
|---|---|---|---|
| S-1 | `deleteProfileAction` — admin セッションで正常なIDを渡す | プロフィール削除、`/profiles` へ redirect | 高 |
| S-2 | `deleteProfileAction` — viewer セッションで呼ぶ | `{ status: "error", message: "forbidden" }` | 高 |
| S-3 | `deleteProfileAction` — 存在しない ID を渡す | `{ status: "error", message: "not_found" }` | 中 |
| S-4 | `saveConfigAction` — viewer セッションで呼ぶ | `{ status: "error", message: "forbidden" }` | 高 |
| S-5 | `saveConfigAction` — spreadsheetId が空文字 | `{ status: "error", message: "spreadsheetId is required" }` | 中 |
| S-6 | `saveConfigAction` — fieldMappings が配列でない | `{ status: "error", message: "fieldMappings must be an array" }` | 中 |
| S-7 | `saveConfigAction` — id=null で有効なペイロード | 新規 FormConfig が作成される | 中 |
| S-8 | `saveConfigAction` — 既存 id で有効なペイロード | FormConfig が更新される | 中 |
| S-9 | `runImportAction` — viewer セッションで呼ぶ | `{ status: "error", message: "forbidden" }` | 高 |
| S-10 | `runImportAction` — formConfigId が空 | `{ status: "error", message: "formConfigId is required" }` | 中 |

---

### W. Webhook API

> 使用スキル: `playwright-best-practices`（API テスト機能） / `security-review`

| ID | テスト内容 | 期待結果 | 優先度 |
|---|---|---|---|
| W-1 | `x-webhook-secret` ヘッダーなしで POST | `{ error: "unauthorized" }` / 401 | 高 |
| W-2 | 不正なシークレットで POST | `{ error: "unauthorized" }` / 401 | 高 |
| W-3 | 正しいシークレットで POST | `{ imported, skipped }` / 200 | 高 |
| W-4 | `spreadsheetId` を body に含めて正しいシークレットで POST | 対象 config のインポートが実行される | 中 |
| W-5 | 不正な JSON body で POST | エラーにならず空オブジェクトとして処理される | 低 |

---

### Ac. アクセシビリティ

> 使用スキル: `accessibility`

| ID | テスト内容 | 期待結果 | 優先度 |
|---|---|---|---|
| Ac-1 | ログインページの axe-core スキャン | WCAG 2.2 違反ゼロ | 中 |
| Ac-2 | プロフィール詳細の `aria-expanded` 属性確認 | フィールド行の button が開閉に応じて `aria-expanded` を切り替える | 中 |
| Ac-3 | プロフィール詳細でキーボード（Tab + Enter）のみで全フィールドを開けるか | マウスなしで操作完結 | 低 |
| Ac-4 | `/profiles` 一覧の axe-core スキャン | WCAG 2.2 違反ゼロ | 低 |

---

## 実装優先度まとめ

```
Phase 1 — 高優先（認証・コア機能の保護）
  A-1, A-2, A-3, A-4, A-7
  P-1, P-3, P-5, P-6, P-9, P-10
  S-2, S-4, S-9
  W-1, W-2, W-3

Phase 2 — 中優先（管理機能・バリデーション）
  A-5, A-6
  P-2, P-4, P-7, P-8, P-11
  M-1, M-2, M-3, M-5, M-6
  S-1, S-3, S-5, S-6, S-7, S-8, S-10
  W-4
  Ac-1, Ac-2

Phase 3 — 低優先（エッジケース・a11y）
  M-4
  W-5
  Ac-3, Ac-4
```

---

## ディレクトリ構成（想定）

```
tests/
  e2e/
    auth.spec.ts          # A-1〜A-7
    profiles.spec.ts      # P-1〜P-11
    admin.spec.ts         # M-1〜M-6
    webhook.spec.ts       # W-1〜W-5
    accessibility.spec.ts # Ac-1〜Ac-4
  unit/
    actions/
      deleteProfile.test.ts   # S-1〜S-3
      saveConfig.test.ts      # S-4〜S-8
      runImport.test.ts       # S-9〜S-10
  fixtures/
    auth.ts               # ログイン済みセッションの共通フィクスチャ
```

---

## スキル呼び出しメモ

| タスク | 呼び出すスキル |
|---|---|
| Playwright セットアップ・E2E テスト記述 | `/playwright-best-practices` |
| ローカルアプリの実動確認・スクリーンショット | `/webapp-testing` |
| Server Actions のユニットテスト記述 | `/vitest` |
| セキュリティ観点のチェックリスト確認 | `/security-review` |
| アクセシビリティ修正・axe-core 統合 | `/accessibility` |
