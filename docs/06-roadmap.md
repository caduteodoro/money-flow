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
- Bloco 7B: planejado e nao iniciado; deve decidir os gates finais sem presumir validacao operacional ou autorizacao de uso externo.
- O rate limiting persistente atual cobre login e cadastro por identidade; protecao por origem/borda e outros vetores de abuso permanecem pendentes.
- A Sprint 5 permanece aberta. Integracao, Bloco 7B e validacoes de pre-producao nao estao concluidos.

## Futuro pos-MVP

- MFA.
- Recuperacao de senha.
- Login social opcional.
- OFX parser.
- Gastos por categoria.
- Top estabelecimentos/descricoes.
- Ranking de maiores saidas.
- Saldo acumulado.
- Calendario financeiro.
- Ofensores do mes.
- Criptografia mais forte para campos sensiveis.
- Zero-knowledge/privacy mode.
- Scanner de arquivos.
- Deploy com revisao de variaveis, cookies e observabilidade.
