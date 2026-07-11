import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("isolated integration database", () => {
  it("connects only to the migrated money_flow_test database", async () => {
    const target = assertTestDatabaseEnvironment(process.env);
    expect(target).toMatchObject({ databaseName: "money_flow_test", port: 5434 });

    const [database] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    expect(database?.name).toBe("money_flow_test");

    const [migrationCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
    `;
    expect(Number(migrationCount?.count)).toBeGreaterThan(0);

    const [userTable] = await prisma.$queryRaw<Array<{ name: string | null }>>`
      SELECT to_regclass('public."User"')::text AS name
    `;
    expect(userTable?.name).toBe('"User"');
  });
});
