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
| BCK-007 | UX | Melhorar responsividade/legibilidade da tabela | Ajustar tabela de transações para melhor leitura em telas menores e em desktop com sidebar, preservando densidade e clareza. | P1 | Sprint 4 | M | Alto | Baixo | Design responsivo da área autenticada | Concluído |
| BCK-008 | UX | Exibir período real calculado | Mostrar de forma explícita o intervalo real considerado pelos filtros e KPIs, reduzindo ambiguidade para usuários com dados importados fora do mês atual. | P1 | Sprint 4 | P | Alto | Baixo | Definição da semântica dos filtros de data | Concluído |
| BCK-009 | Pesquisa | Avaliar regra do filtro "Mês atual" | Decidir se "Mês atual" deve usar o mês do sistema ou o mês mais recente disponível nos dados importados. | P1 | Discovery | P | Alto | Médio | Alinhamento de produto sobre expectativa do usuário | Concluído |
| BCK-010 | UX | Avaliar rótulo "Todo o período importado" | Avaliar troca de "Período importado" para "Todo o período importado" para melhorar clareza do filtro. | P2 | Discovery | P | Médio | Baixo | Decisão de texto e consistência com filtros | Concluído |
| BCK-011 | Tech Debt | Suíte automatizada de testes | Adicionar testes para parser CSV, normalização, dedupe, filtros de data e fluxos sensíveis de sessão/importação. | P1 | Sprint 4 | M | Alto | Médio | Definir runner de testes sem inflar dependências | Backlog |
| BCK-012 | Tech Debt | Migration segura para bancos com dados | Revisar migrations antigas que assumem banco vazio, especialmente `StatementImport.updatedAt` obrigatório sem default. | P1 | Sprint 4 | P | Alto | Médio | Ambiente local com Postgres e histórico de migrations | Backlog |
| BCK-013 | Segurança | Guardrails de categorias por usuário | Antes da UI de categorias, criar serviços que validem `userId` em categoria, regra e transação, evitando associações cruzadas. | P1 | Sprint 4 | M | Alto | Médio | Sprint 4: categorias e regras | Concluído |
| BCK-014 | UX | Navegação mobile autenticada | Criar navegação responsiva para área autenticada, já que a sidebar atual aparece apenas em telas grandes. | P2 | Sprint 4 | M | Médio | Baixo | Layout autenticado | Backlog |
| BCK-015 | Tech Debt | Reconciliar Bloco 1 | Integrar conscientemente dashboard local e contribuição remota, preservando estados vazios, período e tabela responsiva. | P1 | Sprint 4 | P | Alto | Médio | PR #1 e alterações locais | Concluído |
| BCK-016 | Data Model | Unicidade estrutural de categorias | Impedir atomicamente nomes equivalentes no mesmo escopo com chave comparativa, unicidade de filhos e indice parcial de raizes. | P1 | Sprint 5 | M | Alto | Alto | PostgreSQL 16; Prisma 5.22; migration e testes concorrentes | Concluído |
| BCK-017 | Segurança | Bloquear relacionamentos entre usuários | Impedir no serviço e no banco relações cruzadas entre pai, categoria, regra, transação, conta e importação. | P0 | Sprint 5 | M | Alto | Alto | Diagnóstico dos dados; Prisma 5.22; PostgreSQL 16 | Concluído |
| BCK-018 | Feature | Camada `lib/categories/` | Implementar tipos, listagem e mutações server-side com isolamento por `userId`. | P1 | Sprint 4 | M | Alto | Alto | BCK-016 e BCK-017 | Concluído |
| BCK-019 | Teste | Autorização de categorias | Cobrir acesso, edição e associação de recursos de outro usuário. | P0 | Sprint 4 | M | Alto | Alto | BCK-018 e runner de testes | Concluído |
| BCK-020 | Teste | Validar hardening CSV | Cobrir mensagens controladas, erro interno genérico, contadores reais e deduplicação concorrente. | P1 | Sprint 4 | M | Alto | Médio | BCK-011 | Concluído |
| BCK-021 | UX | Corrigir link Categorias | Fazer a sidebar apontar para `/categories` somente quando a rota funcional existir. | P1 | Sprint 4 | P | Médio | Baixo | Bloco 4 | Concluído |
| BCK-022 | Feature | Tela de categorias | Disponibilizar listagem hierárquica, estado vazio, criação de raiz/filha e edição de nome pela camada segura. | P1 | Sprint 4 | M | Alto | Médio | BCK-018 | Concluído |
| BCK-023 | Feature | Categorização manual | Permitir atribuir e trocar categoria raiz ou filha em transações do usuário, registrando `USER_MANUAL`. | P1 | Sprint 4 | M | Alto | Médio | BCK-018 | Concluído |
| BCK-024 | UX | Transações sem categoria | Criar rota `/transactions`, identificação e filtro simples de itens sem categoria. | P1 | Sprint 4 | M | Alto | Baixo | BCK-023 | Concluído |
| BCK-025 | Segurança | Autorização da categorização | Revalidar transação e categoria por `userId` e impedir associações entre usuários. | P0 | Sprint 4 | M | Alto | Alto | BCK-023 | Concluído |
| BCK-026 | Feature | Regras automáticas v1 | Criar, listar, ativar e desativar regras `CONTAINS` com prioridade determinística. | P1 | Sprint 4 | M | Alto | Médio | BCK-018 | Concluído |
| BCK-027 | Feature | Aplicação explícita de regras | Aplicar regras ativas apenas a transações sem categoria e registrar `SYSTEM_RULE`. | P1 | Sprint 4 | M | Alto | Alto | BCK-026 | Concluído |
| BCK-028 | Segurança | Isolamento de regras | Validar regra, categoria e transação por `userId`, preservando categorização manual. | P0 | Sprint 4 | M | Alto | Alto | BCK-027 | Concluído |
| BCK-029 | Feature | Autoexecução após importação | Aplicar regras automaticamente ao concluir uma importação. | P2 | Sprint 5 | M | Médio | Médio | Hardening e testes automatizados | Backlog |
| BCK-030 | Feature | Editar e excluir regras | Permitir edição completa e exclusão definitiva com autorização por usuário. | P2 | Sprint 5 | M | Médio | Médio | Regras v1 | Backlog |
| BCK-031 | Segurança / Infraestrutura / Deploy | Proteção de borda e acesso restrito com Cloudflare | Avaliar Cloudflare Access, WAF, rate limiting por origem, Turnstile e proteção da origem antes do primeiro deploy externo, sem substituir controles internos. | P1 agora; P0 antes de testadores externos | Sprint 5, pré-deploy ou sprint de infraestrutura | M | Alto | Médio | Estratégia de deploy; grupo de testadores; topologia da origem; análise de custos e planos | Ideia |

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
- BCK-031: avaliar proteção de borda e acesso restrito com Cloudflare antes do primeiro deploy externo.

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

