# プロフィール帳 Web アプリケーション 設計書

> **プロジェクト名**: ダマテンラジオ プロフィール帳  
> **最終更新**: 2026-04-17  
> **ステータス**: 設計確定 → 実装着手可能

---

## 1. プロジェクト概要

Google Form で収集した社内メンバーの回答データを「プロフィール帳」形式で楽しく閲覧できる Web アプリケーション。

### コンセプト

- 回答は最初は隠されており、クリック等の操作で段階的に開示される「遊び心のあるUI」
- 社内限定（会社ドメイン認証）
- Google Form に回答が来たら自動的にアプリに反映

---

## 2. 決定事項一覧

| カテゴリ | 項目 | 決定内容 |
|----------|------|----------|
| フォーム | 質問項目 | 17項目（固定）。必須/任意混在。詳細は「3. データ定義」参照 |
| フォーム | 画像アップロード | なし |
| 利用者 | 公開範囲 | 社内メンバーのみ |
| 利用者 | 認証 | `@e3sys.co.jp` ドメインの Google アカウントのみログイン可。それ以外は拒否 |
| 利用者 | 管理者 | sakuma@e3sys.co.jp の1名（初期）。管理画面または DB 操作で追加可能 |
| 取り込み | タイミング | Google Form 回答時に自動反映（Webhook） |
| 取り込み | 想定回答者数 | 30〜100人 |
| デザイン | 雰囲気 | `/frontend-design` スキルで作成（おまかせ） |
| デザイン | 隠しUI | おまかせ（複数パターン組み合わせ） |
| デザイン | デバイス | PC メイン（レスポンシブ不要） |
| MVP | 必須機能 | 閲覧、取り込み、検索、管理画面GUI、ログイン認証 |
| MVP | 不要機能 | PDF/画像エクスポート、テーマ切替、回答者編集機能 |
| 技術 | スタック | Next.js 15 + Prisma + SQLite→PostgreSQL + Vercel |
| 技術 | ドメイン | Vercel デフォルト URL（`xxx.vercel.app`） |
| 技術 | 費用 | 無料枠のみ |
| 開発 | 体制 | 個人開発 |
| 開発 | 目標 | できるだけ早く |

---

## 3. データ定義（Google Form 質問項目）

元フォーム名: **ダマテンラジオ プロフィール（回答）**

| # | 列名（原文） | フィールドキー | 表示ラベル | 必須/任意 | 型 |
|---|-------------|---------------|-----------|----------|-----|
| 1 | タイムスタンプ | `timestamp` | — （非表示） | 自動 | datetime |
| 2 | メールアドレス | `email` | — （非表示・認証用） | 自動 | text |
| 3 | 📻 ラジオネーム（本名禁止） | `radio_name` | ラジオネーム | 必須 | text |
| 4 | 🎭 自分を一言で言うと「表の顔」は？ | `public_face` | 表の顔 | 必須 | text |
| 5 | 👀 今だから言える入社直後の第一印象 | `first_impression` | 入社直後の第一印象 | 必須 | text |
| 6 | 💰 宝くじ当たったら明日会社来る？ | `lottery` | 宝くじ当たったら？ | 必須 | text |
| 7 | 🔥 密かに抱いている野望 | `ambition` | 密かな野望 | 必須 | text |
| 8 | 😭 人生で一番泣いた日はいつ？（オプション） | `cry_day` | 一番泣いた日 | 任意 | text |
| 9 | 🧠 消したい記憶ある？ | `erase_memory` | 消したい記憶 | 任意 | text |
| 10 | 😔 ずっと引きずってる失敗は？ | `lingering_failure` | 引きずってる失敗 | 任意 | text |
| 11 | 🙅‍♀️ 実はちょっと苦手な社内ルール | `disliked_rule` | 苦手な社内ルール | 任意 | text |
| 12 | 🤫 仕事中に一番サボってる瞬間は？ | `slacking_moment` | サボってる瞬間 | 任意 | text |
| 13 | 🕵️‍♂️ もし一日だけ別部署に潜入するなら？ | `infiltrate_dept` | 潜入したい部署 | 任意 | text |
| 14 | ✨ 社内でこっそり憧れてる人 | `admired_person` | 憧れてる人 | 任意 | text |
| 15 | 🚀 テンションが上がるスイッチは？ | `excitement_switch` | テンション上がるスイッチ | 任意 | text |
| 16 | 🔄 あの時ああしてればって思う出来事ある？ | `regret` | あの時ああしてれば | 任意 | text |
| 17 | 🔒 絶対にバレたくない過去の失敗 | `secret_failure` | バレたくない過去 | 任意 | text |

