# 06 - Roadmap

## Sprint 0

- Fundacao do projeto.
- Stack.
- Docker.
- Prisma.
- Documentacao.
- AGENTS.md.
- Skills/agentes.
- Telas mockadas para `/`, `/login`, `/register` e `/dashboard`.

Status: concluida.

## Sprint 1

- Cadastro de usuario.
- Login.
- Logout.
- Sessao segura com cookie HTTP-only.
- Token puro somente no cookie.
- Hash do token salvo em `Session.tokenHash`.
- Rotas protegidas.
- Isolamento inicial por usuario.
- Audit logs basicos de autenticacao.
- Documentacao atualizada.

Status: concluida.

## Sprint 2

- Base de upload CSV.
- Validacao de extensao, MIME type, tamanho, UTF-8, estrutura e conteudo.
- Parser inicial para CSV estilo Nubank.
- Preview tecnico antes da importacao.
- Importacao com `userId`.
- Deduplicacao por `dedupeKey`.
- Historico de importacoes com mes ou periodo do extrato.
- Logs de auditoria sem conteudo financeiro sensivel.

Status: concluida no escopo planejado para CSV do MVP. OFX e PDF automatico ficaram fora da Sprint 2.

## Sprint 3

- Camada server-side de dashboard em `lib/dashboard`.
- Queries financeiras filtradas por `userId`.
- KPIs financeiros reais.
- Filtros de periodo: periodo importado, ultimos 30 dias, mes atual e mes anterior.
- Intervalo real considerado pelo filtro ativo.
- Dashboard conectado aos dados reais.
- Estado vazio para usuarios sem transacoes.
- Estado especifico para filtros sem transacoes no periodo.
- Tabela de ultimas transacoes.
- Graficos simples de evolucao financeira e entradas vs saidas.
- Insights basicos calculados localmente.
- UI polish e correcao responsiva dos KPIs em zoom 100%.

Status: concluida no escopo planejado para dashboard real do MVP.

## Sprint 4

- Bloco 1: concluido; reconciliacao, hardening CSV, validacoes tecnicas e testes manuais aprovados.
- Bloco 2: concluido no escopo preparatorio da Sprint 4; hardening estrutural posterior foi tratado nas Atividades 5.1 e 5.2 da Sprint 5.
- Bloco 3: concluido; camada server-side segura para listar, criar e renomear categorias pai/filha.
- Bloco 4: concluido e validado manualmente, incluindo criacao, hierarquia, edicao, duplicidade, sessao e isolamento entre usuarios.
- Bloco 5: concluido; categorizacao manual e transacoes sem categoria entregues.
- Bloco 6: concluido; regras automaticas v1 e aplicacao explicita entregues e validadas.

Sprint 4 concluida funcionalmente.

- Rotulos visuais antigos de sprint foram removidos das telas publicas/importacao.
- Importacao passou a diferenciar erro esperado de CSV de erro interno.
- Contadores de importacao passaram a refletir a quantidade realmente inserida pelo banco.
- A integridade de categorias recebeu hardening posterior na Sprint 5: a Atividade 5.1 adicionou constraints compostas com `userId`, e a Atividade 5.2 adicionou unicidade estrutural para categorias equivalentes.
- A fundacao automatizada de testes de seguranca foi adicionada na Sprint 5; a cobertura automatizada ampla de `BCK-011` permanece separada no backlog.
- Analytics por categoria e execucao automatica de regras apos importacao continuam fora da entrega da Sprint 4.

Status: concluida no escopo funcional planejado.

## Sprint 5

- Hardening de seguranca.
- Rate limiting.
- Revisao de privacidade.
- Documentacao final do MVP.
- Preparacao para OFX.

Estado atual:

- Blocos 1 a 4 concluidos nos respectivos escopos documentados.
- Bloco 5, Atividade 5.1: concluida; `SEC-005` mitigado por FKs compostas com `userId`.
- Bloco 5, Atividade 5.2: concluida; `SEC-006` mitigado e `BCK-016` concluido por unicidade estrutural de categorias.
- Bloco 5, Atividade 5.3: concluida; `SEC-007` mitigado por exclusao imediata, definitiva e transacional da propria conta.
- Bloco 5: concluido no escopo das Atividades 5.1, 5.2 e 5.3.
- Bloco 6: concluido; postura de seguranca, privacidade, dependencias, cobertura e fronteiras de liberacao consolidadas sem implementar novas mitigacoes.
- Bloco 7A: concluido tecnicamente; atualizacoes compativeis trataram advisories alcancaveis, `SEC-010` foi mitigado por logging seguro e o contrato independente de provedor de `SEC-009` foi consolidado.
- Bloco 7B: concluido; gate final aprovou integracao local por fast-forward, preservando bloqueios operacionais de preview e producao.
- O rate limiting persistente atual cobre login e cadastro por identidade; protecao por origem/borda e outros vetores de abuso permanecem pendentes.
- A Sprint 5 esta concluida no escopo tecnico local. Isso nao declara prontidao para preview externo, producao publica ou deploy.

## Sprint 6

Status: em andamento. O Bloco 4A foi implementado e homologado funcionalmente pelo usuário. O Bloco 3 permanece preservado. Esta formalização não inicia o Bloco 4B e não encerra a Sprint 6.

### Bloco 4A — Principais gastos do período e drill-through