### Decisões Da Sprint 4 - Bloco 1

- BCK-008: o dashboard passa a exibir o intervalo real considerado pelo filtro ativo, usando as datas já calculadas pela camada `lib/dashboard`.
- BCK-009: neste bloco, "Mês atual" usa o mês atual do sistema/calendário, não o mês mais recente disponível nos dados importados.
- BCK-010: o rótulo visível do filtro `imported-period` passa a ser "Todo o período importado", sem alterar o valor interno do filtro.

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

### Segurança, Infraestrutura E Deploy

- BCK-031: proteção de borda e acesso restrito com Cloudflare.

## Itens Em Discovery

### BCK-031 - Proteção De Borda E Acesso Restrito Com Cloudflare

- **Tipo:** Segurança / Infraestrutura / Deploy
- **Prioridade:** P1 agora; P0 antes de liberar o sistema para testadores externos
- **Sprint sugerida:** Sprint 5, pré-deploy ou sprint específica de infraestrutura
- **Esforço estimado:** M
- **Impacto:** Alto
- **Risco:** Médio
- **Dependências:** Estratégia de deploy; definição do primeiro grupo de testadores; topologia e restrições da origem; análise de custos e limitações dos planos Cloudflare
- **Status:** Ideia

#### Problema

Quando o Money Flow for publicado fora do ambiente local, mesmo para um grupo pequeno de testadores, a aplicação ficará exposta à internet. Isso aumenta os riscos de abuso, automações, tentativas de login, exploração de endpoints e acesso direto ao servidor de origem.

#### Objetivo

Avaliar o uso da Cloudflare como camada anterior à aplicação no primeiro deploy do Money Flow, especialmente para restringir acesso, reduzir abuso e proteger a origem.

#### Ideia

A estratégia poderá combinar Cloudflare Access para permitir somente usuários convidados, WAF e rate limiting para controlar abusos por origem, e Turnstile para reduzir automações em ações sensíveis.

O servidor de origem deverá ficar protegido contra acesso direto, por exemplo utilizando Cloudflare Tunnel ou restrições equivalentes.

#### Decisão Inicial

Cloudflare deve ser considerada uma camada complementar de borda, não substituta dos controles internos do Money Flow.

