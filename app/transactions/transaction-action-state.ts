export type TransactionActionState = { status: "idle" | "success" | "error"; message?: string };

export const initialTransactionActionState: TransactionActionState = { status: "idle" };
