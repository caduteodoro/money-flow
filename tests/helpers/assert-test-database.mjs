import { pathToFileURL } from "node:url";

const EXPECTED_CONFIRMATION = "yes";
const EXPECTED_HOSTS = new Set(["127.0.0.1", "localhost"]);
const EXPECTED_PORT = "5434";

export function assertTestDatabaseEnvironment(environment = process.env) {
  if (environment.NODE_ENV !== "test") {
    throw new Error("Ambiente de teste invalido: NODE_ENV deve ser test.");
  }

  if (environment.MONEY_FLOW_TEST_DATABASE_CONFIRMED !== EXPECTED_CONFIRMATION) {
    throw new Error("Ambiente de teste invalido: confirmacao explicita ausente.");
  }

  let databaseUrl;

  try {
    databaseUrl = new URL(environment.DATABASE_URL ?? "");
  } catch {
    throw new Error("Ambiente de teste invalido: DATABASE_URL ausente ou malformada.");
  }

  if (databaseUrl.protocol !== "postgresql:") {
    throw new Error("Ambiente de teste invalido: protocolo PostgreSQL obrigatorio.");
  }

  if (!EXPECTED_HOSTS.has(databaseUrl.hostname)) {
    throw new Error("Ambiente de teste invalido: host nao autorizado.");
  }

  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));

  if (databaseUrl.port === "5432" || databaseName.toLowerCase() === "money_flow") {
    throw new Error("Ambiente de teste invalido: banco de desenvolvimento proibido.");
  }

  if (databaseUrl.port !== EXPECTED_PORT) {
    throw new Error("Ambiente de teste invalido: porta de teste incorreta.");
  }

  if (!databaseName || !databaseName.toLowerCase().includes("_test")) {
    throw new Error("Ambiente de teste invalido: banco deve conter o marcador _test.");
  }

  return {
    databaseName,
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = assertTestDatabaseEnvironment();
    process.stdout.write(`Ambiente de teste validado para ${result.host}:${result.port}/${result.databaseName}.\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ambiente de teste invalido.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