### 表示ルール

- `timestamp` と `email` はプロフィール帳には表示しない（内部管理用）
- `radio_name`（#3）を **表示名（displayName）** として使用
- `public_face`（#4）を **サブタイトル** として一覧カードにも表示
- 任意項目（#8〜#17）は回答がない場合、その項目自体を非表示にする
- 各項目の絵文字は表示ラベルのアイコンとして活用する

---

## 4. 技術スタック

| レイヤー | 技術 | バージョン | 備考 |
|----------|------|-----------|------|
| フレームワーク | Next.js (App Router) | 15.x | フルスタック統合 |
| 言語 | TypeScript | 5.x | 型安全 |
| UI スタイル | Tailwind CSS | 4.x | ユーティリティファースト |
| アニメーション | Framer Motion | 12.x | カードめくり等の演出 |
| ORM | Prisma | 6.x | 型安全 DB 操作 |
| DB（開発） | SQLite | — | ファイルベース、即開発開始 |
| DB（本番） | PostgreSQL (Neon) | — | Prisma provider 変更のみ |
| 認証 | NextAuth.js (Auth.js v5) | 5.x | Google OAuth + ドメイン制限 |
| Google 連携 | Google Sheets API v4 | — | サービスアカウント認証 |
| 自動取り込み | Google Apps Script | — | Form 送信トリガー → Webhook |
| ホスティング | Vercel | — | 無料枠 |
| パッケージ管理 | npm | — | — |

---

## 5. アーキテクチャ

### 5.1 全体構成

```
 [回答者]
    │
    ▼
 Google Form ──▶ Google Spreadsheet
    │                    │
    │(送信トリガー)        │(Sheets API v4)
    ▼                    ▼
 Google Apps Script ──▶ Next.js API (Webhook)
                         │
                    ┌────┴────┐
                    │ Service  │
                    │  Layer   │
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │ Prisma   │
                    │  ORM     │
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │ SQLite / │
                    │ Postgres │
                    └─────────┘
                         ▲
                         │
                    ┌────┴────┐
                    │ Next.js  │──▶ [閲覧ユーザー]
                    │ Frontend │    (e3sys.co.jp ドメインのみ)
                    └─────────┘
```

### 5.2 データフロー

#### 自動取り込みフロー

1. 回答者が Google Form に回答を送信
2. Google Spreadsheet に回答が蓄積される
3. Google Apps Script の送信トリガーが発火
4. Apps Script が Next.js の Webhook API (`POST /api/webhook/form-submit`) を呼び出す
5. Webhook API が Google Sheets API 経由で最新の回答を取得
6. 生データを `raw_responses` テーブルに保存
7. プロフィール帳形式に変換し `profiles` + `profile_fields` テーブルに保存

#### 閲覧フロー

1. ユーザーがアプリにアクセス
2. Google OAuth で認証（`e3sys.co.jp` ドメインチェック）
3. 一覧画面でプロフィールカードをグリッド表示
4. カードクリック → 詳細画面へ遷移
5. 各質問項目が「隠された状態」で表示 → クリックで回答が開示される

#### 手動取り込みフロー（管理画面）

1. 管理者が管理画面にアクセス（`role: admin` チェック）
2. 「取り込み実行」ボタンをクリック
3. Google Sheets API で全データ取得
4. 既存データとの差分（`respondent_id` で判定）を検出
5. 新規回答のみ追加保存

### 5.3 認証フロー

```
ユーザー → ログインページ → Google OAuth 同意画面
  → Google が認証コード返却
  → NextAuth.js がトークン取得
  → メールアドレスのドメインを検証（@e3sys.co.jp のみ許可）
  → セッション発行 → アプリ利用可能

管理者判定:
  users テーブルの role カラムが "admin" → 管理画面アクセス可
  初期管理者は DB に直接登録（seed）
```

### 5.4 認証・認可ポリシー

