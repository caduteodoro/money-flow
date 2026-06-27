# 05 - Seguranca e privacidade

## Principios

- Privacidade por padrao.
- Menor exposicao possivel de dados financeiros.
- Isolamento rigoroso por `userId`.
- Logs uteis sem conteudo sensivel em claro.
- Evolucao considerando LGPD/GDPR.

## Regras atuais

- `.env` real nao deve ser versionado.
- Extratos reais nao devem entrar no GitHub.
- Nao criar telas administrativas para visualizar transacoes dos usuarios.
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

Metadados permitidos nesta fase:

- Hash de e-mail em falhas de login.
- Hash de IP quando disponivel.
- Hash de user-agent quando disponivel.
- Tipo de evento e timestamps.

Nao registrar:

- Senhas.
- Tokens.
- Descricoes completas de transacoes.
- Dados de conta bancaria.
- Valores financeiros sensiveis.

## Upload futuro

Na Sprint 2, revisar:

- Tamanho maximo.
- Extensoes permitidas.
- MIME type.
- Estrutura do CSV.
- Parsing seguro.
- Scanner de arquivos no roadmap.
- Armazenamento temporario com limpeza.

## Limitacoes conhecidas

- Ainda nao ha MFA.
- Ainda nao ha recuperacao de senha.
- Ainda nao ha rate limiting.
- Ainda nao ha login social.
- Ainda nao ha criptografia de campos financeiros.
- Ainda nao ha modo zero-knowledge/privacy mode.

## Criptografia futura

Antes de producao, avaliar criptografia de campos sensiveis e uma arquitetura que impeca operadores da plataforma de visualizar transacoes individuais. A modelagem atual ja separa `userId` e evita telas administrativas sobre dados financeiros.
