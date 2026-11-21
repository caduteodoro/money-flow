const PLACEHOLDER_PATTERN = /(change-me|replace-with|<[^>]+>|your[-_])/i;
const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const TLS_MODES = new Set(["require", "verify-ca", "verify-full"]);

function fail(message) {
  process.stderr.write(`Ambiente de deploy invalido: ${message}\n`);
  process.exit(1);
}

function readRequired(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    fail(`${name} ausente.`);
  }

  if (PLACEHOLDER_PATTERN.test(value)) {
    fail(`${name} ainda usa valor de exemplo.`);
  }

  return value;
}

function readPostgresUrl(name) {
  const rawValue = readRequired(name);
  let parsed;

  try {
    parsed = new URL(rawValue);
  } catch {
    fail(`${name} nao e uma URL valida.`);
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    fail(`${name} deve usar postgres:// ou postgresql://.`);
  }

  if (!parsed.username || !parsed.password || !parsed.hostname || parsed.pathname === "/") {
    fail(`${name} deve informar usuario, senha, host e banco.`);
  }

  if (!parsed.hostname.endsWith(".neon.tech")) {
    fail(`${name} deve apontar para o Neon.`);
  }

  if (!TLS_MODES.has(parsed.searchParams.get("sslmode") ?? "")) {
    fail(`${name} deve exigir TLS com sslmode.`);
  }

  return parsed;
}

const databaseUrl = readPostgresUrl("DATABASE_URL");
const directUrl = readPostgresUrl("DIRECT_URL");
const rateLimitSecret = readRequired("RATE_LIMIT_HMAC_SECRET");

if (!databaseUrl.hostname.includes("-pooler.")) {
  fail("DATABASE_URL deve usar o endpoint pooled do Neon.");
}

if (directUrl.hostname.includes("-pooler.")) {
  fail("DIRECT_URL deve usar o endpoint direto do Neon.");
}

if (databaseUrl.hostname.replace("-pooler.", ".") !== directUrl.hostname) {
  fail("DATABASE_URL e DIRECT_URL devem apontar para o mesmo endpoint Neon.");
}

if (databaseUrl.username !== directUrl.username || databaseUrl.pathname !== directUrl.pathname) {
  fail("DATABASE_URL e DIRECT_URL devem usar o mesmo usuario e banco.");
}

if (rateLimitSecret.length < 32) {
  fail("RATE_LIMIT_HMAC_SECRET deve ter pelo menos 32 caracteres.");
}

process.stdout.write(
  "Ambiente de deploy validado: runtime pooled, migrations diretas, TLS e segredo de rate limiting presentes.\n",
);