| ルール | 内容 |
|--------|------|
| **ログイン許可ドメイン** | `@e3sys.co.jp` のメールアドレスを持つ Google アカウントのみ。それ以外のドメインはサインイン時にエラーとし、セッションを発行しない |
| **閲覧権限** | ログイン済みの `@e3sys.co.jp` ユーザー全員がプロフィール帳を閲覧可能 |
| **管理権限** | `users` テーブルで `role = "admin"` のユーザーのみ。管理画面（`/admin/*`）および管理系 API（`/api/admin/*`）にアクセス可能 |
| **初期管理者** | `sakuma@e3sys.co.jp` の1名のみ。Seed スクリプトで登録 |
| **管理者の追加** | 初期管理者が管理画面から追加するか、DB を直接操作して `role` を変更 |
| **未登録ユーザー** | `@e3sys.co.jp` ドメインで初回ログインしたユーザーは `users` テーブルに `role = "viewer"` として自動登録される |
| **実装方法** | NextAuth.js の `signIn` コールバックでドメイン検証。`session` コールバックで `role` をセッションに含める。Next.js Middleware で `/admin/*` へのアクセスをロール判定 |

---

## 6. DB 設計

### 6.1 ER 図

```
form_configs 1──N raw_responses 1──1 profiles 1──N profile_fields
     │
     └── 1──N import_logs

users（独立テーブル）
```

### 6.2 テーブル定義

#### `form_configs` — フォーム設定

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | PK |
| spreadsheet_id | String | Google Spreadsheet ID |
| sheet_name | String | シート名（デフォルト: "フォームの回答 1"） |
| field_mappings | Json | 列名 ↔ フィールドキーのマッピング配列 |
| webhook_secret | String | Webhook 認証用シークレット |
| created_at | DateTime | 作成日時 |
| updated_at | DateTime | 更新日時 |

#### `raw_responses` — 生回答データ

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | PK |
| form_config_id | String | FK → form_configs.id |
| response_data | Json | Spreadsheet の1行をそのまま JSON 保存 |
| submitted_at | DateTime | フォーム回答日時（タイムスタンプ列の値） |
| respondent_id | String (UNIQUE) | 重複防止用ハッシュ（タイムスタンプ + メール） |
| created_at | DateTime | 取り込み日時 |

#### `profiles` — プロフィール帳（加工済み）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | PK |
| raw_response_id | String (UNIQUE) | FK → raw_responses.id |
| display_name | String | 表示名（= ラジオネーム） |
| subtitle | String? | サブタイトル（= 表の顔） |
| avatar_color | String | 名前から自動生成したパステルカラー |
| created_at | DateTime | 作成日時 |
| updated_at | DateTime | 更新日時 |

#### `profile_fields` — プロフィール各項目

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | PK |
| profile_id | String | FK → profiles.id（CASCADE DELETE） |
| field_key | String | フィールドキー（例: `radio_name`） |
| label | String | 表示ラベル（例: "ラジオネーム"） |
| emoji | String | 表示用絵文字（例: "📻"） |
| value | String | 回答内容 |
| display_order | Int | 表示順 |
| is_required | Boolean | 必須項目か |
| created_at | DateTime | 作成日時 |

#### `import_logs` — 取り込み履歴

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | PK |
| form_config_id | String | FK → form_configs.id |
| imported_at | DateTime | 実行日時 |
| record_count | Int | 取り込み件数 |
| skipped_count | Int | スキップ件数（重複等） |
| status | String | "success" / "partial" / "failed" |
| trigger | String | "webhook" / "manual" |
| error_message | String? | エラー時のメッセージ |

#### `users` — ユーザー（認証用）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | PK |
| email | String (UNIQUE) | メールアドレス |
| name | String? | 表示名 |
| image | String? | Google アバター URL |
| role | String | "admin" / "viewer"（デフォルト: "viewer"） |
| created_at | DateTime | 作成日時 |

### 6.3 設計ポイント

- **生データ保持**: `raw_responses.response_data` に元データを JSON で丸ごと保存。マッピング変更時に再変換可能
- **EAV パターン**: `profile_fields` で項目を行持ちにすることで、任意項目の欠損に自然に対応
- **重複防止**: `respondent_id`（タイムスタンプ + メールのハッシュ）で同一回答の二重取り込みを防止
- **CASCADE DELETE**: プロフィール削除時に `profile_fields` も連動削除

---

## 7. API 設計

### 7.1 認証が必要な API

すべての API は NextAuth.js セッション認証を要求する。管理系 API は追加で `role: admin` を検証する。

### 7.2 プロフィール閲覧系

