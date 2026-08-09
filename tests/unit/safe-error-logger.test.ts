import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  buildSafeErrorLog,
  logPrismaEngineEvent,
  logSafeError,
  SAFE_ERROR_CONTEXTS,
} from "@/lib/security/safe-error-logger";

const sensitiveValues = [
  "synthetic@example.test",
  "synthetic-password",
  "synthetic-password-hash",
  "synthetic-session-token",
  "synthetic financial description",
  "999999.99",
];

function serialized(value: unknown) {
  return JSON.stringify(value);
}

describe("safe error logger", () => {
  it("discards message, meta, stack and arguments from Prisma engine events", () => {
    const sink = vi.fn();
    const event = {
      message: sensitiveValues.join(" "),
      meta: { email: sensitiveValues[0], passwordHash: sensitiveValues[2] },
      stack: `Error: ${sensitiveValues[3]}`,
      arguments: sensitiveValues,
    };

    logPrismaEngineEvent(event, sink);

    expect(sink).toHaveBeenCalledOnce();
    const output = serialized(sink.mock.calls);
    for (const sensitiveValue of sensitiveValues) {
      expect(output).not.toContain(sensitiveValue);
    }
    expect(sink.mock.calls[0][0]).toMatchObject({
      event: "application_error",
      context: "PRISMA_ENGINE",
      classification: "PRISMA_ENGINE_ERROR",
    });
    expect(sink.mock.calls[0][0].correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("preserves only a validated Prisma code from known request errors", () => {
    const error = new Prisma.PrismaClientKnownRequestError(sensitiveValues.join(" "), {
      code: "P2002",
      clientVersion: "synthetic",
      meta: { target: ["email"], leakedValue: sensitiveValues[0] },
    });

    const record = buildSafeErrorLog(error, SAFE_ERROR_CONTEXTS.prismaEngine, "safe-correlation-id");

    expect(record).toEqual({
      event: "application_error",
      correlationId: "safe-correlation-id",
      context: "PRISMA_ENGINE",
      classification: "PRISMA_KNOWN_REQUEST_ERROR",
      code: "P2002",
    });
    const output = serialized(record);
    for (const sensitiveValue of sensitiveValues) {
      expect(output).not.toContain(sensitiveValue);
    }
  });

  it("writes only the safe record to the configured sink", () => {
    const sink = vi.fn();
    const error = Object.assign(new Error(sensitiveValues.join(" ")), {
      meta: sensitiveValues,
      arguments: sensitiveValues,
    });

    logSafeError(error, SAFE_ERROR_CONTEXTS.prismaEngine, sink);

    expect(serialized(sink.mock.calls)).not.toContain(sensitiveValues[0]);
    expect(sink.mock.calls[0][0].classification).toBe("PRISMA_ENGINE_ERROR");
  });
});
