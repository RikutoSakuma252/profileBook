import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id },
    select: { rawResponseId: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.rawResponse.delete({ where: { id: profile.rawResponseId } });

  return NextResponse.json({ success: true });
}
