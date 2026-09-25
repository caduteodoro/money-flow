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
| BCK-002 | Feature | Top descrições por valor de saída | Até cinco grupos de descrição por impacto no período; hash válido permite drill-through exato, grupos sem hash ficam sem link. Não identifica estabelecimentos. | P3 | Sprint 6 — Bloco 4A | M | Médio | Médio | Normalização analítica; filtros autorizados; privacidade | Concluído |
| BCK-003 | Feature | Ranking de maiores saídas | Até cinco despesas do período com navegação para localizar a transação autorizada. | P1 | Sprint 6 — Bloco 4A | M | Alto | Médio | Filtros de período; transactionId por usuário | Concluído |
| BCK-004 | Feature | Saldo acumulado | Calcular e exibir evolução de saldo acumulado ao longo do tempo, deixando claro se o saldo é estimado a partir das transações importadas. | P2 | Pós-MVP | M | Alto | Alto | Decisão de produto sobre saldo estimado vs. saldo bancário real | Ideia |
| BCK-005 | Feature | Calendário financeiro | Criar visualização por calendário para localizar dias de maior concentração de entradas e saídas. | P3 | Futuro | G | Médio | Médio | Mais volume de dados; definição de visualização responsiva | Ideia |
| BCK-006 | Feature | Principais gastos do período (ofensores internos) | Descrições, maiores saídas e dias de maior gasto aprofundam destino/cobertura já existentes; linguagem descritiva e somente EXPENSE. | P2 | Sprint 6 — Bloco 4A | M | Médio | Médio | Contratos analíticos; BCK-002 e BCK-003; cockpit do Bloco 3 | Concluído |
| BCK-007 | UX | Melhorar responsividade/legibilidade da tabela | Entrega da Sprint 4 preservada; reavaliar experiência responsiva da página de transações após a homologação do Bloco 4A. | P1 | Sprint 6 — avaliação no Bloco 5 | M | Alto | Baixo | Design responsivo da área autenticada; nova avaliação manual | Backlog |
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
| BCK-032 | Privacidade / Segurança | Política de audit logs | Definir retenção, anonimização e integridade dos audit logs conciliando investigação de segurança, privacidade e exclusão de conta. | P1 | Futuro, antes de produção | M | Alto | Alto | Requisitos operacionais e legais; modelo de ameaças; fluxo de exclusão de conta | Backlog |
| BCK-033 | Privacidade / Infraestrutura | Retenção e expurgo de backups | Definir prazo máximo de sobrevivência após exclusão, expurgo, restauração segura e prevenção da reintrodução de contas excluídas. | P1 | Futuro, antes de produção | M | Alto | Alto | Estratégia de backup e restore; infraestrutura de produção; política de retenção | Backlog |
| BCK-034 | UX | Expansão somente com truncamento | Evitar expandir/recolher redundante quando a descrição já está integralmente visível. | P2 | Sprint 6 — avaliação no Bloco 5 | P | Médio | Baixo | Medição do truncamento; teclado; resize e zoom | Backlog |
| BCK-035 | Pesquisa | Avisos mousewheel não passivo | Identificar origem e efeito dos avisos observados no Chrome antes de propor correção. | P2 | Sprint 6 — avaliação no Bloco 5 | P | Médio | Baixo | Reprodução sanitizada; identificação do listener | Backlog |
| BCK-036 | Acessibilidade | Identificação em formulário de senha | Avaliar aviso sobre senha sem campo de identificação associado. | P2 | Sprint 6 — avaliação no Bloco 5 | P | Médio | Médio | Identificar formulário e semântica de autocomplete | Backlog |
| BCK-037 | Feature | Intervalo personalizado de datas | Permitir selecionar data inicial e final, com contratos consistentes entre dashboard e detalhamento. | P2 | Futuro, fora da Sprint 6 | M | Alto | Médio | Semântica de limites e UTC; validação server-side | Backlog |
| BCK-038 | Feature | Ordenar transações por data e valor | Escolher ordenação estável sem perder filtros ou consistência da paginação. | P2 | Futuro, fora da Sprint 6 | M | Médio | Médio | Contrato de ordenação; desempate; paginação | Backlog |
| BCK-039 | Data Model | Preservar horário disponível na fonte | Avaliar preservação futura de horário e timezone sem inventar precisão ausente. | P3 | Futuro, fora da Sprint 6 | M | Médio | Alto | Capacidades da fonte; parser; deduplicação; revisão de modelo | Backlog |
| BCK-040 | Analytics | Análise cronológica de dias atípicos | Avaliar sequência temporal e contexto dos dias atípicos, além do ranking de maiores gastos. | P3 | Futuro, fora da Sprint 6 | M | Médio | Médio | Definição de atipicidade; período e base comparativa | Backlog |
| BCK-041 | Discovery / UX | Storytelling e densidade do dashboard | Analisar visão do usuário e experiência mobile mais compacta antes de propor mudanças visuais. | P2 | Após a Sprint 6 — Discovery | M | Alto | Baixo | Conclusão da Sprint 6; perguntas de produto; visão do usuário | Backlog |

