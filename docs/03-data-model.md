# 03 - Modelo de dados

## Modelos iniciais

- `User`: dono dos dados e ponto de isolamento.
- `BankAccount`: conta bancária do usuário.
- `StatementImport`: histórico de arquivos importados.
- `Transaction`: lançamento financeiro.
- `Category`: categoria editável, com suporte a hierarquia.
- `CategoryRule`: regra automática de categorização.
- `AuditLog`: registro de ações importantes sem dados financeiros sensíveis em claro.

## Regras importantes

- Toda transação pertence a um usuário.
- Toda conta bancária pertence a um usuário.
- Toda importação pertence a um usuário.
- Categoria suporta `parentId` para pai/filha.
- Transação suporta `categoryId` editável.
- Transação suporta `rawPayload` em JSON para preservar dados brutos de importação quando necessário.
- Transação usa `dedupeKey` com unicidade por usuário.

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

## Observações para próximas sprints

- Avaliar `Decimal` em vez de `Int` se houver necessidade multimoeda avançada. No MVP, `amountCents` evita erros de ponto flutuante.
- Revisar índices após as primeiras queries reais do dashboard.
- Validar se `rawPayload` deve ser reduzido, mascarado ou criptografado antes de produção.