#### `GET /api/profiles`

プロフィール一覧を取得する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（viewer 以上） |
| クエリパラメータ | `page` (default: 1), `limit` (default: 20), `search` (名前検索), `sort` ("newest" / "oldest" / "name") |
| レスポンス | `{ profiles: Profile[], total: number, page: number, totalPages: number }` |

#### `GET /api/profiles/[id]`

プロフィール詳細を取得する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（viewer 以上） |
| パスパラメータ | `id` — プロフィール ID |
| レスポンス | `{ profile: Profile & { fields: ProfileField[] } }` |

### 7.3 管理系

#### `POST /api/admin/import`

手動で Google Sheets から取り込みを実行する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（admin のみ） |
| リクエストボディ | `{ formConfigId: string }` |
| レスポンス | `{ imported: number, skipped: number, errors: string[] }` |

#### `GET /api/admin/import/logs`

取り込み履歴一覧を取得する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（admin のみ） |
| クエリパラメータ | `page`, `limit` |
| レスポンス | `{ logs: ImportLog[], total: number }` |

#### `GET /api/admin/form-configs`

フォーム設定一覧を取得する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（admin のみ） |
| レスポンス | `{ configs: FormConfig[] }` |

#### `POST /api/admin/form-configs`

フォーム設定を新規作成する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（admin のみ） |
| リクエストボディ | `{ spreadsheetId: string, sheetName?: string, fieldMappings: FieldMapping[] }` |
| レスポンス | `{ config: FormConfig }` |

#### `PUT /api/admin/form-configs/[id]`

フォーム設定を更新する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（admin のみ） |
| リクエストボディ | `{ fieldMappings?: FieldMapping[], sheetName?: string }` |
| レスポンス | `{ config: FormConfig }` |

#### `DELETE /api/admin/profiles/[id]`

プロフィールを削除する。

| 項目 | 内容 |
|------|------|
| 認証 | 必須（admin のみ） |
| パスパラメータ | `id` — プロフィール ID |
| レスポンス | `{ success: boolean }` |

### 7.4 Webhook

#### `POST /api/webhook/form-submit`

Google Apps Script から呼び出される Webhook エンドポイント。

| 項目 | 内容 |
|------|------|
| 認証 | Webhook シークレットをヘッダーで検証（`X-Webhook-Secret`） |
| リクエストボディ | `{ spreadsheetId: string }` （またはペイロードなし — 設定済みの全 FormConfig を対象） |
| レスポンス | `{ imported: number }` |
| 備考 | Google Apps Script 側から `UrlFetchApp.fetch()` で呼び出す |

---

## 8. 画面設計

### 8.1 画面一覧

| # | 画面名 | パス | 認証 |
|---|--------|------|------|
| 1 | ログイン | `/login` | 不要 |
| 2 | トップ | `/` | 必須 |
| 3 | プロフィール一覧 | `/profiles` | 必須 |
| 4 | プロフィール詳細 | `/profiles/[id]` | 必須 |
| 5 | 管理ダッシュボード | `/admin` | admin |
| 6 | 取り込み管理 | `/admin/import` | admin |
| 7 | フォーム設定 | `/admin/config` | admin |

### 8.2 画面遷移図

```
[ログイン] → [トップ] → [一覧] → [詳細]
                │                    ↑ ↓ (前後ナビゲーション)
                └→ [管理] → [取り込み管理]
                        └→ [フォーム設定]
```

### 8.3 各画面の詳細

#### ログイン画面 (`/login`)

- **目的**: Google OAuth 認証
- **UI要素**: アプリロゴ、「Google でログイン」ボタン、キャッチコピー
- **操作**: ボタンクリック → Google 認証画面 → 認証後トップへリダイレクト
- **備考**: `@e3sys.co.jp` 以外のドメインでログインを試みた場合、「このアプリは社内メンバー専用です」等のエラーメッセージを表示し、セッションを発行しない

#### トップ画面 (`/`)

- **目的**: アプリの入り口、最近のプロフィールへの導線
- **UI要素**:
  - ヒーローセクション（タイトル + コンセプト文）
  - 「みんなのプロフィールを見る」ボタン
  - 最近追加されたプロフィール 3件のプレビューカード
  - 総回答者数の表示
- **操作**: CTAボタン → 一覧画面へ

#### プロフィール一覧画面 (`/profiles`)

