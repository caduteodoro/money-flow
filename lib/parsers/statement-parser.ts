export type StatementParserFormat = "CSV";

export type StatementTransactionDirection = "INCOME" | "EXPENSE" | "TRANSFER" | "REVERSAL";

export type StatementParserInput = {
  content: string;
  fileName?: string;
  mimeType?: string;
};

export type StatementParseWarning = {
  row?: number;
  message: string;
};

export type NormalizedStatementTransaction = {
  occurredAt: Date;
  postedAt?: Date;
  description: string;
  normalizedDescription: string;
  descriptionHash: string;
  amountCents: number;
  currency: string;
  direction: StatementTransactionDirection;
  externalId?: string;
  sourceRowNumber: number;
};

export type StatementParserResult = {
  parserId: string;
  sourceProvider: string;
  format: StatementParserFormat;
  transactions: NormalizedStatementTransaction[];
  warnings: StatementParseWarning[];
};

export type StatementParser = {
  id: string;
  sourceProvider: string;
  format: StatementParserFormat;
  canParse(input: StatementParserInput): boolean;
  parse(input: StatementParserInput): StatementParserResult;
};
