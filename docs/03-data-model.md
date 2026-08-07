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
- `RateLimitBucket`: contador efêmero de janela fixa identificado por scope, digest HMAC e início da janela.

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

- `categoryId` opcional; `NULL` representa uma transacao sem categoria.
- `categorizationSource`; uma atribuicao pela rota de transacoes grava `USER_MANUAL`.

O vinculo manual aceita categoria raiz ou filha e altera apenas `categoryId`, `categorizationSource` e o `updatedAt` automatico. O banco ainda nao possui constraints compostas que garantam que transacao e categoria tenham o mesmo `userId`; essa integridade e aplicada no servico e permanece como hardening pendente.

- `occurredAt`, `postedAt`, `amountCents`, `currency` e `direction`.
- `description` para uso do proprio usuario autenticado.
- `normalizedDescription` e `descriptionHash` para comparacao e deduplicacao.
- `dedupeKey` calculado a partir de provedor, identificador externo quando existir, data, valor e hash de descricao.

O MVP nao salva o CSV bruto no banco.

## Categorias

`Category` e `CategoryRule` sustentam as telas e mutacoes server-side da Sprint 4.

`CategoryRule` e usada na v1 com `userId`, `categoryId`, `matchText`, `priority`, `isActive` e timestamps. Menor prioridade numerica vence; empates usam `createdAt` e `id`. A aplicacao grava `Transaction.categorizationSource = SYSTEM_RULE`.

O uso funcional validado conecta `Category`, `CategoryRule` e `Transaction.categoryId`. Atribuicoes feitas pelo usuario usam `USER_MANUAL`; atribuicoes pela aplicacao explicita das regras usam `SYSTEM_RULE`. Categorias raiz e filhas podem ser destino, regras inativas nao participam e `priority` define a precedencia.

Nao existe coluna de texto normalizado nem unicidade de regras no banco. A normalizacao e a duplicidade logica sao tratadas no servico; concorrencia de criacao duplicada e integridade composta entre usuarios permanecem como hardening pendente.

A camada `lib/categories/` protege listagem, criacao e renomeacao por `userId`, valida propriedade do pai e limita a hierarquia v1 a dois niveis. A UI `/categories` usa exclusivamente essa camada segura. Ainda faltam categorizacao manual e aplicacao de regras.

Regras para a Sprint 4:

- Criar categorias somente por servicos que recebam o `userId` autenticado.
- Ao atribuir `categoryId` a uma transacao, validar que a transacao e a categoria pertencem ao mesmo `userId`.
- Ao criar `CategoryRule`, validar que a regra e a categoria pertencem ao mesmo `userId`.
- Evitar nomes duplicados entre categorias irmas. Como `parentId` pode ser `NULL`, nao confiar apenas em `@@unique([userId, name, parentId])` para categorias raiz no PostgreSQL; a regra precisa ser aplicada no servico ou reforcada por indice/migration especifica antes de liberar a UI.
- Validar que pai, categoria, regra e transacao pertencem ao mesmo usuario. As chaves estrangeiras atuais validam IDs, mas nao impedem por si so relacionamentos cruzados entre usuarios.

O servico aplica essas protecoes no codigo, mas o banco ainda nao garante integralmente a unicidade de categorias raiz nem a propriedade composta das relacoes. Indices/constraints adicionais e uma migration segura continuam pendentes de autorizacao.

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

## Rate limiting

`RateLimitBucket` não pertence a `User` e não armazena e-mail, IP ou outro identificador bruto. Sua chave primária composta é `scope + keyDigest + windowStart`, que também sustenta o `ON CONFLICT` usado pelo consumo atômico. `expiresAt` possui índice próprio para limpeza lazy em lotes.

- `scope`: separa operação e política, incluindo janelas curta e prolongada.
- `keyDigest`: HMAC-SHA-256 derivado do identificador já normalizado.
- `windowStart` e `expiresAt`: limites UTC determinísticos da janela fixa.
- `count`: capacidade efetivamente consumida, sem ultrapassar o limite configurado.
- `createdAt` e `updatedAt`: rastreiam criação e último consumo do bucket.

O reset filtra pelo prefixo indexável da chave primária (`scope + keyDigest`) e não depende de relação ou cascata com dados financeiros. A migration `20260807120000_add_rate_limit_buckets` cria somente essa tabela e o índice de expiração.

## Observacoes para proximas sprints

- Avaliar `Decimal` se houver necessidade multimoeda avancada. No MVP, `amountCents` evita erros de ponto flutuante.
- Revisar indices apos as primeiras queries reais do dashboard.
- Revisar a migration `20260628214608_add_statement_imports_transactions` antes de aplicar em banco com dados, pois ela adiciona `StatementImport.updatedAt` obrigatorio sem default.
- Evitar `rawPayload` para conteudo bruto sensivel; se usado no futuro, deve ser reduzido, mascarado ou criptografado.