- **目的**: 全プロフィールをカード形式で一覧表示
- **UI要素**:
  - 検索バー（ラジオネームで検索）
  - ソート切替（新着順 / 名前順）
  - プロフィールカードのグリッド表示
    - カード内容: アバター色、ラジオネーム、「表の顔」（サブタイトル）
  - ページネーション
- **操作**: カードクリック → 詳細画面へ

#### プロフィール詳細画面 (`/profiles/[id]`)

- **目的**: 1人のプロフィール帳を楽しいUIで表示
- **UI要素**:
  - プロフィール帳風の台紙デザイン
  - ヘッダー: ラジオネーム + アバター色
  - 各質問項目が「隠された状態」で並ぶ（絵文字 + ラベルは見える）
  - 段階的開示UI（カードめくり等）
  - 「すべて開く」「すべて閉じる」ボタン
  - 前後プロフィールへのナビゲーションリンク
  - 一覧に戻るリンク
- **操作**: 各項目をクリック → 回答が開示される

#### 管理ダッシュボード (`/admin`)

- **目的**: 管理機能への導線、ステータス概要
- **UI要素**:
  - 統計サマリー（総プロフィール数、最終取り込み日時）
  - メニュー: 取り込み管理 / フォーム設定
  - 最近の取り込みログ 5件

#### 取り込み管理画面 (`/admin/import`)

- **目的**: 手動取り込み実行、履歴確認
- **UI要素**:
  - 「取り込み実行」ボタン（対象 FormConfig を選択）
  - 取り込み結果の即時表示（○件追加、○件スキップ）
  - 取り込み履歴テーブル（日時、件数、ステータス、トリガー種別）

#### フォーム設定画面 (`/admin/config`)

- **目的**: Spreadsheet ID やフィールドマッピングの設定
- **UI要素**:
  - Spreadsheet ID 入力
  - シート名入力
  - フィールドマッピング編集テーブル（列名 → キー → ラベル → 絵文字 → 表示順 → 必須/任意）
  - Webhook シークレットの表示 / 再生成
  - 「プレビュー」ボタン（Spreadsheet の最初の数行を表示して確認）

---

## 9. Google Apps Script（自動取り込み設定）

### 概要

Google Form に回答が送信されたとき、Google Apps Script のトリガーが発火し、
Next.js の Webhook エンドポイントを呼び出す。

### Apps Script コード

```javascript
// Google Spreadsheet のスクリプトエディタに設置

const WEBHOOK_URL = "https://xxx.vercel.app/api/webhook/form-submit";
const WEBHOOK_SECRET = "（管理画面で生成したシークレット）";

function onFormSubmit(e) {
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Webhook-Secret": WEBHOOK_SECRET
    },
    payload: JSON.stringify({
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
    })
  };

  try {
    UrlFetchApp.fetch(WEBHOOK_URL, options);
  } catch (error) {
    console.error("Webhook call failed:", error);
  }
}

// トリガー設定（初回のみ手動実行）
function setupTrigger() {
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
}
```

### セットアップ手順

1. Google Spreadsheet を開く → 拡張機能 → Apps Script
2. 上記コードを貼り付け
3. `WEBHOOK_URL` と `WEBHOOK_SECRET` を設定
4. `setupTrigger` を1回実行（トリガー登録）
5. フォーム送信時に自動的に Webhook が呼ばれるようになる

---

## 10. 実装ステップ

### Phase 1: プロジェクト基盤（Day 1）

- [ ] Next.js 15 プロジェクト作成（TypeScript, Tailwind CSS, App Router）
- [ ] Prisma セットアップ + SQLite
- [ ] schema.prisma 作成 + 初回マイグレーション
- [ ] 基本レイアウトコンポーネント（Header, Footer）
- [ ] 環境変数テンプレート（`.env.example`）

### Phase 2: 認証（Day 2）

- [ ] NextAuth.js 導入（Google OAuth Provider）
- [ ] `@e3sys.co.jp` ドメイン制限の実装
- [ ] users テーブルとの連携
- [ ] admin ロールの判定ミドルウェア
- [ ] ログイン画面

### Phase 3: Google Sheets 連携 + 取り込み（Day 3-4）

