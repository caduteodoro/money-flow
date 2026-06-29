# 08 - Backlog

## Visão geral

Este documento registra ideias, melhorias, bugs, débitos técnicos e decisões futuras do Money Flow.

O backlog não representa compromisso imediato de implementação. Ele serve para preservar contexto e apoiar priorização das próximas sprints sem misturar ideias futuras com o escopo da sprint atual.

## Status possíveis

- Ideia
- Backlog
- Refinado
- Em andamento
- Bloqueado
- Concluído
- Descartado

## Critérios de classificação

Cada item deve manter, sempre que possível:

- Tipo: Bug, Feature, UX, Tech Debt, Segurança, Documentação ou Pesquisa.
- Prioridade: Alta, Média ou Baixa.
- Sprint sugerida: Sprint atual, Sprint 4, Sprint 5 ou Pós-MVP.
- Esforço estimado: P, M ou G.
- Impacto: Baixo, Médio ou Alto.
- Risco: Baixo, Médio ou Alto.
- Dependências, se houver.
- Status claro e atualizado.

## Itens

| ID | Tipo | Item | Descrição | Prioridade | Sprint sugerida | Esforço | Status |
|----|------|------|-----------|------------|-----------------|---------|--------|
| BCK-001 | Feature | Gastos por categoria | Exibir distribuição de despesas por categoria quando a Sprint 4 entregar categorias e categorização de transações. | Média | Sprint 5 | M | Backlog |
| BCK-002 | Feature | Top estabelecimentos/descrições | Listar descrições ou estabelecimentos mais recorrentes/relevantes, com cuidado para não expor texto sensível em logs ou telas indevidas. | Baixa | Pós-MVP | M | Ideia |
| BCK-003 | Feature | Ranking de maiores saídas | Mostrar maiores despesas do período para ajudar o usuário a identificar impactos financeiros relevantes. | Média | Sprint 5 | M | Backlog |
| BCK-004 | Feature | Saldo acumulado | Calcular e exibir evolução de saldo acumulado ao longo do tempo, deixando claro se o saldo é estimado a partir das transações importadas. | Média | Pós-MVP | M | Ideia |
| BCK-005 | Feature | Calendário financeiro | Criar visualização por calendário para localizar dias de maior concentração de entradas e saídas. | Baixa | Pós-MVP | G | Ideia |
| BCK-006 | Feature | Ofensores do mês | Destacar principais categorias, descrições ou despesas que mais impactaram o mês, sem tom julgador. | Média | Pós-MVP | M | Ideia |
| BCK-007 | UX | Melhorar responsividade/legibilidade da tabela | Ajustar tabela de transações para melhor leitura em telas menores e em desktop com sidebar, preservando densidade e clareza. | Média | Sprint 4 | M | Backlog |
| BCK-008 | UX | Exibir período real calculado | Mostrar de forma explícita o intervalo real considerado pelos filtros e KPIs, reduzindo ambiguidade para usuários com dados importados fora do mês atual. | Alta | Sprint 4 | P | Backlog |
| BCK-009 | Pesquisa | Avaliar regra do filtro "Mês atual" | Decidir se "Mês atual" deve usar o mês do sistema ou o mês mais recente disponível nos dados importados. | Alta | Sprint 4 | P | Backlog |
| BCK-010 | UX | Avaliar rótulo "Todo o período importado" | Avaliar troca de "Período importado" para "Todo o período importado" para melhorar clareza do filtro. | Média | Sprint 4 | P | Backlog |

## Observações

- Itens deste backlog não entram automaticamente no escopo da sprint atual.
- Itens que dependem de categorias devem aguardar a base da Sprint 4.
- Nenhum item deve ser marcado como concluído sem implementação validada.
- Bugs bloqueantes da sprint atual devem ser sinalizados como bloqueantes antes de serem enviados para futuro.
