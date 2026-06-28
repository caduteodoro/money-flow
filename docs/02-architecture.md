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
- `security`: sanitizacao, hashing, validacoes e auditoria futura.
- `insights`: KPIs, series temporais, recorrencia e insights planejados.

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

A Sprint 2 inicia a base de importacao sem tela visual completa:

- `lib/parsers/statement-parser.ts` define o contrato interno para parsers.
- `lib/parsers/parser-registry.ts` escolhe o parser compativel.
- `lib/parsers/nubank-csv-parser.ts` implementa o CSV estilo Nubank usado em `sample-data/`.
- `lib/parsers/normalization.ts` centraliza normalizacao, `fileHash`, `descriptionHash` e `dedupeKey`.
- `lib/imports/statement-import-service.ts` valida upload, gera preview e persiste importacoes.

O restante do sistema consome transacoes normalizadas, nao detalhes especificos do Nubank.

## Seguranca arquitetural

Todas as entidades financeiras principais usam `userId`. Qualquer query futura deve aplicar isolamento por usuario. Uploads serao tratados como entrada nao confiavel e nao devem ser logados com conteudo bruto.

## Evolucao prevista

Na Sprint 2 entram a base de upload, parsing CSV, preview tecnico, importacao e deduplicacao. Na Sprint 3 o dashboard passa a usar dados reais. Rate limiting, MFA, recuperacao de senha, criptografia forte e modo de privacidade avancado ficam para fases futuras.