- [ ] Google Cloud Console セットアップ（Sheets API 有効化、サービスアカウント作成）
- [ ] Google Sheets 読み取りサービス（`lib/google-sheets.ts`）
- [ ] 生データ → プロフィール変換ロジック（`lib/profile-transformer.ts`）
- [ ] 手動取り込み API（`POST /api/admin/import`）
- [ ] Webhook API（`POST /api/webhook/form-submit`）
- [ ] Google Apps Script の設置

### Phase 4: 閲覧機能（Day 5-7）

- [ ] 一覧 API（`GET /api/profiles`）
- [ ] 詳細 API（`GET /api/profiles/[id]`）
- [ ] トップ画面
- [ ] 一覧画面（カードグリッド + 検索 + ソート + ページネーション）
- [ ] 詳細画面（プロフィール帳レイアウト + 段階的開示UI）
- [ ] `/frontend-design` スキルでデザイン作成

### Phase 5: 管理画面（Day 8-9）

- [ ] 管理ダッシュボード
- [ ] 取り込み管理画面（実行 + 履歴）
- [ ] フォーム設定画面（マッピング編集）
- [ ] プロフィール削除機能

### Phase 6: 仕上げ + デプロイ（Day 10）

- [ ] エラーハンドリング、ローディング UI
- [ ] Vercel デプロイ
- [ ] 環境変数設定（Google 認証情報、DB URL 等）
- [ ] PostgreSQL（Neon）移行
- [ ] 動作確認

---

## 11. ディレクトリ構成

```
profileBook/
├── docs/
│   └── design.md               # 本設計書
├── prisma/
│   ├── schema.prisma            # DB スキーマ
│   ├── seed.ts                  # 初期データ投入（管理者登録等）
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # ルートレイアウト（認証プロバイダー）
│   │   ├── page.tsx             # トップ画面
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx         # ログイン画面
│   │   ├── profiles/
│   │   │   ├── page.tsx         # 一覧画面
│   │   │   └── [id]/
│   │   │       └── page.tsx     # 詳細画面
│   │   ├── admin/
│   │   │   ├── page.tsx         # 管理ダッシュボード
│   │   │   ├── import/
│   │   │   │   └── page.tsx     # 取り込み管理
│   │   │   └── config/
│   │   │       └── page.tsx     # フォーム設定
│   │   └── api/
│   │       ├── profiles/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── admin/
│   │       │   ├── import/
│   │       │   │   ├── route.ts
│   │       │   │   └── logs/
│   │       │   │       └── route.ts
│   │       │   ├── form-configs/
│   │       │   │   ├── route.ts
│   │       │   │   └── [id]/
│   │       │   │       └── route.ts
│   │       │   └── profiles/
│   │       │       └── [id]/
│   │       │           └── route.ts
│   │       ├── webhook/
│   │       │   └── form-submit/
│   │       │       └── route.ts
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/                  # 汎用 UI
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── Pagination.tsx
│   │   ├── profile/             # プロフィール帳関連
│   │   │   ├── ProfileCard.tsx  # 一覧用カード
│   │   │   ├── ProfileDetail.tsx
│   │   │   ├── FlipCard.tsx     # カードめくり
│   │   │   └── RevealField.tsx  # 開示UI統合コンポーネント
│   │   ├── admin/               # 管理画面関連
│   │   │   ├── ImportButton.tsx
│   │   │   ├── ImportHistory.tsx
│   │   │   └── FieldMappingEditor.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── AuthGuard.tsx
│   ├── lib/
│   │   ├── prisma.ts            # Prisma クライアント（シングルトン）
│   │   ├── auth.ts              # NextAuth.js 設定
│   │   ├── google-sheets.ts     # Sheets API ラッパー
│   │   └── profile-transformer.ts # 変換ロジック
│   └── types/
│       └── index.ts             # 共有型定義
├── public/
│   └── images/
├── .env.local                   # 環境変数（Git 管理外）
├── .env.example                 # 環境変数テンプレート
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 12. 環境変数一覧

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="（ランダム文字列）"

# Google OAuth (ログイン用)
GOOGLE_CLIENT_ID="（Google Cloud Console で取得）"
GOOGLE_CLIENT_SECRET="（Google Cloud Console で取得）"

# Google Sheets API (データ取得用)
GOOGLE_SERVICE_ACCOUNT_KEY='（サービスアカウントの JSON キー）'

# Webhook
WEBHOOK_SECRET="（ランダム文字列）"

# 許可ドメイン
ALLOWED_EMAIL_DOMAIN="e3sys.co.jp"
```

