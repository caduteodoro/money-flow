# 13 - Sprint 5 - Integridade relacional multiusuario

## Escopo

A Atividade 5.1 mitiga `SEC-005` ao transformar a propriedade por `userId` em invariante do PostgreSQL, sem substituir os filtros de autorizacao da aplicacao. `SEC-006`, `BCK-016`, `SEC-007` e novos fluxos de exclusao permanecem fora do escopo.

Nota de continuidade: este documento registra o estado ao termino da Atividade 5.1, quando `SEC-006` ainda estava pendente. Posteriormente, a Atividade 5.2 mitigou `SEC-006`; o estado posterior esta documentado em [`docs/14-sprint-5-category-uniqueness.md`](14-sprint-5-category-uniqueness.md).

## Relacoes protegidas

| Origem | Destino | Acao de exclusao |
|---|---|---|
| `Category(parentId, userId)` | `Category(id, userId)` | `NO ACTION` |
| `CategoryRule(categoryId, userId)` | `Category(id, userId)` | `CASCADE` |
| `Transaction(categoryId, userId)` | `Category(id, userId)` | `NO ACTION` |
| `Transaction(bankAccountId, userId)` | `BankAccount(id, userId)` | `NO ACTION` |
| `Transaction(statementImportId, userId)` | `StatementImport(id, userId)` | `NO ACTION` |
| `StatementImport(bankAccountId, userId)` | `BankAccount(id, userId)` | `NO ACTION` |

As relacoes opcionais usam `NO ACTION` para nunca tentar zerar o `userId` obrigatorio da origem. Uma operacao futura que exclua categoria, conta ou importacao devera desvincular antes somente referencias pertencentes ao mesmo usuario. A relacao obrigatoria entre regra e categoria mantem a cascata; a composicao com `userId` impede que ela alcance regra de outro tenant.

## Migrations

- `20260807150000_add_relational_tenant_keys`: cria indices unicos `id + userId` em `Category`, `BankAccount` e `StatementImport`.
- `20260807151000_enforce_relational_tenant_fks`: remove as seis FKs simples e cria as FKs compostas.

As duas migrations executam em transacao, mantem IDs e proprietarios e nao corrigem dados automaticamente. Uma associacao preexistente incompativel faz a segunda migration falhar e reverte tambem a remocao das FKs anteriores.

## Diagnostico e compatibilidade

Antes da aplicacao, uma transacao `READ ONLY` verificou orfaos e divergencias de `userId` nas seis relacoes do banco de desenvolvimento. Todas retornaram zero. Nenhum nome, e-mail, descricao ou valor financeiro foi consultado para o relatorio.

O schema foi formatado, validado e teve o client gerado com Prisma 5.22. O SQL foi aplicado em PostgreSQL 16 descartavel, o catalogo confirmou cinco acoes `NO ACTION`, uma `CASCADE` e tres indices compostos, e o diff posterior retornou migration vazia, sem drift.

## Evidencias automatizadas

`tests/integration/relational-integrity.test.ts` usa somente fixtures sinteticas e Prisma real para comprovar:

- as seis relacoes validas do mesmo usuario;
- campos opcionais nulos e tenants independentes;
- rejeicao `P2003` de cada tentativa cruzada, sem registro parcial ou dado do destino no erro;
- bloqueio direto nas cinco relacoes `NO ACTION`;
- cascata de categoria somente para regra do mesmo usuario;
- rollback de escrita anterior quando uma exclusao bloqueada falha;
- exclusao direta de um usuario com todas as relacoes sem alterar outro tenant.

A regressao aprovada totalizou 53 testes de integracao e 44 testes unitarios. Lint, TypeScript, build, `prisma validate`, `prisma generate`, recriacao por oito migrations e `git diff --check` fazem parte do checkpoint.

## Rollback ensaiado

O ensaio ocorreu em banco sintetico separado, recriado desde a primeira migration. A ordem validada foi:

1. remover as seis FKs compostas;
2. restaurar as seis FKs simples com seus `SET NULL`/`CASCADE` historicos;
3. confirmar as FKs restauradas;
4. remover os tres indices unicos `id + userId`;
5. confirmar ausencia dos indices auxiliares.

O rollback de schema nao corrige nem autoriza perda de dados. Antes de qualquer rollback real, deve-se diagnosticar se ja existem escritas que dependem das novas garantias e executar o procedimento em janela controlada.

## Risco residual

As constraints garantem integridade, nao confidencialidade por si so. Actions, servicos e leituras continuam obrigados a derivar o usuario da sessao e filtrar por `userId`. Operadores com privilegio para desabilitar constraints representam risco operacional separado. Unicidade de categorias raiz, retencao e exclusao de dados permanecem pendentes.
