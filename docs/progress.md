# ダマテンラジオ プロフィール帳 — 実装進捗・要件メモ

> 最終更新: 2026-04-25

---

## 現在のブランチ状況

| ブランチ | 状態 | 内容 |
|---|---|---|
| `main` | 最新 | Phase 1〜6 + ユニットテスト93件 |
| `feat/radio-presentation` | **未マージ** | 収録プレゼン生成機能（下記参照） |

---

## 実装済み機能（main ブランチ）

### Phase 1〜5（コア機能）
- [x] Google OAuth 認証（`@e3sys.co.jp` ドメイン制限）
- [x] admin / viewer ロール管理
- [x] Google Sheets からのプロフィールインポート（手動・Webhook）
- [x] プロフィール一覧（検索・ソート・ページネーション）
- [x] プロフィール詳細（フィールド開閉 UI、「深夜ラジオ × 機密書類」デザイン）
- [x] 管理画面（FormConfig 設定、インポートログ）
- [x] プロフィール削除（admin 専用）

### Phase 6（仕上げ）
- [x] ローディング / エラー UI
- [x] `middleware.ts → proxy.ts` 移行（Auth.js v5 対応）
- [x] Vercel ベストプラクティス対応（Server Actions 移行・Prisma 最適化）

### テスト（2026-04-25 追加）
- [x] Vitest セットアップ（`npm run test:run`）
- [x] **93件のユニットテスト**（全パス）

| テストファイル | 件数 | カバー内容 |
|---|---|---|
| `src/lib/__tests__/profile-transformer.test.ts` | 23件 | 純粋関数（変換・ハッシュ・バリデーション） |
| `src/lib/__tests__/import-service.test.ts` | 9件 | `runImport`（Prisma・Sheets モック） |
| `src/app/api/__tests__/webhook-route.test.ts` | 7件 | webhook secret 認証・インポートトリガー |
| `src/app/api/__tests__/profiles-route.test.ts` | 14件 | ページネーション・検索・ソート・認証 |
| `src/app/api/__tests__/import-logs-route.test.ts` | 8件 | ページネーション・DTO 変換 |
| `src/__tests__/auth-config.test.ts` | 14件 | `authorized` / `session` コールバック |
| `src/__tests__/server-actions.test.ts` | 18件 | `saveConfigAction` / `deleteProfileAction` / `runImportAction` |

---

## 新要件：収録プレゼン HTML 生成機能

### 背景・目的
ダマテンラジオの収録中、ゲストの回答を1問ずつ「ペラペラめくって」発表したい。
ゲストのイメージに合ったデザインで、収録用のプレゼンHTMLを自動生成する。

### 要件定義（確定）

| 項目 | 内容 |
|---|---|
| 写真アップロード | なし |
| デザイン生成 | AI（OpenAI GPT-4o）がゲストのイメージキーワード＋テーマカラーをもとにHTML全体を生成 |
| キーワード入力 | 自由テキスト入力（例：「落ち着いた雰囲気、読書好き、知的でちょっとシャイ」） |
| テーマカラー | カラーピッカーで手動入力（収録用のゲストイメージカラー） |
| 保存 | 生成HTMLをDBに保存（RadioPresentation モデル）。複数バージョン保存・最新1件を表示 |
| 表示形式 | Web アプリ内のページ（iframe でレンダリング） |

### プレゼン画面の仕様
- **左側（約65%）**: 現在の回答を大きく表示
- **右側（約35%）**: 全回答リスト（クリックでジャンプ可能）
- **下部ナビ**: 「← 前へ」「次へ →」ボタン＋キーボード矢印キー対応
- **カード順序**: 1枚目 = ラジオネーム → 2枚目以降 = Q1・Q2・Q3…

### アクセス権限
| ページ | 権限 |
|---|---|
| `/admin/presentations/new` | admin のみ（生成フォーム） |
| `/presentations/[id]` | viewer 以上（閲覧） |

---

## feat/radio-presentation ブランチの実装内容

### 実装済み ✅

