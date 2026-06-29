# 02 - Arquitetura

## Stack

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Docker Compose.

## Camadas

`app/` contem rotas, paginas e Server Actions do App Router.

`components/` contem componentes visuais reutilizaveis:

- `layout`: navegacao, sidebar e topo.
- `ui`: botoes, cards e elementos basicos.
- `dashboard`: blocos especificos do dashboard.

`lib/` concentra logica de dominio:

- `auth`: hash de senha, cookies, sessoes, usuario atual e audit logs.
- `db`: Prisma Client e helpers de acesso a dados.
- `parsers`: contratos, registry, normalizacao e parser CSV inicial.
- `imports`: validacao de arquivo, preview e persistencia inicial de importacao.
- `dashboard`: filtros de periodo, queries por `userId`, KPIs financeiros, series para graficos e insights basicos.
- `security`: sanitizacao, hashing, validacoes e auditoria futura.
- `insights`: area reservada para evolucoes futuras de analytics e insights.

`prisma/` guarda o schema e migrations do banco.

`docs/` guarda decisoes e documentacao de evolucao.

## Autenticacao e sessao

A Sprint 1 implementa autenticacao propria para o MVP:

- Senhas sao salvas somente como hash bcrypt.
- O token puro de sessao e gerado no servidor com `crypto`.
- O banco armazena apenas `Session.tokenHash`.
- O cookie `money_flow_session` carrega o token puro com `httpOnly`, `sameSite: "lax"`, `path: "/"`, expiracao de 30 dias e `secure` em producao.
- Logout invalida a sessao no banco e remove o cookie.
- `getCurrentUser` e `requireCurrentUser` concentram a obtencao server-side do usuario autenticado.

## Protecao de rotas

O `middleware.ts` protege:

- `/dashboard`
- `/import`
- `/transactions`
- `/categories`
- `/settings`

As paginas internas tambem validam a sessao no servidor para evitar confiar apenas na presenca do cookie.

## Modelo de dados

`User` contem `name`, `email`, `passwordHash`, timestamps e relacoes com sessoes, logs e entidades financeiras.

`Session` contem `userId`, `tokenHash`, `expiresAt`, timestamps, `userAgent` opcional e `ipHash` opcional. `tokenHash` e unico, com indices por `userId` e `expiresAt`.

`AuditLog` registra eventos importantes sem senha, token ou dados financeiros sensiveis em claro.

## Importacao CSV

A Sprint 2 implementa o fluxo CSV inicial:

- `lib/parsers/statement-parser.ts` define o contrato interno para parsers.
- `lib/parsers/parser-registry.ts` escolhe o parser compativel.
- `lib/parsers/nubank-csv-parser.ts` implementa o CSV estilo Nubank usado em `sample-data/`.
- `lib/parsers/normalization.ts` centraliza normalizacao, `fileHash`, `descriptionHash` e `dedupeKey`.
- `lib/imports/statement-import-service.ts` valida upload, gera preview e persiste importacoes.

O restante do sistema consome transacoes normalizadas, nao detalhes especificos do Nubank.

## Dashboard real

A Sprint 3 move o dashboard de mock para dados reais usando `lib/dashboard`:

- `dashboard-types.ts` define filtros, KPIs, series temporais, comparativos, insights e resumo do dashboard.
- `date-filters.ts` centraliza os filtros `imported-period`, `last-30-days`, `current-month` e `previous-month`.
- `dashboard-service.ts` recebe obrigatoriamente `userId`, busca apenas transacoes do usuario autenticado e calcula os dados agregados.

Os componentes em `components/dashboard` recebem dados prontos e fazem apenas apresentacao e formatacao visual. A logica financeira nao deve ser duplicada na UI.

Dados atuais do dashboard:

- KPIs: entradas, saidas em valor absoluto, saldo, gasto medio diario, maior saida e quantidade de transacoes.
- Graficos: evolucao financeira por dia ou mes e entradas vs saidas.
- Insights basicos: maior gasto, relacao entradas/saidas, saldo positivo ou negativo, gasto medio diario e volume de transacoes.
- Tabela de ultimas transacoes.
- Estado vazio para usuarios sem transacoes.

## Seguranca arquitetural

Todas as entidades financeiras principais usam `userId`. Qualquer query financeira deve aplicar isolamento por usuario, incluindo dashboard, importacoes, transacoes, categorias e regras futuras. Uploads sao tratados como entrada nao confiavel e nao devem ser logados com conteudo bruto.

## Evolucao prevista

Sprint 4 foca em categorias, categoria pai/filha, edicao/criacao de categorias, regras automaticas e transacoes nao categorizadas. Rate limiting, MFA, recuperacao de senha, criptografia forte, OFX e modo de privacidade avancado ficam para fases futuras.
