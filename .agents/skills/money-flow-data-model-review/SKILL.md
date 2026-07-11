---
name: money-flow-data-model-review
description: Use ao revisar Prisma, schema, migrations, relacionamentos, índices, categorias, transações, importações, deduplicação e integridade de dados do Money Flow.
---

# Money Flow Data Model Review

## Quando usar

Use ao alterar ou avaliar schema Prisma, migrations, queries, categorias, transações, importações, deduplicação ou dados de analytics.

## Objetivo

Preservar consistência, isolamento, evolução segura e suporte às consultas reais do produto.

## Instruções

- Leia o schema, migrations e serviços afetados antes de recomendar mudanças.
- Confirme propriedade por `userId` em entidades, relações e queries.
- Avalie integridade referencial, unicidade, nulabilidade, cascatas e concorrência.
- Relacione índices às queries e ordenações existentes.
- Verifique deduplicação por usuário e uso de inteiros para valores monetários.
- Explique impacto em dados existentes, migrations e rollback.

## Checklist

- Relações impedem ou mitigam vínculos entre usuários?
- Índices atendem filtros e ordenações reais?
- Chaves de deduplicação são estáveis e isoladas por usuário?
- Categorias pai/filha e regras preservam integridade?
- Importações mantêm status e contadores coerentes?
- O modelo sustenta CSV, KPIs e evolução futura para OFX?

## Saída esperada

- Estado atual do modelo.
- Riscos e trade-offs com evidências.
- Ajustes recomendados e impactos em queries/migrations.
- Limitações conhecidas que devem permanecer documentadas.

## Limites

- Não altere `schema.prisma` nem crie migration sem autorização explícita.
- Não presuma banco vazio ou descarte dados existentes.
- Não declare integridade resolvida quando ela existir apenas na camada de serviço.
