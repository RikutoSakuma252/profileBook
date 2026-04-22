"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type DeleteActionState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function deleteProfileAction(
  _prev: DeleteActionState,
  payload: { id: string }
): Promise<DeleteActionState> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { status: "error", message: "forbidden" };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: payload.id },
    select: { rawResponseId: true },
  });
  if (!profile) {
    return { status: "error", message: "not_found" };
  }

  try {
    await prisma.rawResponse.delete({ where: { id: profile.rawResponseId } });
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  revalidatePath("/profiles");
  revalidatePath("/");
  redirect("/profiles");
}
