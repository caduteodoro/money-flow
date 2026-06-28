# Money Flow

**Seu GPS financeiro pessoal.**

Money Flow e um sistema web de financas pessoais pensado para transformar extratos bancarios em visao clara: KPIs, dashboards, graficos, tabelas, categorias editaveis e insights uteis para decisoes do dia a dia.

Status atual: **Sprint 2 - Base de importacao CSV**.

## Problema

Extratos bancarios chegam em formatos diferentes, com descricoes confusas e pouca visao consolidada. Para muita gente, entender para onde o dinheiro foi exige planilhas manuais, filtros repetitivos e pouca seguranca sobre os proprios numeros.

## Proposta

O Money Flow sera uma aplicacao SaaS pessoal para importar extratos, organizar transacoes, categorizar gastos e apresentar indicadores financeiros em uma experiencia limpa, moderna e segura.

O MVP comeca com CSV. OFX entra depois do MVP inicial. PDF nao faz parte da importacao automatica do MVP.

## Funcionalidades atuais

- Cadastro de usuario com nome, e-mail, senha e confirmacao.
- Login com mensagem generica para credenciais invalidas.
- Logout com invalidacao da sessao no banco.
- Sessao propria com cookie HTTP-only.
- Token de sessao salvo no banco apenas como hash.
- Rotas internas protegidas por middleware e validacao server-side.
- Dashboard mockado exibindo nome e e-mail do usuario autenticado.
- Audit logs basicos para `USER_REGISTERED`, `USER_LOGIN`, `USER_LOGOUT` e `LOGIN_FAILED`.
- Modelagem financeira inicial com `BankAccount`, `StatementImport` e `Transaction`.
- Parser inicial para CSV estilo Nubank em `lib/parsers`.
- Validacao server-side de CSV por extensao, MIME type, tamanho, UTF-8 e estrutura.
- Preview tecnico de importacao com `fileHash`, `descriptionHash` e `dedupeKey`.
- Servico inicial para persistir importacoes e transacoes com deduplicacao por usuario.
- Rota protegida `/import` com upload CSV, preview, confirmacao, resumo e historico.

## Funcionalidades planejadas do MVP

- Upload de CSV com validacao e preview.
- Importacao com deduplicacao por `dedupeKey`.
- Historico de importacoes.
- Dashboard com entradas, saidas, saldo, gasto medio diario e evolucao mensal usando dados reais.
- Tabela de ultimas transacoes.
- Categorias pai/filha editaveis.
- Regras automaticas de categorizacao.
- Insights financeiros bem-humorados.
- Revisao final de privacidade do MVP.

## Stack

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Docker Compose.

Dependencias adicionadas ate a Sprint 2:

- `bcryptjs` para hash e verificacao de senha.
- `zod` para validacao server-side de formularios.

## Arquitetura

A aplicacao usa o App Router do Next.js para telas publicas e internas. A camada visual esta separada em `components/`, enquanto a regra de negocio fica em `lib/`:

- `lib/auth`: senha, cookie de sessao, sessao, usuario atual e audit logs.
- `lib/db`: Prisma Client.
- `lib/parsers`: contratos, registry, normalizacao e parser CSV inicial.
- `lib/imports`: validacao, preview e persistencia inicial de importacao.
- `lib/security`: validacoes, sanitizacao e controles futuros.
- `lib/insights`: KPIs e insights planejados.

Todas as entidades financeiras principais carregam `userId` para isolamento por usuario desde a modelagem inicial.

## Autenticacao no MVP

O MVP usa autenticacao propria, sem OAuth ou login social.

Fluxo:

- Cadastro normaliza e-mail com `trim/lowercase`.
- Senha e validada no servidor e salva somente como hash bcrypt.
- Login compara a senha com o hash salvo.
- Ao autenticar, o servidor gera um token aleatorio com `crypto`.
- Apenas o hash SHA-256 do token e salvo em `Session.tokenHash`.
- O token puro e enviado somente em cookie HTTP-only chamado `money_flow_session`.
- O cookie usa `httpOnly`, `sameSite: "lax"`, `path: "/"`, expiracao de 30 dias e `secure` em producao.
- Logout apaga a sessao correspondente no banco e remove o cookie.

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
npx prisma migrate dev
npm run dev
```

A aplicacao ficara em `http://localhost:3000`.

## PostgreSQL com Docker

Subir banco:

```bash
docker compose up -d postgres
```

Parar banco:

```bash
docker compose down
```

O volume `postgres_data` mantem os dados entre reinicios do container.

## Variaveis de ambiente

Copie `.env.example` para `.env` e ajuste os valores locais:

```env
POSTGRES_USER=money_flow
POSTGRES_PASSWORD=change-me-in-local-env
POSTGRES_DB=money_flow
DATABASE_URL="postgresql://money_flow:change-me-in-local-env@localhost:5432/money_flow?schema=public"
```

Nao use segredos reais em arquivos versionados.

## Prisma

Gerar client:

```bash
npx prisma generate
```

Criar/aplicar migration local:

```bash
npx prisma migrate dev
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
lib/
lib/auth/
lib/db/
lib/imports/
lib/parsers/
lib/security/
lib/insights/
prisma/
docs/
sample-data/
public/
.agents/
.agents/skills/
```

## Roadmap por sprints

Sprint 0:

- Fundacao do projeto.
- Stack.
- Docker.
- Prisma.
- Documentacao.
- AGENTS.md.
- Skills/agentes.

Sprint 1:

- Cadastro, login e logout.
- Sessao segura com cookie HTTP-only.
- Rotas protegidas.
- Isolamento inicial por usuario.
- Audit logs de autenticacao.

Sprint 2:

- Upload CSV.
- Validacao.
- Preview.
- Importacao no banco.
- Deduplicacao.
- Historico de importacoes.
- Audit log seguro de importacao.

Sprint 3:

- Dashboard com dados reais.
- KPIs.
- Filtro de datas.
- Graficos com tooltips.
- Tabela de ultimas transacoes.
- Insights bem-humorados.

Sprint 4:

- Categorias.
- Categoria pai/filha.
- Edicao e criacao de categoria.
- Regras automaticas.
- Transacoes nao categorizadas.

Sprint 5:

- Hardening de seguranca.
- Rate limiting.
- Revisao de privacidade.
- Documentacao final do MVP.
- Preparacao para OFX.

## Seguranca e privacidade

- Nunca use extratos reais no GitHub.
- Nunca versionar `.env` real.
- Nunca criar tela administrativa que exponha dados financeiros de usuarios.
- Todas as consultas financeiras devem isolar dados por `userId`.
- Logs nao devem armazenar senhas, tokens, descricoes completas de transacoes, documentos, contas bancarias ou valores sensiveis em texto claro.
- IP, quando registrado, deve ser armazenado apenas como hash.
- O roadmap deve considerar LGPD/GDPR.
- Futuramente, campos sensiveis devem ter criptografia e a plataforma deve evitar que operadores vejam transacoes individuais.

## Dados de exemplo

A pasta `sample-data/` contem apenas dados ficticios. Use esses arquivos para desenvolvimento local e demonstracoes.

## Limitacoes conhecidas da Sprint 2

- Sem recuperacao de senha.
- Sem MFA.
- Sem rate limiting.
- Sem login social.
- Dashboard ainda usa dados mockados.
- Sem categorias reais.
- Sem parser OFX.
- Sem modo zero-knowledge ou criptografia de campos financeiros.
