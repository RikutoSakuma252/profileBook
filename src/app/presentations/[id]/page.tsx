import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PresentationViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  if (!session?.user) redirect("/login");

  const presentation = await prisma.radioPresentation.findUnique({
    where: { id },
    include: { profile: { select: { id: true, displayName: true } } },
  });
  if (!presentation) notFound();

  const isAdmin = session.user.role === "admin";

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* 最小限のトップバー */}
      <div className="flex shrink-0 items-center justify-between border-b border-paper/10 bg-ink px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/profiles/${presentation.profile.id}`}
            className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-paper/40 transition-colors hover:text-neon"
          >
            ← {presentation.profile.displayName}
          </Link>
          <span className="font-typewriter text-[9px] text-paper/20">
            ｜ 収録プレゼン
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link
              href={`/admin/presentations/new?profileId=${presentation.profile.id}`}
              className="font-typewriter text-[10px] uppercase tracking-[0.25em] text-paper/30 transition-colors hover:text-neon"
            >
              再生成
            </Link>
          )}
          <span className="font-typewriter text-[9px] text-paper/20">
            {new Date(presentation.createdAt).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </div>

      {/* 生成HTMLを iframe で表示 */}
      <iframe
        src={`/api/presentations/${id}/html`}
        className="flex-1 w-full border-0"
        title={`${presentation.profile.displayName} 収録プレゼン`}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
