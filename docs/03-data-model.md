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

## Transacoes

`Transaction` guarda:

- `occurredAt`, `postedAt`, `amountCents`, `currency` e `direction`.
- `description` para uso do proprio usuario autenticado.
- `normalizedDescription` e `descriptionHash` para comparacao e deduplicacao.
- `dedupeKey` calculado a partir de provedor, identificador externo quando existir, data, valor e hash de descricao.

O MVP nao salva o CSV bruto no banco.

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
- Evitar `rawPayload` para conteudo bruto sensivel; se usado no futuro, deve ser reduzido, mascarado ou criptografado.
