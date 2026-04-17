import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const FIELD_MAPPINGS = [
  { columnHeader: "📻 ラジオネーム（本名禁止）", fieldKey: "radio_name", label: "ラジオネーム", emoji: "📻", displayOrder: 1, isRequired: true, isDisplayName: true },
  { columnHeader: "🎭 自分を一言で言うと「表の顔」は？", fieldKey: "public_face", label: "表の顔", emoji: "🎭", displayOrder: 2, isRequired: true, isSubtitle: true },
  { columnHeader: "👀 今だから言える入社直後の第一印象", fieldKey: "first_impression", label: "入社直後の第一印象", emoji: "👀", displayOrder: 3, isRequired: true },
  { columnHeader: "💰 宝くじ当たったら明日会社来る？", fieldKey: "lottery", label: "宝くじ当たったら？", emoji: "💰", displayOrder: 4, isRequired: true },
  { columnHeader: "🔥 密かに抱いている野望", fieldKey: "ambition", label: "密かな野望", emoji: "🔥", displayOrder: 5, isRequired: true },
  { columnHeader: "😭 人生で一番泣いた日はいつ？（オプション）", fieldKey: "cry_day", label: "一番泣いた日", emoji: "😭", displayOrder: 6, isRequired: false },
  { columnHeader: "🧠 消したい記憶ある？", fieldKey: "erase_memory", label: "消したい記憶", emoji: "🧠", displayOrder: 7, isRequired: false },
  { columnHeader: "😔 ずっと引きずってる失敗は？", fieldKey: "lingering_failure", label: "引きずってる失敗", emoji: "😔", displayOrder: 8, isRequired: false },
  { columnHeader: "🙅‍♀️ 実はちょっと苦手な社内ルール", fieldKey: "disliked_rule", label: "苦手な社内ルール", emoji: "🙅‍♀️", displayOrder: 9, isRequired: false },
  { columnHeader: "🤫 仕事中に一番サボってる瞬間は？", fieldKey: "slacking_moment", label: "サボってる瞬間", emoji: "🤫", displayOrder: 10, isRequired: false },
  { columnHeader: "🕵️‍♂️ もし一日だけ別部署に潜入するなら？（潜入したい部署名）", fieldKey: "infiltrate_dept", label: "潜入したい部署", emoji: "🕵️‍♂️", displayOrder: 11, isRequired: false },
  { columnHeader: "✨ 社内でこっそり憧れてる人", fieldKey: "admired_person", label: "憧れてる人", emoji: "✨", displayOrder: 12, isRequired: false },
  { columnHeader: "🚀 テンションが上がるスイッチは？（食べ物・音楽・状況など、複数回答可）", fieldKey: "excitement_switch", label: "テンション上がるスイッチ", emoji: "🚀", displayOrder: 13, isRequired: false },
  { columnHeader: "🔄 あの時ああしてればって思う出来事ある？", fieldKey: "regret", label: "あの時ああしてれば", emoji: "🔄", displayOrder: 14, isRequired: false },
  { columnHeader: "🔒 絶対にバレたくない過去の失敗", fieldKey: "secret_failure", label: "バレたくない過去", emoji: "🔒", displayOrder: 15, isRequired: false },
];

async function main() {
  console.log("🌱 Seeding started...");

  await prisma.user.upsert({
    where: { email: "sakuma@e3sys.co.jp" },
    update: { role: "admin" },
    create: {
      email: "sakuma@e3sys.co.jp",
      name: "sakuma",
      role: "admin",
    },
  });
  console.log("✅ Admin user: sakuma@e3sys.co.jp");

  const existingConfig = await prisma.formConfig.findFirst();
  if (!existingConfig) {
    await prisma.formConfig.create({
      data: {
        spreadsheetId: "PLACEHOLDER_SPREADSHEET_ID",
        sheetName: "フォームの回答 1",
        fieldMappings: FIELD_MAPPINGS,
        webhookSecret: crypto.randomBytes(32).toString("hex"),
      },
    });
    console.log("✅ Default FormConfig created (update spreadsheetId via admin UI)");
  } else {
    console.log("ℹ️  FormConfig already exists, skipping");
  }

  console.log("🌱 Seeding complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
