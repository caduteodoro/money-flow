# money-flow-data-model-review

## Quando usar

Use esta skill ao alterar `prisma/schema.prisma`, migrations, queries, deduplicação, categorias, importações ou dados usados por dashboards.

## Objetivo

Revisar a modelagem de dados para garantir consistência, evolução segura e boa base analítica.

## Checklist de revisão

- Relacionamentos pertencem ao usuário correto?
- Índices atendem queries previstas?
- Deduplicação usa chave estável por usuário?
- Categorias pai/filha estão modeladas corretamente?
- Histórico de importação preserva status, contadores e erros?
- Audit logs registram eventos sem dados sensíveis?
- Modelo suporta CSV no MVP?
- Modelo está preparado para OFX?
- Dados sustentam KPIs, filtros e gráficos?
- Tipos monetários evitam erro de ponto flutuante?

## Saída esperada

- Revisão do schema.
- Riscos e trade-offs.
- Ajustes recomendados.
- Impacto esperado em migrations e queries.
