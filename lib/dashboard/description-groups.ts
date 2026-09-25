import type { DashboardDescriptionOffender } from "@/lib/dashboard/dashboard-types";

export const UNIDENTIFIED_DESCRIPTION_LABEL = "Descrição não identificada";

export function parseDescriptionHash(value: string | null | undefined): string | null {
  // Whitespace is not part of a valid persisted hash. Do not silently broaden a query.
  return value?.length === 64 && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
}

export function normalizeAnalyticsText(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function resolveDescriptionGroup(input: {
  descriptionHash: string | null;
  normalizedDescription: string | null;
}): { aggregationKey: string; label: string; target: DashboardDescriptionOffender["target"] } {
  const descriptionHash = parseDescriptionHash(input.descriptionHash);
  const normalizedDescription = input.normalizedDescription?.trim() || null;
  const textKey = normalizedDescription ? normalizeAnalyticsText(normalizedDescription) : "";

  return {
    // Internal aggregation identity only: never use this text-bearing key in URLs or React.
    aggregationKey: descriptionHash ? `hash:${descriptionHash}` : textKey ? `description:${textKey}` : "unidentified",
    label: textKey ? normalizedDescription! : UNIDENTIFIED_DESCRIPTION_LABEL,
    target: descriptionHash || textKey
      ? { kind: "NORMALIZED_DESCRIPTION", descriptionHash, normalizedDescription: textKey ? normalizedDescription : null }
      : { kind: "UNIDENTIFIED_DESCRIPTION" },
  };
}
