import { createHash } from "crypto";

import type { StatementTransactionDirection } from "@/lib/parsers/statement-parser";

const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export type DedupeKeyInput = {
  sourceProvider: string;
  occurredAt: Date;
  amountCents: number;
  descriptionHash: string;
  externalId?: string;
};

export function sha256Hex(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateFileHash(fileBuffer: Buffer) {
  return sha256Hex(fileBuffer);
}

export function normalizeDescription(description: string) {
  return description
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function generateDescriptionHash(description: string) {
  return sha256Hex(normalizeDescription(description));
}

export function generateDedupeKey(input: DedupeKeyInput) {
  const occurredDate = input.occurredAt.toISOString().slice(0, 10);
  const externalId = input.externalId?.trim() || "no-external-id";

  return sha256Hex(
    [
      "transaction-dedupe-v1",
      input.sourceProvider,
      externalId,
      occurredDate,
      input.amountCents.toString(),
      input.descriptionHash,
    ].join("|"),
  );
}

export function parseBrazilianDate(value: string) {
  const match = BR_DATE_PATTERN.exec(value.trim());

  if (!match) {
    throw new Error("Data invalida. Use o formato DD/MM/AAAA.");
  }

  const [, day, month, year] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    throw new Error("Data invalida.");
  }

  return parsed;
}

export function parseAmountToCents(value: string) {
  const rawValue = value.trim().replace(/\s/g, "");
  const lastComma = rawValue.lastIndexOf(",");
  const lastDot = rawValue.lastIndexOf(".");
  let normalized = rawValue;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized =
      lastComma > lastDot
        ? rawValue.replace(/\./g, "").replace(",", ".")
        : rawValue.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = rawValue.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = rawValue.replace(/,/g, "");
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error("Valor invalido.");
  }

  return Math.round(amount * 100);
}

export function directionFromAmount(amountCents: number): StatementTransactionDirection {
  if (amountCents > 0) {
    return "INCOME";
  }

  return "EXPENSE";
}
