import { PrismaClient } from "@prisma/client";
import { fallbackData } from "./data-fallback";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let rawPrisma: PrismaClient | null = null;
try {
  rawPrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = rawPrisma;
} catch (e) {
  console.warn("Prisma Client initialization skipped, using fallback data.");
}

// Create a robust Proxy so that if rawPrisma fails, fallbackData handles it gracefully
export const db: PrismaClient = (new Proxy(rawPrisma || {}, {
  get(target, prop: string) {
    const rawModel = (rawPrisma as any)?.[prop];
    const fallbackModel = fallbackData[prop];

    if (!rawModel && !fallbackModel) {
      return (target as any)[prop];
    }

    return new Proxy(rawModel || {}, {
      get(modelTarget, method: string) {
        return async (...args: any[]) => {
          if (rawModel && typeof rawModel[method] === "function") {
            try {
              return await rawModel[method](...args);
            } catch (err: any) {
              if (fallbackModel && typeof fallbackModel[method] === "function") {
                return await fallbackModel[method](...args);
              }
              throw err;
            }
          }
          if (fallbackModel && typeof fallbackModel[method] === "function") {
            return await fallbackModel[method](...args);
          }
          return undefined;
        };
      },
    });
  },
}) as unknown) as PrismaClient;
