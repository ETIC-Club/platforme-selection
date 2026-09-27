import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

function getPrismaClient(): PrismaClient | null {
  if (globalForPrisma.prisma !== undefined) {
    return globalForPrisma.prisma;
  }
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("DATABASE_URL is not defined in environment variables.");
      return null;
    }
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    return null;
  }
}

export const prisma = getPrismaClient();

