import { CheckCircle2, TriangleAlert } from "lucide-react";

import type { CategoryActionState } from "@/app/categories/category-action-state";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CategoryActionMessage({ state }: { state: CategoryActionState }) {
  if (!state.message) return null;

  const isError = state.status !== "success";
  return (
    <Alert aria-live="polite" variant={isError ? "destructive" : "default"}>
      {isError ? <TriangleAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
