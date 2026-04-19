import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ProfileDto } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const dto: ProfileDto = {
    id: profile.id,
    displayName: profile.displayName,
    subtitle: profile.subtitle,
    avatarColor: profile.avatarColor,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    fields: profile.fields.map((f) => ({
      id: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      emoji: f.emoji,
      value: f.value,
      displayOrder: f.displayOrder,
      isRequired: f.isRequired,
    })),
  };

  return NextResponse.json({ profile: dto });
}
