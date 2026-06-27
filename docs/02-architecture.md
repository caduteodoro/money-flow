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
- `parsers`: CSV no MVP e OFX depois do MVP inicial.
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

## Seguranca arquitetural

Todas as entidades financeiras principais usam `userId`. Qualquer query futura deve aplicar isolamento por usuario. Uploads serao tratados como entrada nao confiavel e nao devem ser logados com conteudo bruto.

## Evolucao prevista

Na Sprint 2 entram upload, parsing CSV e deduplicacao. Na Sprint 3 o dashboard passa a usar dados reais. Rate limiting, MFA, recuperacao de senha, criptografia forte e modo de privacidade avancado ficam para fases futuras.
