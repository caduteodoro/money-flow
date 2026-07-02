# 08 - Backlog

## Visão Geral

Este documento registra ideias, melhorias, bugs, débitos técnicos, pesquisas e decisões futuras do Money Flow.

O backlog não representa compromisso imediato de implementação. Ele preserva contexto, ajuda a priorizar próximas sprints e evita misturar ideias futuras com o escopo da sprint atual sem decisão explícita.

## Base Já Concluída

Os itens abaixo já foram tratados nas Sprints 2 ou 3 e não entram como pendência neste backlog:

- Preview e confirmação sem precisar escolher o arquivo novamente.
- Histórico de importações com mês/período do extrato.
- Upload CSV básico.
- Validação CSV básica.
- Importação no banco.
- Deduplicação por `userId + dedupeKey`.
- Audit log seguro da importação.
- Parser inicial estilo Nubank/sample-data.
- Dashboard real com dados importados.
- KPIs reais.
- Filtros básicos da Sprint 3.
- Gráficos simples.
- Insights básicos.
- Tabela de últimas transações.
- Estado vazio do dashboard.
- Exibição do intervalo real considerado pelo filtro ativo.
- Estado específico para filtros sem transações no período.
- Mensagens controladas para erros esperados de CSV.
- Contadores de importação baseados na quantidade realmente inserida pelo banco.
- Correção responsiva principal dos KPIs em zoom 100%.

## Status Possíveis

- Ideia: item ainda pouco definido.
- Backlog: item aceito como pendência futura, ainda sem execução iniciada.
- Refinado: item detalhado com problema, objetivo, critérios de aceite e limites.
- Em andamento: item em desenvolvimento.
- Bloqueado: item depende de decisão, dependência técnica ou outro item.
- Concluído: item implementado e validado.
- Descartado: item removido por decisão explícita.

## Critérios De Priorização

Use as prioridades abaixo para ordenar o backlog:

- P0: bloqueia a sprint, segurança/privacidade crítica ou risco relevante de dados.
- P1: alto valor para o MVP, reduz confusão importante ou desbloqueia trabalho planejado.
- P2: melhoria útil, mas não bloqueante.
- P3: ideia futura, experimento, refinamento pós-MVP ou baixa urgência.

Priorize itens que:

1. Aumentam valor claro para o usuário.
2. Reduzem risco de segurança ou privacidade.
3. Desbloqueiam outras funcionalidades.
4. Melhoram entendimento financeiro.
5. Reduzem confusão na interface.
6. Evitam retrabalho técnico futuro.

Evite priorizar agora itens que dependem de IA externa, Open Finance, PWA, deploy/produção, categorias ainda não entregues ou qualquer escopo que infle a sprint atual sem decisão explícita.

## Tabela Principal

