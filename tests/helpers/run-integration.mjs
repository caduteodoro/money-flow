import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

import { assertTestDatabaseEnvironment } from "./assert-test-database.mjs";

const DATABASE_URL =
  "postgresql://money_flow_test:synthetic-test-password@127.0.0.1:5434/money_flow_test?schema=public";
const environment = {
  ...process.env,
  NODE_ENV: "test",
  MONEY_FLOW_TEST_DATABASE_CONFIRMED: "yes",
  DATABASE_URL,
};
const compose = ["compose", "-p", "money-flow-test", "-f", "docker-compose.test.yml"];
const prismaCli = fileURLToPath(new URL("../../node_modules/prisma/build/index.js", import.meta.url));
const vitestCli = fileURLToPath(new URL("../../node_modules/vitest/vitest.mjs", import.meta.url));

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: environment,
      shell: false,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error(`${command} terminou com codigo ${code}.${stderr ? ` ${stderr.trim()}` : ""}`));
    });
  });
}

async function waitForHealth() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const status = await run(
      "docker",
      ["inspect", "--format", "{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}", "money-flow-postgres-test"],
      { capture: true },
    );

    if (status === "healthy") {
      process.stdout.write("PostgreSQL de teste saudavel.\n");
      return;
    }

    if (status === "unhealthy") {
      throw new Error("PostgreSQL de teste reportou healthcheck unhealthy.");
    }

    await delay(1_000);
  }

  throw new Error("Tempo limite aguardando o healthcheck do PostgreSQL de teste.");
}

async function databaseUp() {
  await run("docker", [...compose, "up", "-d", "postgres-test"]);
  await waitForHealth();
}

async function databaseDown() {
  await run("docker", [...compose, "down", "--remove-orphans"]);
}

async function migrate() {
  assertTestDatabaseEnvironment(environment);
  await run(process.execPath, [prismaCli, "migrate", "deploy"]);
}

async function integration() {
  let primaryError;

  try {
    await databaseUp();
    await migrate();
    await run(process.execPath, [vitestCli, "run", "tests/integration"]);
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await databaseDown();
    } catch (cleanupError) {
      if (!primaryError) {
        throw cleanupError;
      }
      process.stderr.write("Falha adicional ao remover o PostgreSQL de teste.\n");
    }
  }
}

const action = process.argv[2] ?? "integration";

try {
  const target = assertTestDatabaseEnvironment(environment);
  process.stdout.write(`Ambiente isolado validado em ${target.host}:${target.port}/${target.databaseName}.\n`);

  if (action === "db-up") await databaseUp();
  else if (action === "db-down") await databaseDown();
  else if (action === "migrate") await migrate();
  else if (action === "integration") await integration();
  else throw new Error(`Acao de integracao desconhecida: ${action}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Falha na infraestrutura de integracao.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