- [x] **Prisma スキーマ**: `RadioPresentation` モデル追加・マイグレーション適用済み
  ```prisma
  model RadioPresentation {
    id            String   @id @default(cuid())
    profileId     String
    themeColor    String
    imageKeywords String
    generatedHtml String
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
    profile       Profile  @relation(...)
  }
  ```
- [x] **openai パッケージ** インストール済み（v6.x）
- [x] **`src/lib/openai-client.ts`**: OpenAI クライアントのシングルトン
- [x] **`src/app/admin/presentations/new/actions.ts`**: Server Action
  - admin 認証チェック
  - プロフィール + フィールドデータ取得
  - GPT-4o へのプロンプト送信（frontend-design スキルの設計哲学を組み込み済み）
  - 生成HTMLをDBに保存
  - `/presentations/[id]` へリダイレクト
- [x] **`src/app/admin/presentations/new/page.tsx`**: 生成フォームページ
  - プロフィールの回答データプレビュー
  - テーマカラーピッカー
  - イメージキーワード textarea
  - ローディング状態・エラー表示
- [x] **`src/app/admin/presentations/new/GenerateForm.tsx`**: フォームクライアントコンポーネント
- [x] **`src/app/api/presentations/[id]/html/route.ts`**: 生成HTMLの配信ルート（認証付き）
- [x] **`src/app/presentations/[id]/page.tsx`**: プレゼンビューアページ（iframe 表示）
- [x] **`src/auth.config.ts`**: `/presentations/*` をログイン必須ルートに追加
- [x] **`src/app/profiles/[id]/page.tsx`**: 「収録HTML生成」ボタンを追加
- [x] 型チェック（`tsc --noEmit`）エラーゼロ
- [x] 既存テスト93件 全パス維持

### 未実装・残タスク ⬜

- [ ] **`OPENAI_API_KEY` の設定**（本人作業）
  - `.env.local` に追加: `OPENAI_API_KEY=sk-...`
  - Vercel の環境変数にも追加が必要
- [ ] **Phase 6 本番作業**（収録プレゼン機能とは別・元々未着手）
  - Vercel へのデプロイ
  - Neon（PostgreSQL）への移行
  - 本番環境変数の設定
  - Google Cloud Console / サービスアカウント設定
  - Google Apps Script の本番設置
  - E2E 動作確認
- [ ] **E2E テスト**（Playwright）
  - 認証フロー
  - プロフィール操作
  - 収録プレゼン生成フロー
  - `test.md` に計画済み
- [ ] **収録プレゼン機能の追加改善**（任意・優先度低）
  - 生成履歴一覧ページ（`/admin/presentations`）
  - プロフィールページに最新プレゼンへのリンク表示
  - 再生成時の確認ダイアログ

---

## 環境変数一覧

| 変数名 | 用途 | 設定場所 |
|---|---|---|
| `DATABASE_URL` | Prisma DB 接続 | `.env.local` / Vercel |
| `AUTH_SECRET` | Auth.js セッション暗号化 | `.env.local` / Vercel |
| `AUTH_GOOGLE_ID` | Google OAuth クライアントID | `.env.local` / Vercel |
| `AUTH_GOOGLE_SECRET` | Google OAuth シークレット | `.env.local` / Vercel |
| `ALLOWED_EMAIL_DOMAIN` | 許可メールドメイン（`e3sys.co.jp`） | `.env.local` / Vercel |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Sheets API 認証 | `.env.local` / Vercel |
| `OPENAI_API_KEY` | 収録プレゼン生成（新規） | `.env.local` / Vercel |

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5.7 |
| ORM | Prisma 6 |
| DB（開発）| SQLite |
| DB（本番）| Neon（PostgreSQL）※未移行 |
| 認証 | Auth.js v5（Google OAuth） |
| スタイル | Tailwind CSS 3.4 |
| アニメーション | Framer Motion |
| ユニットテスト | Vitest 4.x |
| AI生成 | OpenAI GPT-4o |
| デプロイ | Vercel |
