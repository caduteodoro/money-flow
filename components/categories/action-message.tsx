import type { CategoryActionState } from "@/app/categories/actions";

export function CategoryActionMessage({ state }: { state: CategoryActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={`rounded-md px-3 py-2 text-sm ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      {state.message}
    </p>
  );
}
