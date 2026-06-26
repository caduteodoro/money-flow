# 02 - Arquitetura

## Stack

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Docker Compose.

## Camadas

`app/` contém rotas e layouts do App Router.

`components/` contém componentes visuais reutilizáveis:

- `layout`: navegação, sidebar e topo.
- `ui`: botões, cards e elementos básicos.
- `dashboard`: blocos específicos do dashboard.
- `charts`: futuros componentes de gráficos.

`lib/` concentra lógica de domínio:

- `auth`: autenticação, sessão e rotas protegidas.
- `db`: Prisma Client e helpers de acesso a dados.
- `parsers`: CSV no MVP e OFX na próxima versão.
- `security`: sanitização, hashing, validações e auditoria.
- `insights`: KPIs, séries temporais, recorrência e insights.

`prisma/` guarda o schema do banco.

`docs/` guarda decisões e documentação de evolução.

## Segurança arquitetural

Todas as entidades financeiras principais usam `userId`. Qualquer query futura deve aplicar isolamento por usuário. Uploads serão tratados como entrada não confiável e não devem ser logados com conteúdo bruto.

## Evolução prevista

Na Sprint 1 entram autenticação, sessão e rotas protegidas. Na Sprint 2 entram upload, parsing CSV e deduplicação. Na Sprint 3 o dashboard passa a usar dados reais.
