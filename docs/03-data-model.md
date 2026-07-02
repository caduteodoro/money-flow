# 03 - Modelo de dados

## Modelos principais

- `User`: dono dos dados e ponto de isolamento.
- `Session`: sessao autenticada com hash do token.
- `BankAccount`: conta bancaria do usuario.
- `StatementImport`: historico de arquivos processados.
- `Transaction`: lancamento financeiro normalizado.
- `Category`: categoria editavel, com suporte a hierarquia futura.
- `CategoryRule`: regra automatica de categorizacao futura.
- `AuditLog`: registro de acoes importantes sem dados financeiros sensiveis em claro.

## Regras de isolamento

- Toda conta bancaria pertence a um `userId`.
- Toda importacao pertence a um `userId`.
- Toda transacao pertence a um `userId`.
- Toda categoria e regra de categoria pertence a um `userId`.
- Queries financeiras devem filtrar explicitamente por `userId`.
- `Transaction` usa `@@unique([userId, dedupeKey])` para deduplicacao por usuario.

## Importacoes

`StatementImport` guarda metadados do processamento:

- `format` com `CSV` nesta fase.
- `sourceProvider` para identificar o parser usado sem acoplar o dominio ao banco.
- `fileHash` para rastrear o arquivo sem salvar o CSV bruto.
- `fileSizeBytes`, `periodStart`, `periodEnd`, `rowCount`, `importedCount`, `duplicateCount`, `invalidRowCount` e `skippedCount`.
- `status`, `createdAt`, `updatedAt` e `completedAt`.

`periodStart` e `periodEnd` sao calculados a partir das datas das linhas validas do arquivo parseado. O periodo nao depende apenas das transacoes novas, entao importacoes 100% duplicadas ainda preservam o mes ou intervalo do extrato.

O nome do arquivo e tratado apenas como metadado de exibicao. A validacao nao confia nele como fonte de verdade.

`importedCount`, `duplicateCount` e `skippedCount` devem refletir a persistencia real. Como `Transaction` tem restricao unica por `userId + dedupeKey`, o servico de importacao usa a quantidade retornada pelo `createMany` para evitar contadores otimistas em cenarios concorrentes.

## Transacoes

`Transaction` guarda:

- `occurredAt`, `postedAt`, `amountCents`, `currency` e `direction`.
- `description` para uso do proprio usuario autenticado.
- `normalizedDescription` e `descriptionHash` para comparacao e deduplicacao.
- `dedupeKey` calculado a partir de provedor, identificador externo quando existir, data, valor e hash de descricao.

O MVP nao salva o CSV bruto no banco.

## Categorias

`Category` e `CategoryRule` ja existem no schema como base da Sprint 4, mas ainda nao ha telas ou mutacoes publicas para categorias.

Regras para a Sprint 4:

- Criar categorias somente por servicos que recebam o `userId` autenticado.
- Ao atribuir `categoryId` a uma transacao, validar que a transacao e a categoria pertencem ao mesmo `userId`.
- Ao criar `CategoryRule`, validar que a regra e a categoria pertencem ao mesmo `userId`.
- Evitar nomes duplicados entre categorias irmas. Como `parentId` pode ser `NULL`, nao confiar apenas em `@@unique([userId, name, parentId])` para categorias raiz no PostgreSQL; a regra precisa ser aplicada no servico ou reforcada por indice/migration especifica antes de liberar a UI.

## Enums

`TransactionDirection`:

- `INCOME`
- `EXPENSE`
- `TRANSFER`
- `REVERSAL`

`CategorizationSource`:

- `SYSTEM_RULE`
- `USER_MANUAL`
- `AI_SUGGESTION`
- `IMPORTED`

`StatementImportStatus`:

- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`

## Observacoes para proximas sprints

- Avaliar `Decimal` se houver necessidade multimoeda avancada. No MVP, `amountCents` evita erros de ponto flutuante.
- Revisar indices apos as primeiras queries reais do dashboard.
- Revisar a migration `20260628214608_add_statement_imports_transactions` antes de aplicar em banco com dados, pois ela adiciona `StatementImport.updatedAt` obrigatorio sem default.
- Evitar `rawPayload` para conteudo bruto sensivel; se usado no futuro, deve ser reduzido, mascarado ou criptografado.