A aplicação continuará precisando manter autenticação própria, sessões seguras, isolamento por `userId`, validações server-side, audit logs seguros e rate limiting por identidade.

#### Critérios De Aceite

- [ ] Avaliar se Cloudflare Access faz sentido para o primeiro grupo restrito de usuários.
- [ ] Avaliar WAF e rate limiting por origem.
- [ ] Avaliar Turnstile para ações sensíveis, como login, cadastro, convite, importação ou recuperação de senha futura.
- [ ] Avaliar Cloudflare Tunnel ou alternativa para evitar acesso direto ao servidor de origem.
- [ ] Documentar custos, limitações de plano e trade-offs.
- [ ] Garantir que Cloudflare não substitua autenticação interna do Money Flow.
- [ ] Garantir que Cloudflare não substitua isolamento por `userId`.
- [ ] Garantir que Cloudflare não substitua rate limiting por identidade dentro da aplicação.
- [ ] Registrar a decisão final antes do primeiro deploy externo.

#### Observações De Segurança

Cloudflare deve ser vista como proteção de borda. Ela reduz exposição e abuso externo, mas não corrige falhas internas da aplicação.

O Money Flow ainda precisa validar sessão no servidor, filtrar queries por `userId`, proteger rotas internas, evitar logs sensíveis e impedir qualquer tela administrativa que exponha transações financeiras dos usuários.

#### Relação Com Outros Itens

- Cadastro por convite.
- Painel administrativo mínimo.
- Rate limiting.
- Primeiro deploy.
- Hardening de segurança.
- Estratégia de testadores externos.
- Proteção da origem.

#### Fora Do Escopo Inicial

- Implementar Cloudflare imediatamente.
- Abrir cadastro público.
- Substituir autenticação interna por Cloudflare.
- Criar painel administrativo com acesso a dados financeiros.
- Liberar produção pública sem revisão de segurança.
- Assumir que WAF resolve falhas internas de autorização, sessão ou isolamento de dados.

#### Evidência E Decisões Pendentes

O roadmap já prevê hardening de segurança na Sprint 5 e deploy futuro com revisão de variáveis, cookies e observabilidade. A seleção deste item para uma sprint permanece pendente de decisão explícita sobre provedor, topologia, custos e grupo de testadores; seu registro não autoriza implementação.

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
**Status:** Concluído

#### Problema

A tabela de transações precisa continuar legível em telas menores e em desktop com sidebar, principalmente quando descrições, datas e valores competem por espaço.

#### Objetivo

Melhorar a leitura da tabela sem esconder informações essenciais e sem transformar a tela em uma experiência pesada.

#### Critérios De Aceite

- [x] A tabela permanece legível em mobile e desktop.
- [x] Valores, datas e descrições não se sobrepõem.
- [x] A solução preserva privacidade e não expõe descrições completas fora do contexto autenticado.

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
| BCK-009 | "Mês atual" deve seguir o mês do sistema ou o mês mais recente dos dados importados? | Validado: usa o mês atual do sistema/calendário. | Concluído |
| BCK-010 | O rótulo "Período importado" deve virar "Todo o período importado"? | Validado: usa "Todo o período importado". | Concluído |
| CAND-001 | Lista completa consolidada do chat de Backlog e Ideias | O prompt atual trouxe um placeholder em vez da lista; novos itens devem ser adicionados a partir de BCK-023 quando a lista for colada. | Ideia |

## Observações

- Testes manuais do Bloco 1: PASSOU para login, filtros, período real, estados vazios, tabela responsiva, preview/importação/reimportação CSV, CSV inválido, histórico e dashboard pós-importação.
- Bloco 3 da Sprint 4: camada `lib/categories/` concluída por revisão estática e validações técnicas; as entregas posteriores concluíram testes, categorização, regras, as constraints compostas de `BCK-017` e a unicidade estrutural de `BCK-016`.
- Bloco 4: PASSOU nos testes manuais de estado vazio, raiz/filha, duplicidade, mesmo nome sob pais diferentes, edição, limite de hierarquia, dois usuários, sessão e responsividade. O erro de export incompatível em arquivo `"use server"` também foi corrigido e validado.

- Itens deste backlog não entram automaticamente no escopo da sprint atual.
- Itens que dependem de categorias devem aguardar a base da Sprint 4 ou posterior.
- Nenhum item deve ser marcado como concluído sem implementação validada.
- Bugs bloqueantes da sprint atual devem ser sinalizados como bloqueantes antes de serem enviados para futuro.
- Não renumerar IDs antigos. O próximo item novo deve usar `BCK-032`.
