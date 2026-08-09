import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

export const SAFE_ERROR_CONTEXTS = {
  prismaEngine: "PRISMA_ENGINE",
} as const;

type SafeErrorContext = (typeof SAFE_ERROR_CONTEXTS)[keyof typeof SAFE_ERROR_CONTEXTS];

export type SafeErrorLog = {
  event: "application_error";
  correlationId: string;
  context: SafeErrorContext;
  classification: "PRISMA_KNOWN_REQUEST_ERROR" | "PRISMA_ENGINE_ERROR" | "UNEXPECTED_ERROR";
  code?: string;
};

type SafeErrorSink = (record: SafeErrorLog) => void;

export function buildSafeErrorLog(
  error: unknown,
  context: SafeErrorContext,
  correlationId: string = randomUUID(),
): SafeErrorLog {
  if (error instanceof Prisma.PrismaClientKnownRequestError && /^P\d{4}$/.test(error.code)) {
    return {
      event: "application_error",
      correlationId,
      context,
      classification: "PRISMA_KNOWN_REQUEST_ERROR",
      code: error.code,
    };
  }

  return {
    event: "application_error",
    correlationId,
    context,
    classification: context === SAFE_ERROR_CONTEXTS.prismaEngine
      ? "PRISMA_ENGINE_ERROR"
      : "UNEXPECTED_ERROR",
  };
}

export function logSafeError(
  error: unknown,
  context: SafeErrorContext,
  sink: SafeErrorSink = (record) => console.error(record),
) {
  const record = buildSafeErrorLog(error, context);
  sink(record);
  return record;
}

export function logPrismaEngineEvent(_event: unknown, sink?: SafeErrorSink) {
  return logSafeError(undefined, SAFE_ERROR_CONTEXTS.prismaEngine, sink);
}
