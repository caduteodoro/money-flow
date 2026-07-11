---
name: money-flow-dashboard-analytics
description: Use ao criar ou revisar KPIs, filtros, tabelas, gráficos, insights, períodos e cálculos financeiros do dashboard do Money Flow.
---

# Money Flow Dashboard Analytics

## Quando usar

Use em mudanças ou revisões de dashboard, KPIs, filtros, períodos, tabelas, gráficos, insights e cálculos financeiros.

## Objetivo

Entregar analytics corretos, interpretáveis, úteis e isolados por usuário.

## Instruções

- Confirme a definição de cada métrica e o sinal de entradas/saídas.
- Verifique filtros, limites de período, timezone e estados vazios.
- Garanta que tabelas e gráficos usem os mesmos dados e intervalos.
- Diferencie saldo calculado de saldo bancário real.
- Avalie legibilidade, responsividade, contexto e risco de interpretação.
- Mantenha cálculos no domínio server-side e dados preparados para a UI.

## Checklist

- Queries e agregações filtram por `userId`?
- KPIs usam convenções monetárias coerentes?
- O intervalo real considerado está visível?
- Filtros vazios diferem de ausência total de dados?
- Gráficos, tabelas e insights são consistentes entre si?
- Textos informam sem julgar o usuário?

## Saída esperada

- Definições e revisão dos cálculos.
- Riscos de interpretação e inconsistências.
- Recomendações de UX/BI e validações necessárias.

## Limites

- Não crie analytics antes de suas dependências de dados estarem prontas.
- Não altere regras financeiras sem documentar o impacto.
- Não exponha dados de outro usuário ou dados financeiros em logs.
- Não introduza previsão ou IA externa sem escopo explícito.
