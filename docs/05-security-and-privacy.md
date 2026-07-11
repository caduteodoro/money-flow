# 05 - Seguranca e privacidade

O threat model da auditoria da Sprint 5 está registrado em [`docs/11-security-threat-model.md`](11-security-threat-model.md). O documento separa controles comprovados, riscos preliminares e pontos ainda não verificados; sua publicação não significa que os riscos já foram corrigidos.

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
- Erros de login usam mensagem generica para nao revelar se o e-mail existe.
- Login invalido registra `LOGIN_FAILED` com hash do e-mail e sem senha.
- Sessao usa token aleatorio criado no servidor.
- Apenas o hash do token e salvo em `Session.tokenHash`.
- O token puro fica somente no cookie HTTP-only.
- Logout remove a sessao do banco e limpa o cookie.

## Cookies de sessao

O cookie `money_flow_session` usa:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` em producao
- `path: "/"`
- expiracao de 30 dias

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
- Ainda nao ha rate limiting.
- Ainda nao ha login social.
- Ainda nao ha criptografia de campos financeiros.
- Ainda nao ha modo zero-knowledge/privacy mode.
- Ainda nao ha parser OFX.
- A modelagem, o servico server-side e a rota protegida de categorias existem; categorizacao de transacoes ainda nao foi implementada.
- Ainda nao ha Open Finance.
- Ainda nao ha PWA.
- Ainda nao ha IA externa.
- Ainda nao ha suite automatizada de testes versionada.

## Criptografia futura

Antes de producao, avaliar criptografia de campos sensiveis e uma arquitetura que impeca operadores da plataforma de visualizar transacoes individuais. A modelagem atual ja separa `userId` e evita telas administrativas sobre dados financeiros.

## Categorias da Sprint 4

Na categorizacao manual, IDs recebidos do navegador nao sao confiaveis. A transacao e a categoria sao buscadas separadamente com `id + userId`, sendo o `userId` obtido exclusivamente da sessao. Recursos inexistentes e pertencentes a outro usuario recebem a mesma resposta generica. A mutacao altera apenas categoria e origem de categorizacao; descricao, valor e demais dados financeiros nao sao alterados nem registrados em logs.

Regras v1 aplicam isolamento triplo: regra e categoria precisam pertencer ao usuario, e somente transacoes do mesmo `userId` com `categoryId = NULL` sao atualizadas. O filtro final impede sobrescrever categorizacao manual concorrente. O resultado exposto contem apenas contadores agregados; descricoes e valores nao sao registrados em logs.

Os testes manuais com dois usuarios confirmaram que listagem, alteracao e aplicacao permanecem isoladas por `userId`. A verificacao agregada confirmou origens `SYSTEM_RULE` e `USER_MANUAL` coexistindo sem exposicao de descricoes, valores ou identificadores financeiros.

Toda consulta do servico de categorias exige `userId`. Pai e categoria sao buscados por `id + userId`; nao existe listagem global, e recurso inexistente ou pertencente a outro usuario retorna a mesma mensagem generica. IDs enviados pelo cliente nao bastam.

O servico impede associacoes cruzadas nas operacoes atuais, mas constraints compostas e unicidade robusta de categorias raiz ainda precisam ser avaliadas no banco antes de producao.

A pagina e todas as Server Actions exigem sessao. IDs de categoria e pai vindos do navegador sao revalidados com o `userId` da sessao, e a resposta nao distingue recurso inexistente de recurso pertencente a outro usuario. Nenhum nome de categoria ou dado financeiro e enviado a audit logs.
