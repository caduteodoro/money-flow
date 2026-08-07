# 05 - Seguranca e privacidade

O threat model da auditoria da Sprint 5 está registrado em [`docs/11-security-threat-model.md`](11-security-threat-model.md). O documento separa controles comprovados, riscos preliminares e pontos ainda não verificados; sua publicação não significa que os riscos já foram corrigidos.

A fundacao de testes automatizados de isolamento do Bloco 2 e suas limitacoes estao registradas em [`docs/12-sprint-5-security-tests-foundation.md`](12-sprint-5-security-tests-foundation.md).

## Principios

- Privacidade por padrao.
- Menor exposicao possivel de dados financeiros.
- Isolamento rigoroso por `userId`.
- Logs uteis sem conteudo sensivel em claro.
- Evolucao considerando LGPD/GDPR.

## Regras atuais

- `.env` real nao deve ser versionado.
- Extratos reais nao devem entrar no GitHub.
- Apenas `sample-data/` ficticio deve ser usado no repositorio e em demonstracoes publicas.
- Nao criar telas administrativas para visualizar transacoes dos usuarios.
- Toda query financeira deve filtrar por `userId`.
- Descricoes de transacoes, CPF, dados bancarios, nomes completos e valores sensiveis nao devem ser logados sem necessidade.
- Senhas e tokens de sessao nunca devem ser registrados em logs.

## Autenticacao da Sprint 1

- Senhas sao validadas no servidor e armazenadas com hash bcrypt.
- E-mails sao normalizados com `trim/lowercase`.
- Cadastro novo e e-mail duplicado terminam no mesmo login com mensagem neutra; cadastro nao cria sessao nem cookie.
- Somente usuario realmente criado registra `USER_REGISTERED`; a duplicidade de `User.email` nao altera o registro existente.
- Erros de login usam mensagem generica para nao revelar se o e-mail existe.
- Login invalido registra `LOGIN_FAILED` com hash do e-mail e sem senha.
- Sessao usa token aleatorio criado no servidor.
- Apenas o hash do token e salvo em `Session.tokenHash`.
- O token puro fica somente no cookie HTTP-only.
- Logout remove somente a sessao atual e limpa o cookie depois da revogacao ou da confirmacao de que o registro ja nao existe. Erros inesperados de persistencia propagam sem evento falso de sucesso.

## Cookies de sessao

