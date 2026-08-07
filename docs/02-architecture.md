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
- `categories`: tipos, normalizacao, validacao Zod, erros controlados, listagem hierarquica e mutacoes seguras.
- `transactions`: listagem limitada para categorizacao e atribuicao manual segura de categoria.
- `category-rules`: validacao, listagem, criacao, ativacao e aplicacao explicita de regras v1.
- `security`: núcleo de rate limiting, composição de políticas, HMAC e adapter PostgreSQL.
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

Essa lista expressa a politica de protecao. A rota `/categories` possui uma pagina server-side autenticada.

As paginas internas tambem validam a sessao no servidor para evitar confiar apenas na presenca do cookie.

## Modelo de dados

`User` contem `name`, `email`, `passwordHash`, timestamps e relacoes com sessoes, logs e entidades financeiras.

`Session` contem `userId`, `tokenHash`, `expiresAt`, timestamps, `userAgent` opcional e `ipHash` opcional. `tokenHash` e unico, com indices por `userId` e `expiresAt`.

`AuditLog` registra eventos importantes sem senha, token ou dados financeiros sensiveis em claro.

`RateLimitBucket` persiste contadores de janelas fixas por `scope`, digest HMAC e início da janela, sem relação com `User` nem identificador bruto.

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
- O resumo do dashboard tambem informa se o usuario tem transacoes importadas em qualquer periodo, permitindo diferenciar primeiro uso de filtro vazio.

Os componentes em `components/dashboard` recebem dados prontos e fazem apenas apresentacao e formatacao visual. A logica financeira nao deve ser duplicada na UI.

O Bloco 1 da Sprint 4 reconcilia o rotulo "Todo o periodo importado", a exibicao de intervalo, estados vazios distintos e a tabela responsiva sem alterar as regras financeiras.

Dados atuais do dashboard:

- KPIs: entradas, saidas em valor absoluto, saldo, gasto medio diario, maior saida e quantidade de transacoes.
- Graficos: evolucao financeira por dia ou mes e entradas vs saidas.
- Insights basicos: maior gasto, relacao entradas/saidas, saldo positivo ou negativo, gasto medio diario e volume de transacoes.
- Tabela de ultimas transacoes.
- Intervalo real considerado pelo filtro ativo.
- Estado vazio para usuarios sem transacoes.
- Estado especifico para filtros sem transacoes, sem sugerir uma nova importacao como se fosse primeiro uso.

## Seguranca arquitetural

Todas as entidades financeiras principais usam `userId`. Qualquer query financeira deve aplicar isolamento por usuario, incluindo dashboard, importacoes, transacoes, categorias e regras futuras. Uploads sao tratados como entrada nao confiavel e nao devem ser logados com conteudo bruto.

Server Actions devem expor ao cliente apenas erros esperados e controlados. Erros internos de banco, infraestrutura ou runtime devem cair em mensagens genericas.

O Prisma permanece restrito a codigo server-side. `lib/categories/` exige `userId`, busca recursos pelo par logico `id + userId`, normaliza nomes e monta a arvore pai/filha em memoria a partir de uma unica consulta. Componentes client-side nao importam o servico nem o Prisma.

A hierarquia v1 aceita somente categorias raiz e filhas. Criacao de netas, troca de pai, exclusao, categorizacao de transacoes e regras automaticas permanecem fora deste bloco.

`app/transactions` implementa a rota protegida de categorizacao manual. A pagina recebe dados preparados pelo servico server-side, e a Server Action forma a fronteira entre a UI e o dominio. Antes da mutacao, o servico revalida separadamente transacao e categoria pelo par `id + userId`; o update tambem inclui `userId`.

`app/categories` contem a pagina protegida e Server Actions. `components/categories` contem a apresentacao e os formularios interativos. As Actions obtêm `userId` exclusivamente por `requireCurrentUser`, encaminham somente entradas necessarias ao servico e revalidam `/categories` apos sucesso.

As regras automaticas v1 tambem ficam em `/categories`. Actions autenticadas separam UI e dominio. A precedencia e `priority` crescente, depois `createdAt` e `id` crescentes. A primeira regra cujo texto normalizado esteja contido em `normalizedDescription` vence. A aplicacao consulta e atualiza somente transacoes com `categoryId = NULL`; o filtro final preserva categorizacao manual concorrente. A v1 prioriza clareza com updates seguros por transacao, sem SQL bruto ou autoexecucao na importacao.

O modulo `lib/category-rules` concentra o dominio e o acesso Prisma. As Server Actions de regras obtêm o usuario pela sessao, acionam o servico e revalidam apenas as rotas afetadas. A validacao manual final confirmou criacao, ativacao, precedencia, isolamento e preservacao de categorias manuais.

### Rate limiting

`lib/security/rate-limit` mantém o núcleo independente de framework, a derivação HMAC-SHA-256, a composição de políticas e o adapter PostgreSQL. O consumo usa um `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE count < limit` parametrizado, preservando o limite sob concorrência sem sequência `SELECT → UPDATE`.

Login e cadastro derivam a chave do e-mail normalizado, mas usam scopes independentes. A action consulta o limiter antes de usuário, bcrypt ou persistência de autenticação. Login válido remove somente seus buckets de login; cadastro não executa reset. Somente indisponibilidade reconhecida do storage gera `fail-open`; erros de entrada, configuração e programação propagam.

Não existem buckets por IP, confiança em headers encaminhados, HTTP 429 ou proteção de borda implementada. Essas camadas futuras não substituem autenticação, autorização ou isolamento por `userId`.

## Evolucao prevista

Sprint 4 entregou categorias, categoria pai/filha, edição/criação, regras automáticas e transações não categorizadas. O Bloco 3 da Sprint 5 implementou rate limiting por identidade para login e cadastro. MFA, recuperação de senha, proteção por origem/borda, criptografia forte, OFX e modo de privacidade avançado permanecem futuros.
