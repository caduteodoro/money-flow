import { describe, expect, it } from "vitest";

import {
  normalizeCategoryName,
  normalizeCategoryNameForComparison,
} from "@/lib/categories/category-validation";

describe("category name normalization", () => {
  it("preserves the visible text while trimming and collapsing ECMAScript whitespace", () => {
    expect(normalizeCategoryName("\u00a0Cartão\t  de\r\ncrédito\u3000")).toBe(
      "Cartão de crédito",
    );
  });

  it("uses pt-BR case semantics without removing accents", () => {
    expect(normalizeCategoryNameForComparison("  CARTÃO   DE CRÉDITO ")).toBe(
      normalizeCategoryNameForComparison("cartão de crédito"),
    );
    expect(normalizeCategoryNameForComparison("Avó")).not.toBe(
      normalizeCategoryNameForComparison("Avo"),
    );
  });

  it("keeps representative domain characters and only normalizes comparison semantics", () => {
    expect(normalizeCategoryNameForComparison("Saúde & Bem-estar / Família")).toBe(
      "saúde & bem-estar / família",
    );
  });
});
