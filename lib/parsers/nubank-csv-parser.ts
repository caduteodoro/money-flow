import {
  directionFromAmount,
  generateDescriptionHash,
  normalizeDescription,
  parseAmountToCents,
  parseBrazilianDate,
} from "@/lib/parsers/normalization";
import type {
  NormalizedStatementTransaction,
  StatementParser,
  StatementParseWarning,
} from "@/lib/parsers/statement-parser";

const REQUIRED_HEADERS = ["data", "valor", "identificador", "descricao"];

type CsvRow = {
  rowNumber: number;
  values: string[];
};

export const nubankCsvParser: StatementParser = {
  id: "nubank-csv-v1",
  sourceProvider: "NUBANK",
  format: "CSV",
  canParse(input) {
    const rows = parseCsvRows(input.content);
    const headers = rows[0]?.values.map(normalizeHeader) ?? [];

    return REQUIRED_HEADERS.every((header) => headers.includes(header));
  },
  parse(input) {
    const rows = parseCsvRows(input.content);
    const headerRow = rows[0];

    if (!headerRow) {
      throw new Error("CSV vazio.");
    }

    const headerIndex = buildHeaderIndex(headerRow.values);
    const warnings: StatementParseWarning[] = [];
    const transactions: NormalizedStatementTransaction[] = [];

    for (const row of rows.slice(1)) {
      if (row.values.every((value) => value.trim() === "")) {
        continue;
      }

      try {
        const description = getRequiredValue(row, headerIndex, "descricao");
        const amountCents = parseAmountToCents(getRequiredValue(row, headerIndex, "valor"));
        const normalizedDescription = normalizeDescription(description);

        transactions.push({
          occurredAt: parseBrazilianDate(getRequiredValue(row, headerIndex, "data")),
          description,
          normalizedDescription,
          descriptionHash: generateDescriptionHash(description),
          amountCents,
          currency: "BRL",
          direction: directionFromAmount(amountCents),
          externalId: getOptionalValue(row, headerIndex, "identificador"),
          sourceRowNumber: row.rowNumber,
        });
      } catch (error) {
        warnings.push({
          row: row.rowNumber,
          message: error instanceof Error ? error.message : "Linha invalida.",
        });
      }
    }

    if (transactions.length === 0) {
      throw new Error("CSV sem transacoes validas.");
    }

    return {
      parserId: nubankCsvParser.id,
      sourceProvider: nubankCsvParser.sourceProvider,
      format: "CSV",
      transactions,
      warnings,
    };
  },
};

function buildHeaderIndex(headers: string[]) {
  const index = new Map<string, number>();

  headers.forEach((header, position) => {
    index.set(normalizeHeader(header), position);
  });

  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!index.has(requiredHeader)) {
      throw new Error("Estrutura do CSV nao reconhecida.");
    }
  }

  return index;
}

function getRequiredValue(row: CsvRow, headerIndex: Map<string, number>, header: string) {
  const value = getOptionalValue(row, headerIndex, header);

  if (!value) {
    throw new Error(`Campo obrigatorio ausente: ${header}.`);
  }

  return value;
}

function getOptionalValue(row: CsvRow, headerIndex: Map<string, number>, header: string) {
  const position = headerIndex.get(header);

  if (position === undefined) {
    return undefined;
  }

  const value = row.values[position]?.trim();

  return value || undefined;
}

function normalizeHeader(header: string) {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseCsvRows(content: string) {
  const rows: CsvRow[] = [];
  let currentValue = "";
  let currentRow: string[] = [];
  let rowNumber = 1;
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);
      rows.push({ rowNumber, values: currentRow });
      currentValue = "";
      currentRow = [];
      rowNumber += 1;
      continue;
    }

    currentValue += char;
  }

  if (inQuotes) {
    throw new Error("CSV com aspas nao fechadas.");
  }

  if (currentValue !== "" || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push({ rowNumber, values: currentRow });
  }

  return rows.filter((row) => row.values.some((value) => value.trim() !== ""));
}
