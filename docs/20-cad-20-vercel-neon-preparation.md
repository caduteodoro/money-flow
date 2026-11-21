# 20 - CAD-20: preparação para Vercel e Neon

## Identificação

- **Data:** 21 de novembro de 2026.
- **Branch:** `feature/cad-20-vercel-neon-prep`.
- **Base:** commit `3a7d7b5`, resultado técnico da CAD-9.
- **Escopo:** conexão pooled/direct, execução controlada de migrations, geração do Prisma Client, contrato de variáveis, proteção de arquivos locais e limite de upload das Server Actions.
- **Fora do escopo:** criar projetos ou credenciais em Neon/Vercel, fechar cadastro, liberar preview externo, fazer deploy ou executar smoke test cloud.

A CAD-20 foi iniciada por autorização explícita mesmo com a CAD-9 ainda bloqueada pela CAD-19. Isso antecipa somente a preparação técnica e não altera a decisão negativa do gate externo.

## Arquitetura de conexão

O projeto permanece em Prisma ORM 5.22 e usa os dois canais suportados pelo datasource:

| Variável | Consumidor | Endpoint Neon | Finalidade |
|---|---|---|---|
| `DATABASE_URL` | Prisma Client no runtime | pooled, hostname com `-pooler` | queries e mutações das funções serverless |
| `DIRECT_URL` | Prisma CLI | direto, hostname sem `-pooler` | `prisma migrate deploy` e operações administrativas controladas |

O `directUrl` foi adicionado ao datasource existente. Não houve alteração de modelo, tabela, índice ou migration. Em desenvolvimento e nos testes locais, as duas variáveis podem apontar para a mesma instância PostgreSQL direta.

Referências: [Prisma com Neon](https://www.prisma.io/docs/orm/v6/overview/databases/neon) e [datasources no Prisma ORM 6 e anteriores](https://docs.prisma.io/docs/orm/v6/prisma-schema/overview/data-sources).

## Build e migrations

O `package.json` agora define:

- `postinstall`: executa `prisma generate`, evitando Prisma Client desatualizado no cache de dependências da Vercel;
- `deploy:check`: valida o contrato das variáveis sem imprimir valores;
- `vercel-build`: valida o ambiente, regenera o client, executa `prisma migrate deploy` e somente depois chama `next build`.

O fluxo não usa `prisma migrate dev` nem `prisma db push` no ambiente hospedado. `migrate deploy` aplica apenas migrations versionadas ainda pendentes. A CAD-21 deverá confirmar o banco e o ambiente corretos antes da primeira execução real.

Cada ambiente da Vercel deve usar uma branch ou banco Neon separado. Preview não pode compartilhar o banco de produção, pois o build executa migrations no destino configurado. Se essa separação não estiver pronta, o preview não deve ser criado.

Referência: [deploy do Prisma na Vercel](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel).

## Variáveis e segredos

Configurar como **Secret** no projeto Vercel, separadamente para Preview e Production:

- `DATABASE_URL` — URL pooled do Neon com TLS;
- `DIRECT_URL` — URL direta do mesmo endpoint, usuário e banco, com TLS;
- `RATE_LIMIT_HMAC_SECRET` — valor aleatório exclusivo por ambiente, com pelo menos 32 caracteres.

O validador rejeita ausência, placeholders, URLs sem TLS, provedor diferente de Neon, runtime sem pooler, migration URL com pooler e divergência de endpoint, usuário ou banco. Mensagens de erro citam somente o nome ou o papel da variável; credenciais não são exibidas.

Alterações em variáveis da Vercel só alcançam novos deployments. A rotação deve manter a credencial anterior ativa até validar o novo deployment e só então revogá-la. Nenhum valor real pertence ao Git, comentários do Linear, logs ou documentação.

Referência: [variáveis de ambiente da Vercel](https://vercel.com/docs/environment-variables).

## Upload CSV e Server Actions

O domínio continua rejeitando CSV acima de 2 MiB. O `bodySizeLimit` das Server Actions foi configurado em 3 MB porque o limite do framework vale para o corpo inteiro da requisição, incluindo o overhead multipart. Assim, o transporte não rejeita prematuramente um arquivo ainda permitido pelo domínio.

Esse limite permanece abaixo do limite padrão de payload das Vercel Functions e não habilita o opt-in beta para corpos maiores. Extensão, MIME type, byte nulo, UTF-8, estrutura e conteúdo continuam sendo validados no servidor.

Referências: [limite das Server Actions](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) e [limites das Vercel Functions](https://vercel.com/docs/functions/limitations).

## Proteção de arquivos locais

`.vercelignore` impede que um deploy disparado pela CLI local inclua:

- arquivos `.env`;
- `Alinhamentos/`;
- `raio-x-repositorio.md`;
- arquivos CSV e OFX.

O fluxo por integração Git já recebe somente conteúdo versionado, mas essa segunda camada preserva a mesma regra de privacidade para a CLI.

## Checklist da CAD-21

Antes de qualquer deploy real:

1. concluir a CAD-19 e repetir o gate da CAD-9;
2. criar branches/bancos Neon distintos para Preview e Production;
3. copiar as URLs pelo painel do Neon sem registrá-las em terminal, issue ou documento;
4. cadastrar as três variáveis como Secret nos ambientes corretos da Vercel;
5. confirmar que `DATABASE_URL` é pooled e `DIRECT_URL` é direta;
6. executar o build somente contra o banco sintético escolhido e conferir as migrations aplicadas;
7. validar TLS, HSTS, `Origin`/`Host`, cookies, redirects e logs no domínio real;
8. executar smoke test apenas com conta e dados fictícios;
9. não liberar produção pública enquanto os bloqueadores de privacidade permanecerem abertos.

## Evidências de validação

Resultados executados em 21 de novembro de 2026:

- `npm test`: 193 testes aprovados em 22 arquivos;
- `npm run test:integration`: 87 testes aprovados em 17 arquivos, somente em `money_flow_test` no PostgreSQL descartável `127.0.0.1:5434`, com URLs e HMAC sintéticos impostos pelo runner e ambiente removido ao final;
- `npm run deploy:check`: aprovado com URLs e segredo exclusivamente sintéticos, sem eco de credenciais;
- `npx --no-install prisma validate` e `prisma generate`: aprovados com `DATABASE_URL` e `DIRECT_URL` sintéticas;
- `prisma migrate deploy`: nove migrations aplicadas do zero no banco descartável;
- `npm run lint` e `npx --no-install tsc --noEmit`: aprovados;
- `npm run postinstall` e `npm run build`: aprovados com Next 15.5.29 e o banco de teste isolado;
- `npm audit --omit=dev` e `npm audit`: zero críticas, uma alta e uma moderada no PostCSS interno já documentado na CAD-9;
- `git diff --check`: aprovado antes da publicação.

O Vitest manteve o aviso não bloqueante sobre o futuro carregador nativo de configuração ESM/CJS. O build do Next identifica `serverActions` como configuração experimental nesta versão; o limite foi aceito pelo compilador e coberto por teste.

A ausência de contas cloud significa que a topologia real, os segredos e o deploy continuam não validados e pertencem à CAD-21.
