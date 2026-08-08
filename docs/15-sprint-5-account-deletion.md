# 15 - Sprint 5 - Exclusao segura de conta e retencao minima

## Escopo e confirmacao

A Atividade 5.3 mitiga `SEC-007` no banco ativo. A rota protegida `/settings` oferece somente a secao "Zona de perigo" e exige a senha atual e a frase exata `EXCLUIR MINHA CONTA`. A identidade vem exclusivamente de `requireCurrentUser`; campos adicionais, inclusive um `userId` enviado pelo navegador, nao participam da decisao.

A exclusao e imediata, definitiva e sincrona. Nao existe soft delete, periodo de espera, fila, recibo, tombstone ou tabela de solicitacao. A ausencia de exportacao nao bloqueia a exclusao.

## Inventario e ordem transacional

O schema possui `User`, `Session`, `BankAccount`, `StatementImport`, `Transaction`, `Category`, `CategoryRule`, `AuditLog` e `RateLimitBucket`. O CSV bruto e processado em memoria e nao e persistido; ficam somente metadados de importacao e dados derivados das linhas.

Depois de validar frase e senha, uma unica transacao Prisma executa:

1. exclui `Transaction` por `userId`;
2. exclui `CategoryRule` por `userId`;
3. remove relacoes pai/filho de `Category` pelo mesmo `userId`;
4. exclui `Category` por `userId`;
5. exclui `StatementImport` e `BankAccount` por `userId`;
6. exclui todas as `Session` por `userId`;
7. exclui `AuditLog` diretamente associado, referencias exatas ao usuario e falhas de login com o `emailHash` exato;
8. exclui `RateLimitBucket` pelos quatro pares exatos de scope e digest HMAC de login/cadastro;
9. exclui `User` e exige exatamente uma linha afetada.

A ordem preserva as FKs compostas `NO ACTION` da Atividade 5.1 e nao enfraquece os indices da Atividade 5.2. O cookie HTTP-only e limpo somente depois do commit. Qualquer falha anterior produz rollback integral e uma mensagem publica controlada.

## Minimizacao e isolamento

Hashes de IP e user-agent sem `userId` nao sao criterios seguros de exclusao global, pois podem ser compartilhados. Seus exemplares diretamente vinculados desaparecem com sessoes e audit logs do usuario. O hash deterministico de e-mail e os buckets HMAC sao recalculados a partir do e-mail autenticado e removidos somente por correspondencia exata.

Os testes usam dois usuarios e fixtures sinteticas cobrindo todos os modelos. O snapshot integral do usuario B inclui cadastro, senha, sessoes, contas, importacoes, transacoes, categorias, regras, logs e buckets; nada se altera quando A e excluido ou quando uma falha e injetada no fluxo de A.

## Evidencia e rollback

Testes unitarios cobrem ausencia de sessao, frase vazia/incorreta, diferencas de caixa e espacos, senha vazia/incorreta, `userId` forjado, falha interna, limpeza do cookie e redirect neutro. Testes PostgreSQL comprovam exclusao integral, impossibilidade de reutilizar sessao, preservacao do segundo tenant e rollback total apos falha intermediaria restrita a `NODE_ENV=test`.

Nao houve migration. As nove migrations versionadas continuam recriando o schema desde zero em PostgreSQL 16.

## Riscos residuais

- ainda nao existe politica operacional de retencao, anonimizacao e integridade dos audit logs (`BCK-032`);
- backups podem conservar dados por prazo indefinido ou reintroduzi-los em uma restauracao; retencao e expurgo permanecem em `BCK-033`;
- acesso operacional privilegiado ao banco continua sendo risco separado;
- exportacao de dados nao faz parte desta atividade.
