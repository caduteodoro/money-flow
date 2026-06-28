import { nubankCsvParser } from "@/lib/parsers/nubank-csv-parser";
import type { StatementParser, StatementParserInput } from "@/lib/parsers/statement-parser";

const statementParsers: StatementParser[] = [nubankCsvParser];

export function getStatementParsers() {
  return statementParsers;
}

export function detectStatementParser(input: StatementParserInput) {
  return statementParsers.find((parser) => parser.canParse(input));
}

export function parseStatement(input: StatementParserInput) {
  const parser = detectStatementParser(input);

  if (!parser) {
    throw new Error("Formato de extrato nao reconhecido.");
  }

  return parser.parse(input);
}