---

## 13. 初期データ（Seed）

初期管理者を1名登録する。

```typescript
// prisma/seed.ts
const admins = [
  { email: "sakuma@e3sys.co.jp", name: "sakuma", role: "admin" },
];
```

管理者の追加が必要な場合は、管理画面から既存ユーザーの `role` を `"admin"` に変更するか、DB を直接操作する。

---

## 14. フィールドマッピング初期値

```json
[
  { "columnHeader": "📻 ラジオネーム（本名禁止）", "fieldKey": "radio_name", "label": "ラジオネーム", "emoji": "📻", "displayOrder": 1, "isRequired": true, "isDisplayName": true },
  { "columnHeader": "🎭 自分を一言で言うと「表の顔」は？", "fieldKey": "public_face", "label": "表の顔", "emoji": "🎭", "displayOrder": 2, "isRequired": true, "isSubtitle": true },
  { "columnHeader": "👀 今だから言える入社直後の第一印象", "fieldKey": "first_impression", "label": "入社直後の第一印象", "emoji": "👀", "displayOrder": 3, "isRequired": true },
  { "columnHeader": "💰 宝くじ当たったら明日会社来る？", "fieldKey": "lottery", "label": "宝くじ当たったら？", "emoji": "💰", "displayOrder": 4, "isRequired": true },
  { "columnHeader": "🔥 密かに抱いている野望", "fieldKey": "ambition", "label": "密かな野望", "emoji": "🔥", "displayOrder": 5, "isRequired": true },
  { "columnHeader": "😭 人生で一番泣いた日はいつ？（オプション）", "fieldKey": "cry_day", "label": "一番泣いた日", "emoji": "😭", "displayOrder": 6, "isRequired": false },
  { "columnHeader": "🧠 消したい記憶ある？", "fieldKey": "erase_memory", "label": "消したい記憶", "emoji": "🧠", "displayOrder": 7, "isRequired": false },
  { "columnHeader": "😔 ずっと引きずってる失敗は？", "fieldKey": "lingering_failure", "label": "引きずってる失敗", "emoji": "😔", "displayOrder": 8, "isRequired": false },
  { "columnHeader": "🙅‍♀️ 実はちょっと苦手な社内ルール", "fieldKey": "disliked_rule", "label": "苦手な社内ルール", "emoji": "🙅‍♀️", "displayOrder": 9, "isRequired": false },
  { "columnHeader": "🤫 仕事中に一番サボってる瞬間は？", "fieldKey": "slacking_moment", "label": "サボってる瞬間", "emoji": "🤫", "displayOrder": 10, "isRequired": false },
  { "columnHeader": "🕵️‍♂️ もし一日だけ別部署に潜入するなら？（潜入したい部署名）", "fieldKey": "infiltrate_dept", "label": "潜入したい部署", "emoji": "🕵️‍♂️", "displayOrder": 11, "isRequired": false },
  { "columnHeader": "✨ 社内でこっそり憧れてる人", "fieldKey": "admired_person", "label": "憧れてる人", "emoji": "✨", "displayOrder": 12, "isRequired": false },
  { "columnHeader": "🚀 テンションが上がるスイッチは？（食べ物・音楽・状況など、複数回答可）", "fieldKey": "excitement_switch", "label": "テンション上がるスイッチ", "emoji": "🚀", "displayOrder": 13, "isRequired": false },
  { "columnHeader": "🔄 あの時ああしてればって思う出来事ある？", "fieldKey": "regret", "label": "あの時ああしてれば", "emoji": "🔄", "displayOrder": 14, "isRequired": false },
  { "columnHeader": "🔒 絶対にバレたくない過去の失敗", "fieldKey": "secret_failure", "label": "バレたくない過去", "emoji": "🔒", "displayOrder": 15, "isRequired": false }
]
```

---

## 付録: 将来拡張メモ

MVP には含めないが、将来検討する機能:

- **PDF / 画像エクスポート**: html2canvas + jsPDF でプロフィール帳を画像/PDF化
- **テーマ切り替え**: CSS変数でカラーパレットを切り替え
- **複数フォーム対応**: `form_configs` テーブルの設計上、既に対応可能
- **回答者本人の編集**: 認証メールアドレスと回答メールアドレスの照合で本人判定
- **リアクション機能**: 他のメンバーがプロフィールに「いいね」等を付けられる