## Por Sprint Sugerida

### Sprint 4

- BCK-011: suíte automatizada de testes.
- BCK-012: migration segura para bancos com dados.
- BCK-013: guardrails de categorias por usuário.
- BCK-014: navegação mobile autenticada.

### Sprint 5

- BCK-001: gastos por categoria.

### Sprint 6

- BCK-002, BCK-003 e BCK-006: concluídos no Bloco 4A, nos limites reconciliados abaixo.
- BCK-007 e BCK-034 a BCK-036: observações não bloqueantes reservadas à avaliação no Bloco 5; sem execução iniciada.

### Pós-MVP

- BCK-004: saldo acumulado.

### Futuro

- BCK-005: calendário financeiro.
- BCK-032: política de retenção, anonimização e integridade de audit logs.
- BCK-033: política de retenção e expurgo de backups.
- BCK-037 a BCK-040: datas personalizadas, ordenação, horário da fonte e dias atípicos; fora da Sprint 6.

### Discovery

- BCK-009: avaliar regra do filtro "Mês atual".
- BCK-010: avaliar rótulo "Todo o período importado".
- BCK-031: avaliar proteção de borda e acesso restrito com Cloudflare antes do primeiro deploy externo.
- BCK-041: storytelling, hierarquia e experiência mobile mais compacta, somente após a Sprint 6.

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

- BCK-002: top descrições por valor de saída; sem identificação de estabelecimentos.
- BCK-003: ranking de maiores saídas.
- BCK-006: ofensores do mês.
- BCK-013: guardrails de categorias por usuário.

### Qualidade Técnica

- BCK-011: suíte automatizada de testes.
- BCK-012: migration segura para bancos com dados.
- BCK-014: navegação mobile autenticada.

### Segurança, Infraestrutura E Deploy

- BCK-031: proteção de borda e acesso restrito com Cloudflare.
- BCK-032: política de retenção, anonimização e integridade de audit logs.
- BCK-033: política de retenção e expurgo de backups.

## Reconciliação da homologação do Bloco 4A