O cookie `money_flow_session` usa:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` em producao
- `path: "/"`
- expiracao de 30 dias

## Rate limiting de autenticação

Login e cadastro aplicam janelas fixas persistidas no PostgreSQL antes da consulta ou operação bcrypt. A identidade é o e-mail já normalizado pela validação canônica e transformado em HMAC-SHA-256 com `RATE_LIMIT_HMAC_SECRET`; os buckets não armazenam o e-mail bruto.

- Login: 5 tentativas por minuto e 10 tentativas por 15 minutos.
- Cadastro: 3 tentativas por 15 minutos e 5 tentativas por hora.
- Qualquer janela bloqueada impede a operação e produz mensagem genérica com `retryAfterSeconds`.
- Somente indisponibilidade reconhecida do storage permite `fail-open`; erros de configuração e programação continuam propagados.
- Login válido remove apenas seus próprios buckets de login.
- Cadastro válido não remove seus buckets.
- Não há buckets por IP, leitura de headers encaminhados ou proteção completa contra cadastro automatizado com múltiplos e-mails.

Como camada futura e complementar, avaliar Cloudflare Access, WAF/rate limiting, Turnstile e proteção do servidor de origem. Esses recursos não substituem autenticação, autorização por `userId`, validações server-side ou rate limiting por identidade dentro da aplicação.

### Checkpoint do Bloco 3 da Sprint 5

O Bloco 3 parte de `10b78ba` e compreende os commits `6ca1890` (fundação persistente), `a5d7940` (login) e `c82fcf1` (cadastro). A implementação acumulada inclui uma migration, núcleo independente de framework, HMAC, composição de políticas, adapter PostgreSQL, integração nas duas Server Actions e testes unitários/integração.

| Fluxo | Rajada curta | Insistência prolongada | Reset após sucesso |
|---|---:|---:|---|
| Login | 5 por 1 minuto | 10 por 15 minutos | Sim, somente buckets de login da identidade |
| Cadastro | 3 por 15 minutos | 5 por 1 hora | Não |

Matriz de regressão do checkpoint:

| Área | Arquivo e cenário | Tipo | Resultado | Lacuna |
|---|---|---|---|---|
| Validação estrutural | `login-rate-limit.test.ts` e `register-rate-limit.test.ts`: formulário inválido não consome | PostgreSQL | PASS | Nenhuma |
| Normalização | mesmas suítes: caixa e espaços convergem para a mesma identidade | PostgreSQL | PASS | Nenhuma |
| Privacidade | `rate-limit-key.test.ts` e suítes de integração: HMAC e ausência de e-mail/segredo | Unitário/PostgreSQL | PASS | Nenhuma |
| Janela curta | `login-rate-limit.test.ts` e `register-rate-limit.test.ts`: limite, bloqueio e recuperação | Unitário/PostgreSQL | PASS | Nenhuma |
| Janela prolongada | mesmas suítes: limite, bloqueio e recuperação | Unitário/PostgreSQL | PASS | Nenhuma |
| Composição | suítes unitárias de login/cadastro: qualquer bloqueio vence | Unitário | PASS | Nenhuma |
| Retry | `login-rate-limit.test.ts`: maior espera; integrações: esperas reais das actions | Unitário/PostgreSQL | PASS | Nenhuma |
| Fail-open | `rate-limit-core.test.ts` e `rate-limit-postgres.test.ts`: indisponível permite, inesperado propaga | Unitário/PostgreSQL | PASS | Nenhuma |
| Configuração | `rate-limit-key.test.ts` e `rate-limit-postgres.test.ts`: segredo/URL inválidos propagam | Unitário/PostgreSQL | PASS | Nenhuma |
| Login | `login-rate-limit.test.ts`: sucesso limpa somente buckets próprios de login | PostgreSQL | PASS | Nenhuma |
| Cadastro | `register-rate-limit.test.ts`: sucesso e duplicidade preservam buckets | PostgreSQL | PASS | Nenhuma |
| Isolamento | suítes de políticas/actions: scopes, identidades e reset independentes | Unitário/PostgreSQL | PASS | Nenhuma |
| Concorrência | `rate-limit-postgres.test.ts`: 10 permissões em 25 consumos concorrentes | PostgreSQL | PASS | Nenhuma |
| Auditoria | suítes de action/integração: bloqueios sem evento; sucessos preservados | Unitário/PostgreSQL | PASS | Nenhuma |
| Sessão | integrações de login/cadastro: sessão e cookie após sucesso | PostgreSQL | PASS | Nenhuma |
| PostgreSQL | sentinela e `rate-limit-postgres.test.ts`: migration, persistência, client e expiração | PostgreSQL | PASS | Nenhuma |
| Regressão geral | suíte completa, lint, TypeScript e build | Automatizada | PASS | Nenhuma material |

O `SEC-001` está **mitigado parcialmente**: login e cadastro possuem defesa interna por identidade, mas não há proteção por origem ou borda e abuso distribuído/múltiplos e-mails continua possível. O `SEC-004` permanece pendente. O `BCK-031` permanece como ideia em discovery e Cloudflare não está implementada.

Achados do checkpoint:

- **MÉDIO, corrigido no Bloco 3:** a classificação inicial aceitava qualquer `PrismaClientInitializationError` como indisponibilidade, podendo converter erro de configuração em `fail-open`. O adapter passou a aceitar somente falhas transitórias explicitamente reconhecidas e o caso P1001 sem código emitido pelo Prisma 5; URL inválida agora propaga e possui teste de regressão.
- **INFORMATIVO, risco residual:** a proteção é somente por identidade. Ataques distribuídos, múltiplos e-mails e operações fora de login/cadastro permanecem possíveis; relação com `SEC-001` e `BCK-031`.
- **INFORMATIVO, risco residual:** não há observabilidade operacional específica para liberações por indisponibilidade ou falhas auxiliares de cleanup. Um subsistema novo ficou fora do escopo deste bloco.

### Checkpoint do Bloco 4 da Sprint 5

A Atividade 4.1 parte de `c44792b` na branch `feature/sprint-5-bloco-4-auth-session-hardening`. O cadastro passou a tratar exclusivamente a unique constraint de `User.email` como caso neutro, sem consulta previa de existencia. E-mail novo e duplicado redirecionam para `/login?registration=submitted`, onde a mesma mensagem publica e exibida. Nenhum cadastro cria sessao ou cookie; somente a criacao real persiste o usuario e registra `USER_REGISTERED`. O usuario novo autentica depois pelo login normal.

O limiter do Bloco 3 foi preservado: validacao estrutural ocorre antes do consumo; a identidade normalizada e limitada antes de bcrypt e banco; as janelas continuam em 3/15 minutos e 5/1 hora; sucesso ou duplicidade nao limpam buckets; bloqueio nao cria usuario, sessao, cookie ou auditoria. Scopes, HMAC, `retryAfterSeconds`, ausencia de IP e `fail-open` restrito nao mudaram.

No logout, somente `P2025` e tratado como ausencia idempotente. A sessao continua localizada pelo hash do token atual e nenhuma query ampla revoga outras sessoes. Erros inesperados de persistencia propagam antes da limpeza do cookie, do evento `USER_LOGOUT` e do redirect. Sessoes simultaneas, token aleatorio, hash SHA-256, atributos do cookie e validade fixa de 30 dias foram preservados; logout global, rotacao e renovacao deslizante nao foram implementados.

Arquivos de producao alterados: `app/register/actions.ts`, `app/login/page.tsx` e `lib/auth/session.ts`. Os testes foram atualizados em `tests/unit/register-action-rate-limit.test.ts` e `tests/integration/register-rate-limit.test.ts`; as lacunas de revogacao e sessoes foram cobertas em `tests/unit/session-invalidation.test.ts`, `tests/unit/logout-action.test.ts` e `tests/integration/session-logout.test.ts`. README, arquitetura, modelo de dados, seguranca, roadmap, threat model e a nota historica da fundacao de testes foram atualizados incrementalmente.

Matriz de regressao do checkpoint:

| Area | Evidencia | Tipo | Resultado |
|---|---|---|---|
| Cadastro estrutural e limiter | formulario invalido, normalizacao, janelas, bloqueio, retry e buckets preservados | Unitario/PostgreSQL | PASS |
| Equivalencia publica | novo e duplicado no mesmo destino, sem erro de campo, sessao ou cookie | Unitario/PostgreSQL | PASS |
| Persistencia e auditoria | novo cria um usuario e `USER_REGISTERED`; duplicado preserva o registro e nao cria evento | PostgreSQL | PASS |
| Concorrencia | duas tentativas simultaneas criam no maximo um usuario e convergem ao mesmo destino | PostgreSQL | PASS |
| Erros inesperados | outra constraint e outros erros Prisma propagam | Unitario | PASS |
| Login posterior | usuario novo autentica pelo fluxo normal, que cria sessao e cookie | PostgreSQL | PASS |
| Logout | sessao atual removida; sessao paralela preservada; ausencia idempotente | Unitario/PostgreSQL | PASS |
| Falha de revogacao | erro de persistencia nao limpa cookie, nao audita e nao redireciona | Unitario | PASS |
| Token, cookie e expiracao | somente hash persistido; flags preservadas; validade fixa de 30 dias; expirada rejeitada | PostgreSQL | PASS |
| Regressao | 44 testes unitarios e 41 de integracao; lint, TypeScript, Prisma e build | Automatizada/PostgreSQL | PASS |

O `SEC-004` esta **MITIGADO**, nao encerrado: o canal direto por texto, estrutura, destino, sessao e cookie foi removido. Permanecem diferencas internas inevitaveis de persistencia/auditoria, potencial canal temporal nao medido e inferencia possivel por tentativa posterior de login. O `SEC-001` permanece mitigado parcialmente. O `SEC-009` continua mitigado pelo framework no ambiente local e pendente de validacao no proxy/deployment. Cloudflare permanece planejada em `BCK-031`, sem implementacao. A Sprint 5 continuava aberta e, naquele checkpoint, o Bloco 5 ainda nao havia sido iniciado.

Revisao de seguranca: nenhum achado bloqueante, alto ou medio foi introduzido. A falha silenciosa de revogacao foi corrigida; como riscos baixos/informativos permanecem a gestao limitada de sessoes antigas (`SEC-011`), a possibilidade de enumeracao por tempo ou login posterior (`SEC-004`) e a protecao de abuso apenas por identidade (`SEC-001`).

### Atividade 5.1 - integridade relacional multiusuario

O `SEC-005` foi mitigado com FKs compostas que repetem `userId` nos dois lados de seis relacoes: hierarquia de categorias, regra/categoria, tres destinos opcionais de transacao e conta bancaria da importacao. `Category`, `BankAccount` e `StatementImport` receberam chaves candidatas `id + userId` para sustentar as referencias.

As cinco relacoes opcionais usam `ON DELETE NO ACTION`; o banco nao tenta zerar o `userId` da origem. A relacao obrigatoria `CategoryRule(categoryId, userId) -> Category(id, userId)` preserva `ON DELETE CASCADE`. Exclusoes funcionais futuras dos destinos opcionais deverao desvincular referencias explicitamente e pelo mesmo usuario antes de remover o destino.

O diagnostico `READ ONLY` no desenvolvimento retornou zero orfaos e zero associacoes cruzadas nas seis relacoes. As duas migrations foram validadas com Prisma 5.22 e PostgreSQL 16, sem drift. Testes diretos confirmaram relacoes validas, opcionais nulos, rejeicao `P2003` das seis tentativas cruzadas, cinco bloqueios `NO ACTION`, cascata restrita ao mesmo usuario, rollback transacional e exclusao direta de um usuario completo sem alterar outro tenant. O ensaio de rollback restaurou primeiro as FKs simples e removeu depois os indices compostos.

`SEC-006`, `BCK-016` e `SEC-007` permanecem pendentes e fora desta entrega. Os filtros `id + userId` da aplicacao continuam obrigatorios para autorizacao e respostas publicas seguras; as constraints nao os substituem.

## Audit logs

Eventos atuais:

- `USER_REGISTERED`
- `USER_LOGIN`
- `USER_LOGOUT`
- `LOGIN_FAILED`
- `STATEMENT_IMPORTED`

Metadados permitidos nesta fase:

- Hash de e-mail em falhas de login.
- Hash de IP quando disponivel.
- Hash de user-agent quando disponivel.
- Tipo de evento e timestamps.
- Metadados agregados de importacao, como `fileHash`, periodo do extrato, tamanho do arquivo e contadores.

Nao registrar:

- Senhas.
- Tokens.
- Descricoes completas de transacoes.
- Dados de conta bancaria.
- Valores financeiros sensiveis.
- Conteudo bruto de arquivos CSV.

## Upload CSV da Sprint 2

A base de importacao CSV aplica:

- Tamanho maximo de 2 MB.
- Extensao `.csv`.
- MIME types CSV comuns.
- Validacao de UTF-8.
- Bloqueio de bytes nulos.
- Validacao de estrutura pelo parser.
- Hash SHA-256 do arquivo.
- Hash SHA-256 da descricao normalizada.
- Deduplicacao por `userId` e `dedupeKey`.
- Historico por usuario com mes ou periodo do extrato.
- Mensagens controladas para erros esperados de CSV, sem repassar detalhes internos de infraestrutura ao cliente.
- Contadores de importacao calculados com base no que o banco realmente inseriu, reduzindo divergencia em cenarios de duplicidade concorrente.

Ainda permanecem no roadmap:

- Scanner de arquivos no roadmap.
- Armazenamento temporario com limpeza caso arquivos sejam persistidos fora do banco.

## Dashboard da Sprint 3

O dashboard real usa dados de `Transaction` apenas por meio de consultas filtradas por `userId`.

Controles aplicados:

- `getDashboardSummary` exige `userId`.
- KPIs, graficos, insights e tabela usam somente transacoes do usuario autenticado.
- A interface mostra o intervalo real considerado pelo filtro ativo.
- A interface diferencia usuario sem transacoes de filtro sem transacoes no periodo.
- Componentes visuais recebem dados ja calculados e nao executam queries financeiras.
- Nao ha tela administrativa para visualizar transacoes de usuarios.
- Nao foram adicionados logs para valores financeiros, descricoes completas ou conteudo bruto de CSV.

Os dados exibidos no dashboard sao dados do proprio usuario autenticado. Ainda assim, logs e audit logs continuam proibidos de registrar valores financeiros sensiveis ou descricoes completas.

## Limitacoes conhecidas

- Ainda nao ha MFA.
- Ainda nao ha recuperacao de senha.
- Rate limiting ainda cobre somente login e cadastro por identidade; uploads, dashboard e outras operações não estão limitados.
- Ainda nao ha login social.
- Ainda nao ha criptografia de campos financeiros.
- Ainda nao ha modo zero-knowledge/privacy mode.
- Ainda nao ha parser OFX.
- A categorizacao manual e as regras automaticas v1 existem; a suite atual cobre autorizacao de categorias, regras e transacoes, mas nao toda a aplicacao.
- Ainda nao ha Open Finance.
- Ainda nao ha PWA.
- Ainda nao ha IA externa.
- Login e cadastro possuem cobertura automatizada de rate limiting, sessão e eventos de auditoria relacionados; importações, contas e dashboard ainda não possuem cobertura equivalente.

## Criptografia futura

Antes de producao, avaliar criptografia de campos sensiveis e uma arquitetura que impeca operadores da plataforma de visualizar transacoes individuais. A modelagem atual ja separa `userId` e evita telas administrativas sobre dados financeiros.

## Categorias da Sprint 4

Na categorizacao manual, IDs recebidos do navegador nao sao confiaveis. A transacao e a categoria sao buscadas separadamente com `id + userId`, sendo o `userId` obtido exclusivamente da sessao. Recursos inexistentes e pertencentes a outro usuario recebem a mesma resposta generica. A mutacao altera apenas categoria e origem de categorizacao; descricao, valor e demais dados financeiros nao sao alterados nem registrados em logs.

Regras v1 aplicam isolamento triplo: regra e categoria precisam pertencer ao usuario, e somente transacoes do mesmo `userId` com `categoryId = NULL` sao atualizadas. O filtro final impede sobrescrever categorizacao manual concorrente. O resultado exposto contem apenas contadores agregados; descricoes e valores nao sao registrados em logs.

Os testes manuais com dois usuarios confirmaram que listagem, alteracao e aplicacao permanecem isoladas por `userId`. A verificacao agregada confirmou origens `SYSTEM_RULE` e `USER_MANUAL` coexistindo sem exposicao de descricoes, valores ou identificadores financeiros.

Toda consulta do servico de categorias exige `userId`. Pai e categoria sao buscados por `id + userId`; nao existe listagem global, e recurso inexistente ou pertencente a outro usuario retorna a mesma mensagem generica. IDs enviados pelo cliente nao bastam.

O servico impede associacoes cruzadas nas operacoes atuais, e as seis FKs compostas da Atividade 5.1 reforcam essa propriedade no banco. A unicidade robusta de categorias raiz permanece pendente em `SEC-006`/`BCK-016`.

A pagina e todas as Server Actions exigem sessao. IDs de categoria e pai vindos do navegador sao revalidados com o `userId` da sessao, e a resposta nao distingue recurso inexistente de recurso pertencente a outro usuario. Nenhum nome de categoria ou dado financeiro e enviado a audit logs.
