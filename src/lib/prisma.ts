import { PrismaClient } from "@prisma/client";
import { cache } from "react";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const getProfileById = cache((id: string) =>
  prisma.profile.findUnique({
    where: { id },
    include: { fields: { orderBy: { displayOrder: "asc" } } },
  })
);

export const getProfileCount = cache(() => prisma.profile.count());

export const getLatestProfileWithFields = cache(() =>
  prisma.profile.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      fields: {
        orderBy: { displayOrder: "asc" },
        take: 4,
      },
    },
  })
);

export const getRecentProfiles = cache((take: number) =>
  prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
    take,
  })
);