Fonte: aceite funcional informado pelo usuário, registrado no [roadmap](06-roadmap.md#homologação-funcional-do-bloco-4a), e contratos/testes atuais. Nenhum dado financeiro ou credencial compõe a evidência. Os IDs vigentes foram pesquisados antes desta inclusão; `BCK-034` era o próximo disponível. Prioridades e esforços dos novos itens são estimativas iniciais para refinamento, não compromissos de execução.

- **BCK-002:** concluído como ranking de descrições por valor das saídas. O título antigo "Top estabelecimentos/descrições" foi restringido ao domínio comprovado. Não há identificação de empresas ou ranking de recorrência; grupos sem hash válido ficam sem link, conforme o fallback aprovado.
- **BCK-003:** concluído com até cinco maiores saídas e localização exata via `transactionId` autorizado.
- **BCK-006:** concluído como aprofundamento dos principais gastos do período, com descrições, saídas e dias. Categorias continuam no cockpit existente. Não inclui calendário, Pareto, recorrência ou análise cronológica de atipicidade.
- **BCK-007:** reaberto em Backlog para reavaliação no Bloco 5, sem apagar o aceite da Sprint 4 nem duplicar o item. A observação da tabela de transações não invalida a aprovação responsiva do dashboard do Bloco 4A.

### Pendências não bloqueantes para avaliação no Bloco 5

**BCK-034 — Expansão somente com truncamento.** Problema observado: expandir/recolher aparece mesmo quando o texto está integralmente visível. Critério para futura aceitação: controle disponível somente com truncamento real, reavaliado em resize/zoom, preservando texto completo e acesso por teclado. Fora do escopo: redesenhar rankings ou alterar descrições. Evidência: homologação do usuário; mecanismo de medição ainda depende de refinamento.

**BCK-035 — Avisos de `mousewheel` não passivo.** Objetivo: reproduzir e localizar o listener responsável, distinguindo código da aplicação, biblioteca ou ambiente do navegador. Critério: registrar origem e impacto verificável e decidir se há correção necessária. Fora do escopo: presumir defeito, trocar/atualizar biblioteca ou suprimir avisos sem diagnóstico. Evidência: aviso informado no Chrome; causa ainda não identificada.

**BCK-036 — Identificação em formulário de senha.** Objetivo: identificar o formulário e avaliar associação/semântica adequada para acessibilidade e gerenciadores de senha. Critério: documentar a origem do aviso e validar uma solução, se necessária, sem exposição adicional de identidade ou alteração de autenticação. Fora do escopo: redesenhar login ou coletar credenciais. Evidência: aviso informado pelo usuário; formulário responsável ainda precisa ser confirmado.

Esses itens e `BCK-007` não bloqueiam o aceite do Bloco 4A. Permanecem sem implementação nesta formalização e precisam de refinamento antes de execução autorizada no Bloco 5.

### Melhorias futuras fora da Sprint 6

**BCK-037 — Intervalo personalizado de datas.** Objetivo: escolher início e fim além dos filtros predefinidos. Critérios a refinar: validar limites e combinações; preservar UTC, isolamento, drill-through e paginação coerentes. Fora do escopo: mudar os filtros atuais nesta sprint. Evidência: solicitação pós-homologação; semântica inclusiva/exclusiva e UX ainda pendentes.

**BCK-038 — Ordenação por data e valor.** Objetivo: controlar a ordem da página de transações. Critérios a refinar: direções de ordenação explícitas, desempate estável, filtros preservados e paginação sem omissões/duplicatas. Fora do escopo: alterar ordem dos rankings analíticos. Evidência: solicitação pós-homologação; contrato de parâmetros e custo das consultas ainda pendentes.

**BCK-039 — Horário disponível na fonte.** Objetivo: avaliar preservação futura da precisão temporal realmente fornecida. Critérios a refinar: distinguir fonte com/sem horário, definir timezone e avaliar importação, deduplicação e dias civis antes de qualquer mudança. Fora do escopo: inventar horários, reprocessar dados ou autorizar schema/migration. Evidência: solicitação pós-homologação; capacidade das fontes e impacto de modelo ainda pendentes.

**BCK-040 — Dias atípicos em ordem cronológica.** Objetivo: contextualizar dias ao longo do tempo, não apenas selecionar os maiores valores. Critérios a refinar: definir atipicidade, base comparativa, ordenação cronológica e explicação sem inferir causalidade. Fora do escopo: calendário/heatmap (`BCK-005`), previsões e IA. Evidência: solicitação pós-homologação; regra analítica e visualização ainda pendentes.

**BCK-041 — Storytelling e densidade do dashboard.** Decisão de produto: realizar atividade inicialmente documental e de Discovery após concluir a Sprint 6, incluindo a experiência mais compacta em mobile. Critério de aceite do Discovery: mapa de perguntas por bloco, hierarquia, ordem das seções, proporções, densidade, redundâncias e percurso entre visão executiva e detalhe, validado com a visão atual do usuário. Fora do escopo: implementar layout, tabs, carrossel ou reduzir informação agora. Evidência: decisão explícita pós-homologação; soluções visuais e posterior execução ainda dependem da análise. Não duplica a tabela de transações de `BCK-007` nem o ranking de `BCK-006`.

## Itens Em Backlog

### BCK-032 - Política De Retenção, Anonimização E Integridade De Audit Logs

- **Tipo:** Privacidade / Segurança
- **Prioridade:** P1
- **Sprint sugerida:** Futuro, antes de produção
- **Esforço estimado:** M
- **Impacto:** Alto
- **Risco:** Alto
- **Dependências:** requisitos operacionais e legais; modelo de ameaças; fluxo de exclusão de conta
- **Status:** Backlog

#### Objetivo E Critérios De Aceite

Definir finalidades, prazos e controles que conciliem investigação de segurança, minimização e exclusão de conta. A política futura deve identificar quais eventos podem ser retidos ou anonimizados, impedir vínculo indevido com uma conta excluída, definir controles de integridade e acesso e documentar expurgo verificável.

Ficam fora deste item a implementação de recibo/tombstone identificável, exportação de dados e uma infraestrutura imutável de auditoria.

### BCK-033 - Política De Retenção E Expurgo De Backups

- **Tipo:** Privacidade / Infraestrutura
- **Prioridade:** P1
- **Sprint sugerida:** Futuro, antes de produção
- **Esforço estimado:** M
- **Impacto:** Alto
- **Risco:** Alto
- **Dependências:** estratégia de backup e restore; infraestrutura de produção; política de retenção
- **Status:** Backlog

#### Objetivo E Critérios De Aceite

Definir prazo máximo de sobrevivência dos dados após exclusão, rotina de expurgo, restauração segura e mecanismo que evite reintroduzir contas excluídas. A política deve estabelecer responsáveis, evidência operacional e testes periódicos de backup/restore sem usar dados financeiros reais.

Ficam fora deste item a escolha antecipada de provedor, a execução de restore em produção e qualquer promessa de prazo antes da decisão operacional.

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
**Sprint sugerida:** Sprint 6 — avaliação no Bloco 5\
**Esforço estimado:** M  
**Impacto:** Alto  
**Risco:** Baixo  
**Status:** Backlog — reavaliação; entrega da Sprint 4 preservada

O aceite anterior permanece registrado nos critérios abaixo. A homologação do Bloco 4A motivou nova avaliação da página de transações, sem regressão comprovada e sem duplicar o item. Antes de nova implementação, reproduzir o contexto responsivo observado, identificar a dificuldade concreta e definir ajuste mínimo. A nova aceitação deverá confirmar legibilidade de data, descrição, valor e ações nos tamanhos avaliados, preservando filtros, teclado e privacidade. Essa avaliação está pendente; não foi executada nesta formalização.

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
| CAND-001 | Lista completa consolidada do chat de Backlog e Ideias | A solicitação histórica trouxe um placeholder em vez da lista; quando ela for fornecida, reconciliar equivalências e usar o próximo ID disponível, sem reutilizar IDs já atribuídos. | Ideia |

## Observações

- Testes manuais do Bloco 1: PASSOU para login, filtros, período real, estados vazios, tabela responsiva, preview/importação/reimportação CSV, CSV inválido, histórico e dashboard pós-importação.
- Bloco 3 da Sprint 4: camada `lib/categories/` concluída por revisão estática e validações técnicas; as entregas posteriores concluíram testes, categorização, regras, as constraints compostas de `BCK-017` e a unicidade estrutural de `BCK-016`.
- Bloco 4: PASSOU nos testes manuais de estado vazio, raiz/filha, duplicidade, mesmo nome sob pais diferentes, edição, limite de hierarquia, dois usuários, sessão e responsividade. O erro de export incompatível em arquivo `"use server"` também foi corrigido e validado.
- Bloco 6 da Sprint 5: `BCK-011` permanece Backlog porque parser CSV, normalizacao financeira, filtros de data e preview/importacao nao possuem cobertura equivalente aos dominios de seguranca ja testados. `BCK-012` permanece Backlog; recriacao desde zero nao comprova migrations antigas com dados. `BCK-031` nao foi implementado. `BCK-032` e `BCK-033` permanecem Backlog, P1 e fora da Sprint 5 atual.

- Itens deste backlog não entram automaticamente no escopo da sprint atual.
- Itens que dependem de categorias devem aguardar a base da Sprint 4 ou posterior.
- Nenhum item deve ser marcado como concluído sem implementação validada.
- Bugs bloqueantes da sprint atual devem ser sinalizados como bloqueantes antes de serem enviados para futuro.
- Não renumerar IDs antigos. O próximo item novo deve usar `BCK-042`.
