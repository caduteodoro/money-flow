# 06 - Roadmap

## Sprint 0

- Fundacao do projeto.
- Stack.
- Docker.
- Prisma.
- Documentacao.
- AGENTS.md.
- Skills/agentes.
- Telas mockadas para `/`, `/login`, `/register` e `/dashboard`.

Status: concluida.

## Sprint 1

- Cadastro de usuario.
- Login.
- Logout.
- Sessao segura com cookie HTTP-only.
- Token puro somente no cookie.
- Hash do token salvo em `Session.tokenHash`.
- Rotas protegidas.
- Isolamento inicial por usuario.
- Audit logs basicos de autenticacao.
- Documentacao atualizada.

Status: implementada no codigo. Validacao final depende dos checks locais.

## Sprint 2

- Upload CSV.
- Validacao de extensao, MIME type, tamanho, estrutura e conteudo.
- Preview antes da importacao.
- Importacao com `userId`.
- Deduplicacao por `dedupeKey`.
- Historico de importacoes.
- Logs de auditoria sem conteudo financeiro sensivel.

## Sprint 3

- Dashboard com dados reais.
- KPIs.
- Filtro de datas.
- Graficos com tooltips.
- Tabela de ultimas transacoes.
- Insights bem-humorados.

## Sprint 4

- Categorias.
- Categoria pai/filha.
- Edicao de categoria.
- Criacao de categoria.
- Regras automaticas.
- Transacoes nao categorizadas.

## Sprint 5

- Hardening de seguranca.
- Rate limiting.
- Revisao de privacidade.
- Documentacao final do MVP.
- Preparacao para OFX.

## Futuro pos-MVP

- MFA.
- Recuperacao de senha.
- Login social opcional.
- OFX parser.
- Criptografia mais forte para campos sensiveis.
- Zero-knowledge/privacy mode.
- Scanner de arquivos.
- Deploy com revisao de variaveis, cookies e observabilidade.