| ID | Tipo | Item | Descrição | Prioridade | Sprint sugerida | Esforço | Impacto | Risco | Dependências | Status |
|----|------|------|-----------|------------|-----------------|---------|---------|-------|--------------|--------|
| BCK-001 | Feature | Gastos por categoria | Exibir distribuição de despesas por categoria quando a base de categorias e categorização estiver pronta. | P1 | Sprint 5 | M | Alto | Médio | Sprint 4: categorias e transações categorizadas | Backlog |
| BCK-002 | Feature | Top estabelecimentos/descrições | Listar descrições ou estabelecimentos mais recorrentes/relevantes, com cuidado para não expor texto financeiro sensível em logs ou telas indevidas. | P3 | Pós-MVP | M | Médio | Médio | Normalização segura de descrições; revisão de privacidade | Ideia |
| BCK-003 | Feature | Ranking de maiores saídas | Mostrar maiores despesas do período para ajudar o usuário a identificar impactos financeiros relevantes. | P1 | Sprint 5 | M | Alto | Médio | Filtros de período confiáveis; regras de privacidade para descrições | Backlog |
| BCK-004 | Feature | Saldo acumulado | Calcular e exibir evolução de saldo acumulado ao longo do tempo, deixando claro se o saldo é estimado a partir das transações importadas. | P2 | Pós-MVP | M | Alto | Alto | Decisão de produto sobre saldo estimado vs. saldo bancário real | Ideia |
| BCK-005 | Feature | Calendário financeiro | Criar visualização por calendário para localizar dias de maior concentração de entradas e saídas. | P3 | Futuro | G | Médio | Médio | Mais volume de dados; definição de visualização responsiva | Ideia |
| BCK-006 | Feature | Ofensores do mês | Destacar principais categorias, descrições ou despesas que mais impactaram o mês, sem tom julgador. | P2 | Pós-MVP | M | Médio | Médio | Categorias; cuidado de linguagem; possível dependência de BCK-001 | Ideia |
| BCK-007 | UX | Melhorar responsividade/legibilidade da tabela | Ajustar tabela de transações para melhor leitura em telas menores e em desktop com sidebar, preservando densidade e clareza. | P1 | Sprint 4 | M | Alto | Baixo | Design responsivo da área autenticada | Backlog |
| BCK-008 | UX | Exibir período real calculado | Mostrar de forma explícita o intervalo real considerado pelos filtros e KPIs, reduzindo ambiguidade para usuários com dados importados fora do mês atual. | P1 | Sprint 4 | P | Alto | Baixo | Definição da semântica dos filtros de data | Concluído |
| BCK-009 | Pesquisa | Avaliar regra do filtro "Mês atual" | Decidir se "Mês atual" deve usar o mês do sistema ou o mês mais recente disponível nos dados importados. | P1 | Discovery | P | Alto | Médio | Alinhamento de produto sobre expectativa do usuário | Ideia |
| BCK-010 | UX | Avaliar rótulo "Todo o período importado" | Avaliar troca de "Período importado" para "Todo o período importado" para melhorar clareza do filtro. | P2 | Discovery | P | Médio | Baixo | Decisão de texto e consistência com filtros | Ideia |
| BCK-011 | Tech Debt | Suíte automatizada de testes | Adicionar testes para parser CSV, normalização, dedupe, filtros de data e fluxos sensíveis de sessão/importação. | P1 | Sprint 4 | M | Alto | Médio | Definir runner de testes sem inflar dependências | Backlog |
| BCK-012 | Tech Debt | Migration segura para bancos com dados | Revisar migrations antigas que assumem banco vazio, especialmente `StatementImport.updatedAt` obrigatório sem default. | P1 | Sprint 4 | P | Alto | Médio | Ambiente local com Postgres e histórico de migrations | Backlog |
| BCK-013 | Segurança | Guardrails de categorias por usuário | Antes da UI de categorias, criar serviços que validem `userId` em categoria, regra e transação, evitando associações cruzadas. | P1 | Sprint 4 | M | Alto | Médio | Sprint 4: categorias e regras | Backlog |
| BCK-014 | UX | Navegação mobile autenticada | Criar navegação responsiva para área autenticada, já que a sidebar atual aparece apenas em telas grandes. | P2 | Sprint 4 | M | Médio | Baixo | Layout autenticado | Backlog |

## Por Sprint Sugerida

### Sprint 4

- BCK-007: melhorar responsividade/legibilidade da tabela.
- BCK-011: suíte automatizada de testes.
- BCK-012: migration segura para bancos com dados.
- BCK-013: guardrails de categorias por usuário.
- BCK-014: navegação mobile autenticada.

### Sprint 5

- BCK-001: gastos por categoria.
- BCK-003: ranking de maiores saídas.

### Pós-MVP

- BCK-002: top estabelecimentos/descrições.
- BCK-004: saldo acumulado.
- BCK-006: ofensores do mês.

### Futuro

- BCK-005: calendário financeiro.

### Discovery

- BCK-009: avaliar regra do filtro "Mês atual".
- BCK-010: avaliar rótulo "Todo o período importado".

## Por Tema

### Analytics Financeiros

- BCK-001: gastos por categoria.
- BCK-003: ranking de maiores saídas.
- BCK-004: saldo acumulado.
- BCK-005: calendário financeiro.
- BCK-006: ofensores do mês.

### Clareza De Filtros E Períodos

- BCK-009: avaliar regra do filtro "Mês atual".
- BCK-010: avaliar rótulo "Todo o período importado".

