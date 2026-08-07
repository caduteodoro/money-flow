import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";

const prisma = new PrismaClient();

// This list represents every migration currently versioned in prisma/migrations.
const expectedMigrations = [
  "20260626061804_init",
  "20260627150101_add_auth_sessions",
  "20260628214608_add_statement_imports_transactions",
  "20260628225732_add_import_summary_counts",
  "20260629000807_add_statement_import_period",
  "20260807120000_add_rate_limit_buckets",
  "20260807150000_add_relational_tenant_keys",
  "20260807151000_enforce_relational_tenant_fks",
  "20260807160000_enforce_category_name_uniqueness",
];

afterAll(async () => {
  await prisma.$disconnect();
});

describe("isolated integration database", () => {
  it("connects only to the migrated money_flow_test database", async () => {
    const target = assertTestDatabaseEnvironment(process.env);
    expect(target).toMatchObject({ databaseName: "money_flow_test", port: 5434 });

    const [database] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    expect(database?.name).toBe("money_flow_test");

    const completedMigrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY migration_name
    `;
    expect(completedMigrations.map(({ migration_name }) => migration_name)).toEqual(expectedMigrations);

    const [userTable] = await prisma.$queryRaw<Array<{ name: string | null }>>`
      SELECT to_regclass('public."User"')::text AS name
    `;
    expect(userTable?.name).toBe('"User"');
  });
});
