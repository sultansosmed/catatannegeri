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

// Create a universal safe fallback handler for any Prisma model/method
function getSafeFallback(modelName: string, methodName: string) {
  const model = fallbackData[modelName];
  if (model && typeof model[methodName] === "function") {
    return model[methodName];
  }
  return async (...args: any[]) => {
    if (methodName.startsWith("findMany")) return [];
    if (methodName.startsWith("findUnique") || methodName.startsWith("findFirst")) return null;
    if (methodName.startsWith("count")) return 0;
    return null;
  };
}

// Create a robust Proxy so that if rawPrisma fails, safe fallbacks handle it gracefully
export const db: PrismaClient = (new Proxy(rawPrisma || {}, {
  get(target, prop: string) {
    const rawModel = (rawPrisma as any)?.[prop];

    return new Proxy(rawModel || {}, {
      get(modelTarget, method: string) {
        return async (...args: any[]) => {
          if (rawModel && typeof rawModel[method] === "function") {
            try {
              return await rawModel[method](...args);
            } catch (err: any) {
              const fallbackFn = getSafeFallback(prop, method);
              return await fallbackFn(...args);
            }
          }
          const fallbackFn = getSafeFallback(prop, method);
          return await fallbackFn(...args);
        };
      },
    });
  },
}) as unknown) as PrismaClient;
