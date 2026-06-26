# Money Flow

**Seu GPS financeiro pessoal.**

Money Flow é um sistema web de finanças pessoais pensado para transformar extratos bancários em visão clara: KPIs, dashboards, gráficos, tabelas, categorias editáveis e insights úteis para decisões do dia a dia.

Status atual: **Sprint 0 - Fundação do projeto**.

## Problema

Extratos bancários chegam em formatos diferentes, com descrições confusas e pouca visão consolidada. Para muita gente, entender para onde o dinheiro foi exige planilhas manuais, filtros repetitivos e pouca segurança sobre os próprios números.

## Proposta

O Money Flow será uma aplicação SaaS pessoal para importar extratos, organizar transações, categorizar gastos e apresentar indicadores financeiros em uma experiência limpa, moderna e segura.

O MVP começa com CSV. OFX entra na versão seguinte. PDF não faz parte da importação automática do MVP.

## Funcionalidades planejadas do MVP

- Cadastro, login, sessão e rotas protegidas.
- Upload de CSV com validação e preview.
- Importação com deduplicação.
- Histórico de importações.
- Dashboard com entradas, saídas, saldo, gasto médio diário e evolução mensal.
- Tabela de últimas transações.
- Categorias pai/filha editáveis.
- Regras automáticas de categorização.
- Insights financeiros bem-humorados.
- Audit logs e revisão de privacidade.

## Stack

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Docker Compose.

## Arquitetura inicial

A aplicação usa o App Router do Next.js para telas públicas e internas. A camada visual está separada em `components/`, enquanto domínios futuros ficam em `lib/`:

- `lib/auth`: autenticação e sessão.
- `lib/db`: acesso ao banco e helpers Prisma.
- `lib/parsers`: parsers CSV e OFX.
- `lib/security`: validações, hashing, sanitização e auditoria.
- `lib/insights`: cálculos de KPIs e insights.

O banco é modelado com Prisma e PostgreSQL. Todas as entidades financeiras principais carregam `userId` para isolamento por usuário desde a Sprint 0.

## Como rodar localmente

Requisitos:

- Node.js.
- npm.
- Docker Desktop.

Passos:

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

A aplicação ficará em `http://localhost:3000`.

## PostgreSQL com Docker

Subir banco:

```bash
docker compose up -d postgres
```

Parar banco:

```bash
docker compose down
```

O volume `postgres_data` mantém os dados entre reinícios do container.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores locais:

```env
POSTGRES_USER=money_flow
POSTGRES_PASSWORD=change-me-in-local-env
POSTGRES_DB=money_flow
DATABASE_URL="postgresql://money_flow:change-me-in-local-env@localhost:5432/money_flow?schema=public"
NEXTAUTH_SECRET=change-me-before-auth-sprint
NEXTAUTH_URL=http://localhost:3000
```

Não use segredos reais em arquivos versionados.

## Prisma

Gerar client:

```bash
npx prisma generate
```

Criar/aplicar migration local:

```bash
npx prisma migrate dev --name init
```

Abrir Prisma Studio:

```bash
npx prisma studio
```

## Estrutura de pastas

```text
app/
components/
components/layout/
components/ui/
components/dashboard/
components/charts/
lib/
lib/auth/
lib/db/
lib/parsers/
lib/security/
lib/insights/
prisma/
docs/
sample-data/
public/
public/brand/
.agents/
.agents/skills/
```

## Roadmap por sprints

Sprint 0:

- Fundação do projeto.
- Stack.
- Docker.
- Prisma.
- Documentação.
- AGENTS.md.
- Skills/agentes.

Sprint 1:

- Cadastro.
- Login.
- Sessão.
- Rotas protegidas.
- Layout principal.

Sprint 2:

- Upload CSV.
- Validação.
- Preview.
- Importação.
- Deduplicação.
- Histórico de importações.

Sprint 3:

- Dashboard.
- KPIs.
- Filtro de datas.
- Gráficos com tooltips.
- Tabela de últimas transações.
- Insights bem-humorados.

Sprint 4:

- Categorias.
- Categoria pai/filha.
- Edição de categoria.
- Criação de categoria.
- Regras automáticas.
- Transações não categorizadas.

Sprint 5:

- Segurança.
- Audit logs.
- Revisão de privacidade.
- Documentação final do MVP.
- README enriquecido.
- Preparação para OFX.

## Segurança e privacidade

- Nunca use extratos reais no GitHub.
- Nunca versionar `.env` real.
- Nunca criar tela administrativa que exponha dados financeiros de usuários.
- Todas as consultas futuras devem isolar dados por `userId`.
- Logs não devem armazenar descrições completas de transações, documentos, contas bancárias ou valores sensíveis em texto claro sem necessidade.
- O roadmap deve considerar LGPD/GDPR.
- Futuramente, campos sensíveis devem ter criptografia e a plataforma deve evitar que operadores vejam transações individuais.

## Dados de exemplo

A pasta `sample-data/` contém apenas dados fictícios. Use esses arquivos para desenvolvimento local e demonstrações.
