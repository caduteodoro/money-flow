# 12 - Sprint 5 - Fundacao de testes de seguranca

## Estado e escopo

O Bloco 2 da Sprint 5 estabeleceu uma fundacao de testes de integracao para comprovar isolamento multi-tenant por `userId` nas boundaries existentes de categorias, regras de categoria e transacoes. Os testes atravessam actions e servicos reais sempre que a boundary autenticada faz parte do caso, usam Prisma real e persistem em PostgreSQL real descartavel.

Este incremento nao comprova a seguranca de toda a aplicacao. Nao cobre autenticacao, importacoes, dashboard, audit logs, rate limiting, infraestrutura de producao, criptografia de campos, backup ou acesso operacional ao banco. Nenhum dado financeiro real e usado.

## Arquitetura da suite

- Vitest em ambiente Node, com `fileParallelism: false` e `maxWorkers: 1`.
- PostgreSQL 16 definido em `docker-compose.test.yml`.
- Projeto Compose `money-flow-test`, banco exclusivo `money_flow_test` e credenciais sinteticas.
- Bind local somente em `127.0.0.1:5434`; o desenvolvimento permanece separado em 5432.
- Dados do PostgreSQL de teste em `tmpfs`, sem volume persistente.
- Migrations reais executadas com `prisma migrate deploy`.
- Guardrail em `tests/helpers/assert-test-database.mjs`: exige `NODE_ENV=test`, confirmacao explicita, PostgreSQL, host local, porta 5434 e nome contendo `_test`; rejeita porta 5432 e banco `money_flow`.
- Orquestracao em `tests/helpers/run-integration.mjs`, com remocao do projeto de teste em `finally`.
- Prisma, servicos e actions reais. Quando necessario, somente `requireCurrentUser` e simulado para fixar o usuario autenticado.
- Fixtures totalmente sinteticas e cleanup por IDs conhecidos, removendo dependencias antes dos usuarios e desconectando cada Prisma Client.

O ciclo reproduzivel e:

```bash
npm run test:integration
```

## Evidencias implementadas

| Commit | Arquivo ou entrega | Evidencia |
|---|---|---|
| `e831b1e` | infraestrutura inicial | Vitest, Compose de teste, guardrail, shim `server-only` e scripts |
| `90f9296` | sentinela | banco `money_flow_test`, migrations e tabela esperada |
| `22c26fb` | hardening da infraestrutura | validacao isolada, bind local e falha segura reforcados |
| `330be70` | `tests/integration/category-authorization.test.ts` | listagem isolada, ownership derivado da autenticacao e bloqueio de categoria/pai alheio |
| `c4dfea1` | `tests/integration/category-rule-authorization.test.ts` | isolamento de regras e categorias, equivalencia entre recurso alheio e inexistente e aplicacao por usuario |
| `7bbdd35` | `tests/integration/transaction-authorization.test.ts` | listagem, atribuicao manual, equivalencia publica e ausencia de relacoes cruzadas |
| `31e5221` | correcao e teste de `USER_MANUAL` | exclusao explicita na selecao e no update final; contadores baseados em `updateMany.count` |

As fixtures adversariais tornam vazamentos observaveis com usuarios, IDs, nomes e descricoes sinteticos distintos. Os testes verificam respostas publicas equivalentes para recursos alheios e inexistentes quando esse contrato existe, preservacao dos registros do outro usuario, ausencia de associacoes cruzadas e ausencia de alteracoes parciais nos campos relevantes. Quando um helper seleciona somente campos de seguranca, ele nao e apresentado como snapshot integral.

A vulnerabilidade encontrada durante o Bloco 2 permitia que uma transacao com `categorizationSource = USER_MANUAL` e `categoryId = NULL` fosse selecionada por regras automaticas. O commit `31e5221` passou a exigir, tanto na leitura quanto no `updateMany`, `userId`, categoria nula e origem diferente de `USER_MANUAL`. Como `categorizedCount` soma somente `result.count`, uma escrita recusada pelo predicado final nao e contada como categorizacao persistida.

## Regressao final do Bloco 2

Em 7 de agosto de 2026, a bateria final foi executada uma unica vez:

| Comando | Resultado |
|---|---|
| `npm run test:integration` | PASS: 5 arquivos e 16 testes |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npx prisma validate` | PASS |
| `npm test` | PASS: nenhuma suite unitaria fora de `tests/integration` encontrada |

A sentinela confirmou `money_flow_test` em `127.0.0.1:5434` e as cinco migrations existentes foram aplicadas. Ao final, fixtures sinteticas foram removidas, Prisma foi desconectado e container, rede e volumes de teste nao permaneceram. A porta 5434 foi liberada. O container PostgreSQL de desenvolvimento permaneceu existente e parado, no estado anterior a regressao; nenhum recurso de desenvolvimento foi removido.

## Limitacoes e proximos dominios

Categorias, regras e transacoes ja fazem parte da cobertura deste incremento e nao sao novos dominios candidatos.

| Dominio | Existencia atual | Boundary disponivel | Sensibilidade | Cobertura atual | Recomendacao |
|---|---|---|---|---|---|
| Autenticacao e sessoes | Implementado | actions de cadastro, login e logout; servicos de sessao | Critica | Sem integracao neste incremento | Priorizar no proximo incremento: sessao valida, expirada, logout e respostas publicas, sem iniciar rate limiting |
| Importacoes | Implementado para CSV | actions de preview/confirmacao e `lib/imports` | Critica | Sem integracao neste incremento | Considerar apos autenticacao: ownership, deduplicacao e falha segura com CSV sintetico |
| Audit logs | Implementado para autenticacao e importacao | `lib/auth/audit.ts` e chamadas dos fluxos existentes | Alta | Sem integracao neste incremento | Considerar junto ao dominio produtor, comprovando minimizacao e isolamento sem texto financeiro sensivel |
| Contas bancarias | Modelo existente; sem gestao dedicada na UI | uso interno no servico de importacao; sem action CRUD dedicada | Alta | Sem cobertura dedicada | Nao criar testes para CRUD inexistente; avaliar ownership quando houver boundary propria |
| Cartoes | Nao existe no modelo ou produto atual | N/A | Alta, se futuro | N/A | Futuro; decisao pendente de alinhamento do backlog |
| Orcamentos | Nao existe no modelo ou produto atual | N/A | Alta, se futuro | N/A | Futuro; decisao pendente de alinhamento do backlog |
| Metas | Nao existe no modelo ou produto atual | N/A | Alta, se futuro | N/A | Futuro; decisao pendente de alinhamento do backlog |

A recomendacao para o proximo incremento de testes e autenticacao e sessoes, por protegerem a origem do `userId` usado por todas as boundaries cobertas. Essa recomendacao nao altera o backlog, nao implementa rate limiting e depende de autorizacao de escopo propria.

Nota de continuidade: o Bloco 4 atendeu posteriormente essa recomendacao com cobertura PostgreSQL de cadastro neutro, login posterior, sessoes simultaneas, expiracao e logout da sessao atual. O escopo e os resultados historicos do Bloco 2 acima permanecem inalterados.

O Bloco 2 fornece uma base reproduzivel e evidencias para os dominios listados, mas nao encerra a Sprint 5 nem substitui revisao de privacidade, checkpoint funcional ou validacoes de pre-producao.
