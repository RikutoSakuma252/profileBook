import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ProfileDto, ProfilesResponse } from "@/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

type SortKey = "newest" | "oldest" | "name";

function parseInt(value: string | null, fallback: number, max?: number) {
  const n = value ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < 1) return fallback;
  return max ? Math.min(Math.floor(n), max) : Math.floor(n);
}

function orderBy(sort: SortKey) {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "name") return { displayName: "asc" as const };
  return { createdAt: "desc" as const };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page"), 1);
  const limit = parseInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  const search = searchParams.get("search")?.trim() ?? "";
  const sortRaw = searchParams.get("sort") ?? "newest";
  const sort: SortKey = sortRaw === "oldest" || sortRaw === "name" ? sortRaw : "newest";

  const where = search
    ? {
        OR: [
          { displayName: { contains: search } },
          { subtitle: { contains: search } },
        ],
      }
    : undefined;

  const [total, rows] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      orderBy: orderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const profiles: ProfileDto[] = rows.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    subtitle: p.subtitle,
    avatarColor: p.avatarColor,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const body: ProfilesResponse = { profiles, total, page, totalPages };
  return NextResponse.json(body);
}
