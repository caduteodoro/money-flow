import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const validator = resolve(process.cwd(), "scripts/validate-deployment-env.mjs");
const syntheticCredential = "synthetic-credential-not-a-real-secret";
const validEnvironment = {
  DATABASE_URL: `postgresql://money_flow:${syntheticCredential}@ep-money-flow-pooler.us-east-2.aws.neon.tech/money_flow?sslmode=require`,
  DIRECT_URL: `postgresql://money_flow:${syntheticCredential}@ep-money-flow.us-east-2.aws.neon.tech/money_flow?sslmode=require`,
  RATE_LIMIT_HMAC_SECRET: "synthetic-rate-limit-secret-with-32-characters",
};

function runValidator(overrides: Partial<typeof validEnvironment> = {}, omitted: string[] = []) {
  const environment: NodeJS.ProcessEnv = { ...process.env, ...validEnvironment, ...overrides };

  for (const name of omitted) {
    delete environment[name];
  }

  return spawnSync(process.execPath, [validator], {
    encoding: "utf8",
    env: environment,
  });
}

describe("deployment environment validation", () => {
  it("accepts separate pooled and direct Neon URLs without echoing credentials", () => {
    const result = runValidator();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Ambiente de deploy validado");
    expect(`${result.stdout}${result.stderr}`).not.toContain(syntheticCredential);
  });

  it("rejects a missing direct migration URL", () => {
    const result = runValidator({}, ["DIRECT_URL"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("DIRECT_URL ausente");
  });

  it("rejects a runtime URL that bypasses the Neon pooler", () => {
    const result = runValidator({ DATABASE_URL: validEnvironment.DIRECT_URL });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("endpoint pooled");
  });

  it("rejects database URLs without required TLS", () => {
    const result = runValidator({ DIRECT_URL: validEnvironment.DIRECT_URL.replace("?sslmode=require", "") });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("exigir TLS");
  });
});
