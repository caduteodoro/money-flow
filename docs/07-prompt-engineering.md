# 07 - Engenharia de prompts

## Objetivo

Manter prompts claros para trabalhar com Codex, agentes e futuras features de insights financeiros.

## Prompts para desenvolvimento

Ao pedir mudancas no projeto, informe:

- Sprint atual.
- Escopo permitido.
- Arquivos ou areas afetadas.
- Restricoes de seguranca e privacidade.
- Resultado esperado e comandos de validacao.

## Prompts para autenticacao

Pedidos de autenticacao devem reforcar:

- Nao usar login social sem decisao explicita.
- Nao registrar senha, token ou dados sensiveis em logs.
- Salvar somente hash de senha.
- Salvar somente hash do token de sessao.
- Usar cookie HTTP-only.
- Validar rotas internas no servidor.
- Exibir mensagens genericas em falhas de login.
- Registrar audit logs sem dados sensiveis em claro.

## Prompts para importacao futura

Pedidos de upload/importacao devem reforcar:

- CSV/OFX sao entrada nao confiavel.
- Validar extensao, MIME type, tamanho, estrutura e conteudo.
- Nunca usar extratos reais no repositorio.
- Nunca logar conteudo bruto de extrato.
- Toda consulta e importacao precisa filtrar por `userId`.
- Gerar `fileHash`, `descriptionHash` e `dedupeKey`.
- Nao salvar arquivo bruto no banco.
- Nao acoplar o dominio a um banco especifico; usar parsers/adaptadores.

## Prompts para insights futuros

Insights financeiros devem:

- Usar apenas dados do usuario autenticado.
- Evitar julgamento moral.
- Ser claros, uteis e levemente bem-humorados.
- Explicar a base do insight quando possivel.
- Nao expor dados sensiveis desnecessariamente.

## Exemplo de tom

"Seu gasto medio diario subiu nesta semana. Nada de panico: vale olhar as categorias que mais cresceram antes de mexer no orcamento."

## Guardrails

- Nao inferir renda, saude, religiao, politica ou dados sensiveis.
- Nao dar aconselhamento financeiro profissional.
- Nao recomendar credito, investimento ou produto financeiro sem contexto regulatorio.
- Nao gerar logs com dados financeiros em texto claro.
- Nao prometer MFA, recuperacao de senha, rate limiting, login social ou zero-knowledge sem marcar como planejado.