A seção aparece após destino/cobertura das despesas e antes dos insights finais. Reutiliza `offenders.topNormalizedDescriptions`, `offenders.largestExpenses` e `offenders.topExpenseDays`, com até cinco itens por ranking e somente `EXPENSE`. Entradas, transferências e reversões não integram os gastos. Percentuais usam as saídas do período como base e ficam explicitamente sem base quando o total é zero; os rankings são parciais.

A identidade de descrição compartilha o helper analítico: hash válido, texto normalizado e, por último, ausência identificada. Descrições sem hash válido continuam visíveis sem navegação aproximada. O fallback visual é "Descrição não identificada"; se houver hash válido mesmo sem texto, o grupo mantém navegação exata. Não há texto financeiro nas URLs nem novo filtro opaco. Maiores saídas reutilizam `transactionId`; dias reutilizam data civil UTC e direção. O contexto da descrição é derivado do conjunto autorizado e filtrado.

O parser de direção aceita apenas valores enumerados e rejeita propriedades herdadas, valores vazios, desconhecidos e repetidos. Estados distinguem ausência de transações, período sem movimentação, movimentações excluídas dos analytics, ausência de saídas e total zero. A normalização da importação, fórmulas, dados, categorias, regras e atribuições manuais foram preservados. Não há Sankey nesta entrega.

### Homologação funcional do Bloco 4A

Evidência: aprovação manual informada pelo usuário, sem coleta de credenciais, sessões, screenshots ou dados financeiros para este registro.

- Três rankings corretos, limite de cinco posições, textos completos, valores alinhados e proporção adequada do card de descrições.
- Conta de teste com apenas um mês, filtros predefinidos, estado vazio explicativo e todos os drill-throughs disponíveis aprovados.
- Responsividade aprovada em **1024 × 768**, **768 × 1024** e **390 × 844**, sem quebra visual ou overflow horizontal no dashboard.
- Navegação por teclado aprovada; componentes do Bloco 3 preservados; nenhuma regressão funcional observada e nenhum erro JavaScript no console.
- A exceção anterior no envio do login foi causada pela ausência local de `RATE_LIMIT_HMAC_SECRET`, antes da renderização do dashboard. Foi corrigida exclusivamente no `.env` ignorado, sem alteração de código ou Git. O segredo não integra este registro; o requisito está em [Variáveis de ambiente](../README.md#variaveis-de-ambiente).

Avisos de navegador e melhorias de UX abaixo não bloqueiam esse aceite. A formalização preserva a implementação homologada.

### Gate técnico da formalização do Bloco 4A

- `npm test`: 147 testes aprovados em 16 arquivos.
- `npm run test:integration`: 83 testes aprovados em 16 arquivos, somente em `money_flow_test` no ambiente isolado `127.0.0.1:5434`, removido pelo runner ao finalizar. Nenhuma suíte utilizou o banco de desenvolvimento.
- `npm run lint`, `npx --no-install tsc --noEmit` e `npm run build`: aprovados. O build foi executado com a conexão direcionada ao ambiente de teste, sem usar o banco de desenvolvimento.
- `git diff --check`: aprovado após remover um espaço de fim de linha introduzido na documentação.

Os testes usam dados sintéticos e verificam contratos, estados, filtros, precisão do drill-through, isolamento por usuário e preservação de atribuições manuais. A homologação visual é a evidência manual do usuário acima. Nenhuma dependência, schema, migration de produto ou implementação foi alterada nesta formalização; foram acrescentados apenas registros nas fontes documentais existentes.

### Observações reservadas ao Bloco 5

- Exibir expandir/recolher somente quando existir truncamento real da descrição (`BCK-034`).
- Investigar a origem dos avisos de evento `mousewheel` não passivo no Chrome, sem assumir defeito ou trocar biblioteca antecipadamente (`BCK-035`).
- Avaliar o aviso de acessibilidade sobre formulário de senha sem campo de identificação associado (`BCK-036`).
- Reavaliar a experiência responsiva da tabela de transações no item existente `BCK-007`, preservando a evidência da entrega anterior.

São pendências para avaliação no Bloco 5, não correções autorizadas nesta formalização. Detalhes e critérios no [backlog](08-backlog.md#reconciliação-da-homologação-do-bloco-4a).

### Decisão de produto após a Sprint 6

Após a conclusão da Sprint 6 haverá uma atividade específica, inicialmente documental e de Discovery, sobre a visão atual do usuário para o dashboard (`BCK-041`). Ela analisará storytelling, hierarquia das informações, ordem das seções, distribuição e proporção dos componentes, densidade visual, experiência mobile mais compacta, perguntas respondidas por cada bloco, possíveis redundâncias e caminho entre visão executiva e detalhamento. Nenhuma alteração de layout é antecipada por esta decisão.

Filtro personalizado por datas, ordenação das transações por data/valor, preservação futura do horário quando disponível na fonte e análise cronológica de dias atípicos permanecem futuros (`BCK-037` a `BCK-040`), fora da Sprint 6. Não equivalem aos filtros predefinidos, ranking de dias, calendário ou Sankey.

## Futuro pos-MVP

- MFA.
- Recuperacao de senha.
- Login social opcional.
- OFX parser.
- Evoluções de analytics além dos contratos já entregues na Sprint 6 dependem de refinamento e autorização.
- Saldo acumulado.
- Calendario financeiro.
- Criptografia mais forte para campos sensiveis.
- Zero-knowledge/privacy mode.
- Scanner de arquivos.
- Deploy com revisao de variaveis, cookies e observabilidade.
