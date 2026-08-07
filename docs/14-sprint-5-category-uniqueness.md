# 14 - Sprint 5 - Unicidade estrutural de categorias

## Escopo e regra funcional

A Atividade 5.2 mitiga `SEC-006` e conclui `BCK-016`. Categorias equivalentes nao podem coexistir no mesmo escopo, inclusive em criacoes e renomeacoes concorrentes. A autorizacao e o isolamento por `userId` continuam sendo responsabilidades separadas da aplicacao e das FKs compostas da Atividade 5.1.

A funcao canonica existente em `lib/categories/category-validation.ts`:

- remove whitespace das extremidades;
- reduz sequencias de whitespace ECMAScript a um espaco;
- aplica lowercase com locale `pt-BR` para comparacao;
- mantem acentos, caracteres e o nome visivel significativos.

Assim, `Casa`, `casa` e `  CASA  ` sao equivalentes; `Avó` e `Avo` sao distintos. Usuarios diferentes, uma raiz e uma filha, ou filhos de pais distintos podem compartilhar nomes.

## Estrutura e migration

`Category.comparisonKey` persiste a chave comparativa. Criacao de raiz, criacao de filha e renomeacao calculam a chave pela mesma funcao e gravam `name` e `comparisonKey` juntos.

A migration `20260807160000_enforce_category_name_uniqueness` executa em uma transacao:

1. adiciona `comparisonKey` anulavel;
2. faz backfill com lowercase sob `pt-BR-x-icu` e uma classe Unicode explicita equivalente a `\s` do ECMAScript;
3. aborta se encontrar raizes ou filhos equivalentes no mesmo escopo;
4. torna a coluna obrigatoria;
5. cria `Category_child_userId_comparisonKey_parentId_key`;
6. cria `Category_root_userId_comparisonKey_key` com `WHERE parentId IS NULL`;
7. remove o indice exato anterior somente depois das novas garantias.

O build dos indices ocorre dentro da transacao e pode bloquear brevemente escritas em `Category`; a aplicacao deve usar uma janela controlada em bancos maiores. Nenhum ID, proprietario, nome, hierarquia ou referencia e deduplicado automaticamente.

## Diagnostico e paridade

O diagnostico `READ ONLY` no desenvolvimento retornou:

| Tipo | Grupos | Registros |
|---|---:|---:|
| Raiz exata | 0 | 0 |
| Raiz equivalente | 0 | 0 |
| Filho exato no mesmo pai | 0 | 0 |
| Filho equivalente no mesmo pai | 0 | 0 |
| Diferenca somente de caixa no mesmo escopo | 0 | 0 |
| Diferenca somente de espacos no mesmo escopo | 0 | 0 |

As categorias existentes tinham 165 referencias em `Transaction.categoryId`, 3 em `CategoryRule.categoryId` e 3 em `Category.parentId`. A aplicacao da migration preservou as 6 categorias, todas as referencias e as 6 FKs compostas da Atividade 5.1.

A primeira expressao SQL candidata divergiu em 4 casos sinteticos de whitespace Unicode e foi descartada antes da migration. A classe Unicode explicita final coincidiu com a funcao TypeScript em 14 de 14 casos representativos e em 6 de 6 nomes existentes, sem imprimir os valores reais.

## Concorrencia e erros publicos

O precheck do servico permanece para feedback antecipado, mas nao e a garantia final. Testes de integracao seguraram duas escritas reais atras de um lock e as liberaram simultaneamente. Para raizes, filhos do mesmo pai e renomeacoes concorrentes, exatamente uma escrita persistiu.

O Prisma 5.22 retornou `P2002` com alvos distintos para o indice parcial de raizes e a unicidade composta de filhos. O servico verifica o alvo esperado e confirma que a colisao existe no mesmo escopo antes de retornar `Ja existe uma categoria com esse nome neste nivel.`. Erros desconhecidos nao sao classificados como duplicidade. Uma renomeacao rejeitada permanece atomicamente intacta.

## Compatibilidade, recriacao e rollback

PostgreSQL 16, Prisma 5.22, `prisma format`, `validate`, `generate` e recriacao desde a primeira migration foram aprovados. A sentinela confirmou 9 migrations no banco `money_flow_test` em `127.0.0.1:5434`.

O Prisma 5.22 nao representa indices parciais no schema. O indice de raiz e criado por SQL manual com nome estavel. `prisma migrate diff` retornou migration vazia porque essa versao ignora o indice parcial; a migration versionada, e nao somente `schema.prisma`, e a fonte de verdade.

Dois ensaios descartaveis foram executados:

- com duas raizes equivalentes preexistentes, a migration falhou e a transacao preservou registros, coluna ausente, indice antigo e FKs da 5.1;
- no rollback, o indice antigo foi restaurado antes de remover os indices novos e `comparisonKey`; categorias e referencias sinteticas permaneceram integras.

Rollback real exige novo diagnostico, janela controlada e decisao explicita. O ensaio nao autoriza rollback destrutivo no desenvolvimento ou em producao.

## Evidencia automatizada e riscos residuais

`tests/unit/category-normalization.test.ts` cobre whitespace, caixa, acentos e caracteres do dominio. `tests/integration/category-uniqueness.test.ts` cobre paridade SQL, escopos de raiz/filho/usuario/pai, criacao e renomeacao concorrentes, erros controlados, Prisma e SQL diretos e preservacao das FKs da Atividade 5.1.

Riscos residuais:

- todo futuro escritor direto de `Category` deve usar a funcao canonica e manter `comparisonKey` coerente;
- operadores com privilegios para alterar ou desabilitar indices permanecem risco operacional;
- o indice parcial depende da migration manual enquanto o projeto usar Prisma 5.22;
- a migration exige a collation ICU `pt-BR-x-icu`, validada no PostgreSQL 16 usado pelo projeto.

`SEC-007`, retencao, exclusao de dados e outras atividades permanecem fora deste escopo.