### UX De Tabela

- BCK-007: melhorar responsividade/legibilidade da tabela.

### Privacidade E Dados Sensíveis

- BCK-002: top estabelecimentos/descrições.
- BCK-003: ranking de maiores saídas.
- BCK-006: ofensores do mês.
- BCK-013: guardrails de categorias por usuário.

### Qualidade Técnica

- BCK-011: suíte automatizada de testes.
- BCK-012: migration segura para bancos com dados.
- BCK-014: navegação mobile autenticada.

## Itens Refinados

### BCK-008 - Exibir Período Real Calculado

**Tipo:** UX  
**Prioridade:** P1  
**Sprint sugerida:** Sprint 4  
**Esforço estimado:** P  
**Impacto:** Alto  
**Risco:** Baixo  
**Status:** Concluído

#### Problema

Filtros como "Mês atual", "Mês anterior" e "Período importado" podem gerar dúvida quando o usuário importa dados antigos, incompletos ou de múltiplos períodos.

#### Objetivo

Exibir o intervalo real usado nos KPIs, gráficos e tabela para que o usuário entenda exatamente quais transações estão sendo consideradas.

#### Critérios De Aceite

- [x] A interface mostra o intervalo inicial e final considerado pelo filtro ativo.
- [x] O texto não promete saldo bancário real quando o cálculo usa apenas transações importadas.
- [x] O comportamento respeita os filtros existentes e não altera cálculos financeiros nesta tarefa.

#### Observações Técnicas

Item provável de interface/dashboard. Não deve alterar queries Prisma, schema, migrations ou regras financeiras sem tarefa específica.

#### Fora Do Escopo

- Criar novos filtros.
- Alterar cálculo de KPIs.
- Implementar categorização.

### BCK-007 - Melhorar Responsividade/Legibilidade Da Tabela

**Tipo:** UX  
**Prioridade:** P1  
**Sprint sugerida:** Sprint 4  
**Esforço estimado:** M  
**Impacto:** Alto  
**Risco:** Baixo  
**Status:** Backlog

#### Problema

A tabela de transações precisa continuar legível em telas menores e em desktop com sidebar, principalmente quando descrições, datas e valores competem por espaço.

#### Objetivo

Melhorar a leitura da tabela sem esconder informações essenciais e sem transformar a tela em uma experiência pesada.

#### Critérios De Aceite

- [ ] A tabela permanece legível em mobile e desktop.
- [ ] Valores, datas e descrições não se sobrepõem.
- [ ] A solução preserva privacidade e não expõe descrições completas fora do contexto autenticado.

#### Observações Técnicas

Item de UX. Deve evitar mudanças em modelo de dados, importação, deduplicação ou cálculos.

#### Fora Do Escopo

- Adicionar paginação avançada.
- Criar busca global.
- Alterar dados exibidos por regras financeiras novas.

## Candidatos A Validar

Os itens abaixo precisam de confirmação de produto antes de virar implementação:

| ID | Pergunta | Decisão necessária | Status |
|----|----------|--------------------|--------|
| BCK-009 | "Mês atual" deve seguir o mês do sistema ou o mês mais recente dos dados importados? | Definir semântica do filtro para evitar surpresa em datasets antigos. | Ideia |
| BCK-010 | O rótulo "Período importado" deve virar "Todo o período importado"? | Validar clareza do texto e consistência com a navegação do dashboard. | Ideia |
| CAND-001 | Lista completa consolidada do chat de Backlog e Ideias | O prompt atual trouxe um placeholder em vez da lista; novos itens devem ser adicionados a partir de BCK-015 quando a lista for colada. | Ideia |

## Observações

- Itens deste backlog não entram automaticamente no escopo da sprint atual.
- Itens que dependem de categorias devem aguardar a base da Sprint 4 ou posterior.
- Nenhum item deve ser marcado como concluído sem implementação validada.
- Bugs bloqueantes da sprint atual devem ser sinalizados como bloqueantes antes de serem enviados para futuro.
- Não renumerar IDs antigos. O próximo item novo deve usar `BCK-015`.
