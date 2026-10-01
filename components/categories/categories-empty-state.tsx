import { FolderPlus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function CategoriesEmptyState() {
  return (
    <Card className="border-dashed text-center">
      <CardContent className="p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <FolderPlus aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Você ainda não criou categorias.</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Comece pelo formulário acima com uma categoria principal, como Alimentação, Transporte ou Moradia.
        </p>
      </CardContent>
    </Card>
  );
}
