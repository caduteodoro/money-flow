import { PrismaClient } from "@prisma/client";
import { logPrismaEngineEvent } from "@/lib/security/safe-error-logger";

const prismaLogConfiguration = [
  { emit: "event" as const, level: "error" as const },
  { emit: "event" as const, level: "warn" as const },
];

function createPrismaClient() {
  const client = new PrismaClient({ log: prismaLogConfiguration });

  client.$on("error", logPrismaEngineEvent);

  if (process.env.NODE_ENV === "development") {
    client.$on("warn", logPrismaEngineEvent);
  }

  return client;
}

type MoneyFlowPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: MoneyFlowPrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
