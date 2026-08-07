import { normalizeCategoryNameForComparison } from "@/lib/categories/category-validation";

export function categoryFixture<T extends { name: string }>(data: T) {
  return {
    ...data,
    comparisonKey: normalizeCategoryNameForComparison(data.name),
  };
}

export function categoryNameFields(name: string) {
  return {
    name,
    comparisonKey: normalizeCategoryNameForComparison(name),
  };
}
