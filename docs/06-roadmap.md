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

## Sprint 4 - estado por blocos

- Bloco 1: concluido.
- Bloco 2: revisado; hardening adicional do banco pendente.
- Bloco 3: concluido.
- Bloco 4: concluido.
- Bloco 5: implementado, em validacao de navegador.
- Bloco 6: nao iniciado.

- Rotulos visuais antigos de sprint foram removidos das telas publicas/importacao.
- Importacao passou a diferenciar erro esperado de CSV de erro interno.
- Contadores de importacao passaram a refletir a quantidade realmente inserida pelo banco.
- Documentada a regra de integridade de categorias: toda mutacao futura deve validar `userId` e evitar nomes duplicados entre categorias irmas, incluindo categorias raiz.

Status:

- Bloco 1: concluido; reconciliacao, hardening CSV, validacoes tecnicas e testes manuais aprovados.
- Bloco 2: modelo preparatorio existente e revisao tecnica realizada; hardening do banco depende de decisao e migration futura.
- Bloco 3: concluido; camada server-side segura para listar, criar e renomear categorias pai/filha.
- Bloco 4: concluido e validado manualmente, incluindo criacao, hierarquia, edicao, duplicidade, sessao e isolamento entre usuarios.
- Blocos 5 e 6: nao iniciados.

## Sprint 4

- Categorias.
- Categoria pai/filha.
- Edicao de categoria.
- Criacao de categoria.
- Regras automaticas.
- Transacoes nao categorizadas.

## Sprint 5

- Hardening de seguranca.
- Rate limiting.
- Revisao de privacidade.
- Documentacao final do MVP.
- Preparacao para OFX.

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
