import { FolderPlus } from "lucide-react";

export function CategoriesEmptyState() {
  return (
    <section className="rounded-xl border border-dashed border-teal-200 bg-white p-8 text-center shadow-soft">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-teal-50 text-brand-teal">
        <FolderPlus className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-brand-navy">Voce ainda nao criou categorias.</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Comece pelo formulario acima com uma categoria principal, como Alimentacao, Transporte ou Moradia.
      </p>
    </section>
  );
}
