"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai-client";

export type GenerateState =
  | { status: "idle" }
  | { status: "error"; message: string };

function buildPrompt(opts: {
  displayName: string;
  fields: { label: string; emoji: string; value: string; displayOrder: number }[];
  themeColor: string;
  imageKeywords: string;
}): string {
  const { displayName, fields, themeColor, imageKeywords } = opts;
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  const qaList = sorted
    .map((f, i) => `  Q${i + 1}. ${f.emoji} ${f.label}\n  A: ${f.value || "（未回答）"}`)
    .join("\n\n");

  return `あなたは社内ラジオ「ダマテンラジオ」の収録で使う、ゲスト紹介プレゼンテーション用の完全なHTMLを生成するデザイナーです。

## ゲスト情報
ラジオネーム: ${displayName}
Q&A:
${qaList}

## デザイン指示
- テーマカラー: ${themeColor}
- ゲストのイメージ・キーワード: ${imageKeywords}

## 要件
以下の仕様を満たす、完全に自己完結したHTMLページを生成してください。

### レイアウト
- 左側（約65%幅）: 現在の質問・回答を大きく表示するメインエリア
- 右側（約35%幅）: 全回答のリストをサイドバーとして表示（クリックでジャンプ可能）
- 下部: 「← 前へ」「次へ →」のナビゲーションボタン
- 1枚目: ラジオネーム（${displayName}）を大きく表示するタイトルカード
- 2枚目以降: Q1, Q2, Q3... の順番で1問ずつ表示

### インタラクション
- 「次へ」「前へ」ボタンでカードを進める
- サイドバーのアイテムをクリックすると該当カードにジャンプ
- 現在表示中のカードをサイドバーでハイライト
- キーボード矢印キー（← →）でも操作可能

### デザイン哲学（必ず守ること）
- テーマカラー（${themeColor}）をメインに据えたコヒーレントな配色
- ゲストのイメージキーワード（${imageKeywords}）の雰囲気に合わせた独自のビジュアル
- Googleフォントから文脈に合う個性的なフォントを選択（Inter, Roboto, Arial等の汎用フォントは禁止）
- 深夜ラジオのムード: ドラマチックで記憶に残る演出
- カードの切り替えにCSSトランジションアニメーション
- 回答テキストが長い場合はスクロール可能に
- ラジオ・音楽・放送をモチーフにした装飾や質感（グレイン、グロー、波形など）を状況に応じて使う

### 技術要件
- 外部ライブラリ依存なし（Google Fonts のみ @import で読み込み可）
- 全CSSとJavaScriptをHTMLファイルにインライン
- レスポンシブ不要（1920x1080のプレゼン想定）
- HTMLは <!DOCTYPE html> から </html> まで完全な形で出力

HTMLのみを出力してください。説明文は不要です。`;
}

export async function generatePresentationAction(
  _prev: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { status: "error", message: "forbidden" };
  }

  const profileId = formData.get("profileId") as string;
  const themeColor = (formData.get("themeColor") as string) || "#6366f1";
  const imageKeywords = (formData.get("imageKeywords") as string)?.trim();

  if (!profileId) return { status: "error", message: "profileId is required" };
  if (!imageKeywords) return { status: "error", message: "イメージキーワードを入力してください" };

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { fields: { orderBy: { displayOrder: "asc" } } },
  });
  if (!profile) return { status: "error", message: "プロフィールが見つかりません" };

  const prompt = buildPrompt({
    displayName: profile.displayName,
    fields: profile.fields,
    themeColor,
    imageKeywords,
  });

  let generatedHtml: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 16000,
    });
    generatedHtml = completion.choices[0]?.message?.content ?? "";
    if (!generatedHtml) throw new Error("AIからの応答が空です");

    // コードブロックのマークダウン記法を除去
    generatedHtml = generatedHtml
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  const presentation = await prisma.radioPresentation.create({
    data: { profileId, themeColor, imageKeywords, generatedHtml },
  });

  redirect(`/presentations/${presentation.id}`);
}
