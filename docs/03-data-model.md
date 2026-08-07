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

## Sessoes

`Session` persiste somente o SHA-256 do token aleatorio de 32 bytes. `tokenHash` e unico e funciona como chave de localizacao; o token puro permanece apenas no cookie HTTP-only. A FK obrigatoria para `User` usa `onDelete: Cascade`, e os indices por `userId` e `expiresAt` sustentam consulta por usuario e limpeza futura.

Cada login valido cria uma sessao independente com validade fixa de 30 dias. O cadastro nao cria `Session`. O logout deriva o hash do cookie atual e remove somente o registro correspondente; um registro ja ausente e idempotente, enquanto erro inesperado de persistencia propaga antes da limpeza do cookie. Nao ha logout global, rotacao, renovacao deslizante ou mudanca estrutural do modelo no Bloco 4.

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

O vinculo manual aceita categoria raiz ou filha e altera apenas `categoryId`, `categorizationSource` e o `updatedAt` automatico. Alem da validacao do servico, a FK composta `Transaction(categoryId, userId) -> Category(id, userId)` impede que a relacao atravesse usuarios.

- `occurredAt`, `postedAt`, `amountCents`, `currency` e `direction`.
- `description` para uso do proprio usuario autenticado.
- `normalizedDescription` e `descriptionHash` para comparacao e deduplicacao.
- `dedupeKey` calculado a partir de provedor, identificador externo quando existir, data, valor e hash de descricao.

O MVP nao salva o CSV bruto no banco.

## Categorias

`Category` e `CategoryRule` sustentam as telas e mutacoes server-side da Sprint 4.

`CategoryRule` e usada na v1 com `userId`, `categoryId`, `matchText`, `priority`, `isActive` e timestamps. Menor prioridade numerica vence; empates usam `createdAt` e `id`. A aplicacao grava `Transaction.categorizationSource = SYSTEM_RULE`.

O uso funcional validado conecta `Category`, `CategoryRule` e `Transaction.categoryId`. Atribuicoes feitas pelo usuario usam `USER_MANUAL`; atribuicoes pela aplicacao explicita das regras usam `SYSTEM_RULE`. Categorias raiz e filhas podem ser destino, regras inativas nao participam e `priority` define a precedencia.

Nao existe coluna de texto normalizado nem unicidade de regras no banco. A normalizacao e a duplicidade logica continuam tratadas no servico, e a concorrencia de criacao duplicada permanece como hardening pendente separado em `SEC-006`. A propriedade entre regra e categoria agora tambem e garantida por FK composta.

A camada `lib/categories/` protege listagem, criacao e renomeacao por `userId`, valida propriedade do pai e limita a hierarquia v1 a dois niveis. A UI `/categories` usa exclusivamente essa camada segura. Ainda faltam categorizacao manual e aplicacao de regras.

Regras para a Sprint 4:

- Criar categorias somente por servicos que recebam o `userId` autenticado.
- Ao atribuir `categoryId` a uma transacao, validar que a transacao e a categoria pertencem ao mesmo `userId`.
- Ao criar `CategoryRule`, validar que a regra e a categoria pertencem ao mesmo `userId`.
- Evitar nomes duplicados entre categorias irmas. Como `parentId` pode ser `NULL`, nao confiar apenas em `@@unique([userId, name, parentId])` para categorias raiz no PostgreSQL; a regra precisa ser aplicada no servico ou reforcada por indice/migration especifica antes de liberar a UI.
- Validar na aplicacao que pai, categoria, regra e transacao pertencem ao mesmo usuario, mantendo respostas publicas controladas; as FKs compostas fornecem uma segunda garantia no banco.

O servico e o banco protegem a propriedade composta das relacoes. A unicidade robusta de categorias raiz permanece pendente e nao foi alterada pela Atividade 5.1.

## Integridade relacional multiusuario

As migrations `20260807150000_add_relational_tenant_keys` e `20260807151000_enforce_relational_tenant_fks` adicionam chaves candidatas `id + userId` em `Category`, `BankAccount` e `StatementImport` e protegem seis relacoes:

- `Category(parentId, userId) -> Category(id, userId)`;
- `CategoryRule(categoryId, userId) -> Category(id, userId)`;
- `Transaction(categoryId, userId) -> Category(id, userId)`;
- `Transaction(bankAccountId, userId) -> BankAccount(id, userId)`;
- `Transaction(statementImportId, userId) -> StatementImport(id, userId)`;
- `StatementImport(bankAccountId, userId) -> BankAccount(id, userId)`.

As cinco relacoes opcionais usam `ON DELETE NO ACTION`. Uma exclusao funcional futura deve primeiro desvincular explicitamente apenas referencias do mesmo usuario. A relacao obrigatoria entre `CategoryRule` e `Category` preserva `ON DELETE CASCADE`; como a FK inclui `userId`, a cascata nao pode alcancar regra de outro usuario.

As migrations sao transacionais e nao alteram dados. O diagnostico anterior a aplicacao deve retornar zero relacoes orfas ou entre usuarios. O rollback restaura primeiro as seis FKs simples historicas e somente depois remove os tres indices compostos auxiliares.

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
