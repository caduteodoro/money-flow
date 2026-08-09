import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";

const syntheticEmail = "sec-010-regression@example.test";
const syntheticPasswordHash = "synthetic-password-hash-never-log";

describe("Prisma error logging", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: syntheticEmail } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: syntheticEmail } });
    await prisma.$disconnect();
  });

  it("logs a safe technical event without PII for a real P2002", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: "Synthetic SEC-010 User",
        email: syntheticEmail,
        passwordHash: syntheticPasswordHash,
      },
    });

    await expect(prisma.user.create({
      data: {
        id: randomUUID(),
        name: "Synthetic Duplicate User",
        email: syntheticEmail,
        passwordHash: syntheticPasswordHash,
      },
    })).rejects.toMatchObject({ code: "P2002" });

    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());

    const output = JSON.stringify(errorSpy.mock.calls);
    expect(output).not.toContain(syntheticEmail);
    expect(output).not.toContain(syntheticPasswordHash);
    expect(output).not.toContain("Synthetic Duplicate User");
    expect(errorSpy.mock.calls).toContainEqual([
      expect.objectContaining({
        event: "application_error",
        context: "PRISMA_ENGINE",
        classification: "PRISMA_ENGINE_ERROR",
      }),
    ]);

    errorSpy.mockRestore();
  });
});
