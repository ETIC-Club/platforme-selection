import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma !== undefined && globalForPrisma.prisma !== null) {
    return globalForPrisma.prisma;
  }
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("DATABASE_URL is not defined in environment variables.");
    }
    // Prisma will error on its own if connection string is missing/invalid when using pg adapter, or it might just use env variable directly if we don't pass adapter. But they're using PrismaPg.
    // Let's just create it.
    let client: PrismaClient
    if (connectionString) {
      const adapter = new PrismaPg({ connectionString });
      client = new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"] });
    } else {
      client = new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"] });
    }
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    // Return a dummy client or throw error
    throw error;
  }
}

export const prisma = getPrismaClient();

