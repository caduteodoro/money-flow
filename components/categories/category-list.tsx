import { CategoryCard } from "@/components/categories/category-card";
import type { CategoryNode } from "@/lib/categories";

export function CategoryList({ categories }: { categories: CategoryNode[] }) {
  return (
    <section aria-labelledby="category-list-title" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Sua organizacao</p>
        <h2 id="category-list-title" className="mt-1 text-xl font-bold text-brand-navy">Categorias criadas</h2>
      </div>
      {categories.map((category) => (
        <div key={category.id} className="space-y-3">
          <CategoryCard category={category} />
          {category.children.length > 0 ? (
            <div className="ml-4 space-y-3 border-l-2 border-teal-100 pl-4 sm:ml-6 sm:pl-6">
              {category.children.map((child) => <CategoryCard key={child.id} category={child} isChild />)}
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
