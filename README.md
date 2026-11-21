# Money Flow

**Seu GPS financeiro pessoal.**

Money Flow e um sistema web de financas pessoais pensado para transformar extratos bancarios em visao clara: KPIs, dashboards, graficos, tabelas, categorias editaveis e insights uteis para decisoes do dia a dia.

Status atual: **Sprint 6 em andamento; Blocos 4A e 4B implementados tecnicamente, com a homologação manual do 4B ainda pendente. A CAD-20 concluiu a preparação local para Vercel e Neon, mas preview externo, produção e deploy continuam sem autorização enquanto a CAD-19 não fechar o cadastro e a CAD-9 não repetir o gate**. Evidências e limites em [Roadmap — Sprint 6](docs/06-roadmap.md#sprint-6), na [revisão de segurança da CAD-9](docs/19-cad-9-pre-deploy-security-review.md) e na [preparação da CAD-20](docs/20-cad-20-vercel-neon-preparation.md).

## Problema

Extratos bancarios chegam em formatos diferentes, com descricoes confusas e pouca visao consolidada. Para muita gente, entender para onde o dinheiro foi exige planilhas manuais, filtros repetitivos e pouca seguranca sobre os proprios numeros.

## Proposta

O Money Flow sera uma aplicacao SaaS pessoal para importar extratos, organizar transacoes, categorizar gastos e apresentar indicadores financeiros em uma experiencia limpa, moderna e segura.

O MVP comeca com CSV. OFX entra depois do MVP inicial. PDF nao faz parte da importacao automatica do MVP.

## Funcionalidades atuais

- Cadastro de usuario com resposta neutra para e-mail novo ou existente, sem login automatico.
- Login com mensagem generica para credenciais invalidas.
- Logout com invalidacao confirmada somente da sessao atual antes de limpar o cookie.
- Sessao propria com cookie HTTP-only.
- Token de sessao salvo no banco apenas como hash.
- Rotas internas protegidas por middleware e validacao server-side.
- Audit logs basicos para `USER_REGISTERED`, `USER_LOGIN`, `USER_LOGOUT` e `LOGIN_FAILED`.
- Modelagem financeira inicial com `BankAccount`, `StatementImport` e `Transaction`.
- Parser inicial para CSV estilo Nubank em `lib/parsers`.
- Validacao server-side de CSV por extensao, MIME type, tamanho, UTF-8 e estrutura.
- Preview tecnico de importacao com `fileHash`, `descriptionHash` e `dedupeKey`.
- Servico inicial para persistir importacoes e transacoes com deduplicacao por usuario.
- Rota protegida `/import` com upload CSV, preview e confirmacao na mesma tela.
- Historico de importacoes com mes ou periodo do extrato.
- Dashboard real baseado nas transacoes importadas pelo usuario autenticado.
- KPIs financeiros calculados: entradas, saídas, resultado do período, gasto médio diário, maior saída e quantidade de transações; resultado não representa saldo bancário real.
- Filtros de periodo: todo o periodo importado, ultimos 30 dias, mes atual e mes anterior.
- Exibicao do intervalo real considerado pelo filtro ativo.
- Cockpit com evolução financeira, comparação de entradas e saídas, destino por categoria e cobertura de categorização.
- Seção "Principais gastos do período": até cinco descrições, maiores saídas e dias de maior gasto, considerando somente `EXPENSE`.
- Drill-through por hash válido de descrição, transação ou dia UTC; grupos sem hash válido permanecem visíveis sem link aproximado.
- Insights basicos calculados localmente, sem IA externa.
- Tabela de ultimas transacoes.
- Estados distintos para ausência de transações, período sem movimento, movimentações excluídas dos analytics, ausência de saídas e saídas de valor zero.
- Importacao com mensagens controladas para erros esperados de CSV e contadores baseados no que o banco realmente inseriu.
- UI polish e ajuste responsivo dos KPIs para zoom 100%.
- Rota protegida `/transactions` para listagem e categorizacao manual com categorias do proprio usuario.
- Identificacao e filtro de transacoes sem categoria.
- Regras v1 por texto contido na descricao normalizada, aplicadas explicitamente pelo usuario somente a transacoes sem categoria.
- Categorias pai/filha com criacao e edicao na tela protegida `/categories`.
- Categorizacao manual e identificacao de transacoes sem categoria.
- Regras automaticas v1 com criacao, listagem, ativacao, desativacao e prioridade.
- Protecao por `userId` entre categorias, regras e transacoes.
- FKs compostas impedem no PostgreSQL associacoes entre usuarios nas seis relacoes financeiras e de categorias existentes.
- Chave comparativa canonica e indices unicos impedem categorias equivalentes no mesmo nivel, inclusive sob concorrencia.
- Suite de integracao para isolamento multi-tenant de categorias, regras e transacoes, com PostgreSQL descartavel.
- Rota protegida `/settings` com exclusao imediata e transacional da propria conta mediante senha atual e frase de confirmacao exata.
- Exclusao de todas as sessoes, dados financeiros, categorias, regras, logs e buckets inequivocamente vinculaveis, sem soft delete, recibo ou tombstone.
- Matriz consolidada de `SEC-001` a `SEC-013`, com fronteiras distintas para uso local, preview restrito e producao publica.
- Logging Prisma por eventos tecnicos fechados, sem mensagem, metadados, stack ou argumentos brutos e com correlacao aleatoria nao pessoal.

## Funcionalidades planejadas do MVP

- Execucao automatica de regras apos importacao.
- Politicas operacionais futuras para retencao de audit logs e expurgo de backups.
- Blocos restantes da Sprint 6, conforme o roadmap e autorização específica.
- Revisao final de privacidade do MVP.

Os modelos `Category` e `CategoryRule` sustentam a rota protegida `/categories`, que permite gerenciar categorias e regras v1. A categorizacao manual e as regras automaticas foram validadas manualmente. A aplicacao das regras depende de acao explicita; autoexecucao apos importacao permanece fora do escopo.

O Bloco 1 foi validado por regressao tecnica e pelos testes manuais de autenticacao, filtros, estados vazios, responsividade e importacao CSV ficticia.

## Stack

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Docker Compose.

Dependencias adicionadas ate a Sprint 3:

- `bcryptjs` para hash e verificacao de senha.
- `zod` para validacao server-side de formularios.

## Arquitetura

A aplicacao usa o App Router do Next.js para telas publicas e internas. A camada visual esta separada em `components/`, enquanto a regra de negocio fica em `lib/`:

- `lib/auth`: senha, cookie de sessao, sessao, usuario atual e audit logs.
- `lib/db`: Prisma Client.
- `lib/parsers`: contratos, registry, normalizacao e parser CSV inicial.
- `lib/imports`: validacao, preview e persistencia inicial de importacao.
- `lib/dashboard`: filtros de periodo, queries por `userId`, KPIs, series para graficos e insights basicos.
- `lib/categories`: tipos, validacao Zod, erros controlados e servico server-side de categorias.
- `lib/security`: validacoes, sanitizacao e controles futuros.
- `lib/insights`: area reservada para evolucoes futuras de insights.

Os componentes em `components/dashboard` recebem dados prontos. A regra financeira e as queries ficam fora da UI, concentradas em `lib/dashboard`.

Todas as entidades financeiras principais carregam `userId` para isolamento por usuario desde a modelagem inicial.

O dashboard tambem informa se o usuario ja possui transacoes importadas em qualquer periodo. Isso evita confundir "nenhum dado importado" com "nenhuma transacao no filtro atual".

## Autenticacao no MVP

O MVP usa autenticacao propria, sem OAuth ou login social.

Fluxo:

- Cadastro normaliza e-mail com `trim/lowercase`, tenta a criacao atomicamente e usa a mesma mensagem e destino publico para e-mail novo ou existente.
- Cadastro nao cria sessao nem cookie; somente um usuario realmente persistido gera `USER_REGISTERED`.
- Depois do cadastro, o usuario entra pelo fluxo normal de login.
- Senha e validada no servidor e salva somente como hash bcrypt.
- Login compara a senha com o hash salvo.
- Ao autenticar, o servidor gera um token aleatorio com `crypto`.
- Apenas o hash SHA-256 do token e salvo em `Session.tokenHash`.
- O token puro e enviado somente em cookie HTTP-only chamado `money_flow_session`.
- O cookie usa `httpOnly`, `sameSite: "lax"`, `path: "/"`, expiracao de 30 dias e `secure` em producao.
- Logout apaga somente a sessao correspondente ao cookie atual e limpa o cookie apenas depois da revogacao ou da confirmacao de que a sessao ja nao existe.
- Sessoes simultaneas continuam permitidas e mantem validade fixa de 30 dias, sem rotacao ou renovacao deslizante.

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
DIRECT_URL="postgresql://money_flow:change-me-in-local-env@localhost:5432/money_flow?schema=public"
RATE_LIMIT_HMAC_SECRET="replace-with-at-least-32-random-characters"
```

Nao use segredos reais em arquivos versionados.

Login e cadastro exigem `RATE_LIMIT_HMAC_SECRET` no ambiente local. Gere um segredo exclusivo com fonte criptograficamente segura (pelo menos 32 bytes aleatórios; por exemplo, representados em 64 caracteres hexadecimais) e grave somente no `.env` ignorado. O valor de exemplo não é um segredo utilizável. Não exiba o valor em terminal, logs, clipboard ou documentos. Depois de configurar, reinicie o servidor. A validação relevante é o carregamento pelo runtime; um build aprovado não comprova a presença dessa variável.

Localmente, `DATABASE_URL` e `DIRECT_URL` apontam para a mesma instância PostgreSQL direta. Na Vercel com Neon, `DATABASE_URL` deve usar o endpoint pooled e `DIRECT_URL` o endpoint direto do mesmo banco. As três variáveis são segredos e devem ser configuradas separadamente por ambiente; valores reais nunca entram no Git.

## Prisma

Gerar client:

```bash
npx prisma generate
```

Criar/aplicar migration local:

```bash
npx prisma migrate dev
```

Aplicar migrations versionadas em ambiente hospedado, somente depois de validar o destino:

```bash
npm run deploy:check
npx prisma migrate deploy
```

O build preparado para a Vercel executa validação, `prisma generate`, `prisma migrate deploy` e `next build` por meio de `npm run vercel-build`. Preview e Production devem usar bancos ou branches Neon distintos. Esta preparação não autoriza deploy; o procedimento completo e os limites estão em [CAD-20 — Vercel e Neon](docs/20-cad-20-vercel-neon-preparation.md).

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
lib/dashboard/
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
- Intervalo real considerado pelo filtro ativo.
- Graficos simples.
- Tabela de ultimas transacoes.
- Insights basicos calculados localmente.
- UI polish e responsividade em zoom 100%.

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
- A decisão pré-deploy atual está documentada na [CAD-9](docs/19-cad-9-pre-deploy-security-review.md); ela não autoriza preview externo nem produção pública.

## Dados de exemplo

A pasta `sample-data/` contem apenas dados ficticios. Use esses arquivos para desenvolvimento local e demonstracoes.

## Limitacoes conhecidas atuais

- Sem recuperacao de senha.
- Sem MFA.
- Rate limiting persistente por identidade implementado no login e no cadastro; ainda sem proteção por IP ou borda confiável.
- Sem login social.
- `SEC-008` permanece parcialmente mitigado: as atualizações compatíveis removeram os advisories diretamente corrigíveis, mas o PostCSS interno do Next 15.5.29 permanece no grafo; qualquer CSS não confiável ou exposição externa exige reavaliação.
- `SEC-009` permanece parcialmente mitigado e depende de validacao atras do proxy real antes de preview externo.
- `SEC-012` recebeu headers explícitos e política `no-store` para rotas protegidas; TLS, HSTS e os headers finais ainda dependem de validação no deployment.
- Sem autoexecucao de regras na importacao.
- Grupos de descrição sem hash válido não têm drill-through; o ranking não representa necessariamente todas as saídas. Observações não bloqueantes da homologação estão no [backlog](docs/08-backlog.md#reconciliação-da-homologação-do-bloco-4a).
- A integridade relacional multiusuario e a unicidade estrutural de categorias estao protegidas no banco; retencao/exclusao continuam pendentes.
- Sem parser OFX.
- Sem importacao automatica de PDF.
- Sem Open Finance.
- Sem PWA.
- Sem IA externa.
- Sem modo zero-knowledge ou criptografia de campos financeiros.
- A suíte automatizada cobre a sentinela do banco, FKs compostas multiusuário, autorização de categorias, regras e transações, preservação de `USER_MANUAL`, rate limiting, autenticação e sessões com PostgreSQL descartável. Dashboard e drill-through também possuem testes de isolamento, filtros e precisão; isso não declara cobertura integral de todos os fluxos do produto.
- Nao ha logout global, gerenciamento de dispositivos, rotacao de token ou renovacao deslizante.
- Algumas migrations antigas assumem banco local sem dados preexistentes.

## Fora do escopo atual

- Categorias e regras automaticas entram na Sprint 4.
- OFX fica para uma fase posterior ao CSV do MVP.
- PDF nao entra como importacao automatica no MVP.
- Open Finance, PWA e IA externa continuam fora do escopo atual.
