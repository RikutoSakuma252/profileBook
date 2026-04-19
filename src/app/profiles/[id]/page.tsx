import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileBook } from "./ProfileBook";
import { AdminDeleteButton } from "./AdminDeleteButton";
import type { ProfileFieldDto } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (!profile) notFound();

  const [prev, next] = await Promise.all([
    prisma.profile.findFirst({
      where: { createdAt: { gt: profile.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true },
    }),
    prisma.profile.findFirst({
      where: { createdAt: { lt: profile.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { id: true, displayName: true },
    }),
  ]);

  const fields: ProfileFieldDto[] = profile.fields.map((f) => ({
    id: f.id,
    fieldKey: f.fieldKey,
    label: f.label,
    emoji: f.emoji,
    value: f.value,
    displayOrder: f.displayOrder,
    isRequired: f.isRequired,
  }));

  return (
    <main className="relative mx-auto max-w-4xl px-6 pt-10 pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 font-typewriter text-[11px] uppercase tracking-[0.3em]">
        <Link
          href="/profiles"
          className="text-paper/60 transition-colors hover:text-neon"
        >
          ← Back to directory
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <AdminDeleteButton id={profile.id} displayName={profile.displayName} />
          )}
          <span className="text-paper/30">
            File No. {profile.id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      <ProfileBook
        displayName={profile.displayName}
        subtitle={profile.subtitle}
        avatarColor={profile.avatarColor}
        createdAt={profile.createdAt.toISOString()}
        fields={fields}
      />

      <nav className="mt-12 grid gap-3 border-t border-paper/10 pt-6 font-typewriter text-[11px] uppercase tracking-[0.25em] sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/profiles/${prev.id}`}
            className="group flex items-center gap-2 rounded-sm border border-paper/15 px-4 py-3 transition-colors hover:border-neon"
          >
            <span className="text-paper/40 transition-colors group-hover:text-neon">
              ← newer
            </span>
            <span className="truncate font-dot tracking-[0.15em] text-paper group-hover:text-neon">
              {prev.displayName}
            </span>
          </Link>
        ) : (
          <span className="rounded-sm border border-paper/5 px-4 py-3 text-paper/25">
            ← newer
          </span>
        )}
        {next ? (
          <Link
            href={`/profiles/${next.id}`}
            className="group flex items-center justify-end gap-2 rounded-sm border border-paper/15 px-4 py-3 transition-colors hover:border-neon"
          >
            <span className="truncate font-dot tracking-[0.15em] text-paper group-hover:text-neon">
              {next.displayName}
            </span>
            <span className="text-paper/40 transition-colors group-hover:text-neon">
              older →
            </span>
          </Link>
        ) : (
          <span className="rounded-sm border border-paper/5 px-4 py-3 text-right text-paper/25">
            older →
          </span>
        )}
      </nav>
    </main>
  );
}
