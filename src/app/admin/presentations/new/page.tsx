import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GenerateForm } from "./GenerateForm";

export const dynamic = "force-dynamic";

export default async function NewPresentationPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const [session, { profileId }] = await Promise.all([auth(), searchParams]);
  if (session?.user?.role !== "admin") redirect("/");
  if (!profileId) redirect("/profiles");

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { fields: { orderBy: { displayOrder: "asc" } } },
  });
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* ヘッダー */}
      <div className="mb-10">
        <p className="mb-1 font-typewriter text-[10px] uppercase tracking-[0.4em] text-neon/60">
          Radio Studio — Generate
        </p>
        <h1 className="font-dot text-2xl tracking-[0.15em] text-paper">
          収録プレゼン生成
        </h1>
        <p className="mt-2 font-typewriter text-[11px] text-paper/40">
          Guest: {profile.displayName}
          {profile.subtitle ? ` — ${profile.subtitle}` : ""}
        </p>
      </div>

      {/* Q&A プレビュー */}
      <section className="mb-8 rounded-sm border border-paper/10 bg-paper/3 p-5">
        <p className="mb-3 font-typewriter text-[9px] uppercase tracking-[0.35em] text-paper/40">
          収録に使用する回答データ
        </p>
        <ol className="space-y-2">
          {profile.fields.map((f, i) => (
            <li key={f.id} className="flex gap-3 font-typewriter text-[11px]">
              <span className="w-5 shrink-0 text-neon/50">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <span className="text-paper/50">{f.emoji} {f.label}</span>
              <span className="ml-auto max-w-[55%] truncate text-right text-paper/70">
                {f.value || "—"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <GenerateForm profileId={profile.id} />
    </main>
  );
}
