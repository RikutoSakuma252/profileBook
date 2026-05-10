import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const presentation = await prisma.radioPresentation.findUnique({
    where: { id },
    select: { generatedHtml: true },
  });

  if (!presentation) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(presentation.generatedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
