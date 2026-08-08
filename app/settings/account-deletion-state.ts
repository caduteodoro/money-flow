export type AccountDeletionActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    currentPassword?: string[];
    confirmation?: string[];
  };
};

export const initialAccountDeletionActionState: AccountDeletionActionState = { status: "idle" };
