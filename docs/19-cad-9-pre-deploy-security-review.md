# 19 - CAD-9: revisão de segurança pré-deploy

## Identificação

- **Data da revisão:** 21 de novembro de 2026.
- **Branch:** `feature/cad-9-security-predeploy-review`.
- **Commit-base:** `ddda9ee`.
- **Escopo:** autenticação e sessão, autorização por `userId`, cadastro, segredos e configuração, uploads CSV, headers e cache, dependências, histórico Git e fronteiras de liberação.
- **Fora do escopo:** implementação da CAD-19 ou CAD-20, configuração de Vercel/Neon, deploy, pentest e uso de dados financeiros reais.

Esta revisão usa apenas código, configuração versionada, dados sintéticos e o banco de integração descartável. Nenhum `.env` real, token, cookie, extrato ou descrição financeira foi copiado para a documentação ou para o Git.

## Decisão do gate

**A CAD-9 não aprova preview externo nem produção pública neste estado.** A revisão técnica e as correções locais estão concluídas, mas a liberação permanece bloqueada pela CAD-19 porque `/register` ainda permite criar novas contas. A CAD-20 continua fora desta entrega e não deve ser iniciada como se o gate estivesse aprovado.

| Destino | Decisão em 21/11/2026 | Motivo |
|---|---|---|
| Desenvolvimento local | Permitido | Controles atuais, banco local e dados sintéticos |
| Preparação da CAD-20 | Bloqueada | CAD-19 ainda precisa fechar o cadastro |
| Preview externo restrito | Não aprovado | Cadastro aberto e controles de deployment ainda não validados |
| Produção pública | Não aprovada | Riscos operacionais e de privacidade permanecem incompatíveis com exposição pública |

## Controles confirmados

- Tokens de sessão são aleatórios; somente o hash é persistido.
- O cookie de sessão é `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Rotas e Actions protegidas revalidam a sessão no servidor; a presença do cookie no middleware não é tratada como autorização.
- Consultas e mutações financeiras inspecionadas derivam e filtram por `userId`.
- As relações financeiras multiusuário existentes possuem proteção estrutural por FKs compostas.
- O upload CSV limita tamanho, extensão e MIME type e valida byte nulo, UTF-8 e estrutura antes da persistência.
- Logs da aplicação evitam conteúdo financeiro bruto e payloads de erro do Prisma.
- `.env` real e a pasta local `Alinhamentos/` permanecem fora do versionamento.

## Correções aplicadas nesta revisão

### Headers e cache

A aplicação passou a emitir globalmente:

- `Content-Security-Policy` mínima para bloquear objetos, framing, alteração de `base-uri` e envio de formulários para outra origem;
- `Permissions-Policy` para desabilitar câmera, geolocalização e microfone;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY` e `frame-ancestors 'none'`;
- desativação de DNS prefetch e políticas legadas cross-domain;
- remoção do header informativo `X-Powered-By`.

Respostas do middleware para rotas protegidas, inclusive redirects sem sessão, recebem `Cache-Control: private, no-store`, `Pragma: no-cache` e `Expires: 0`. HSTS não foi adicionado localmente: ele depende de HTTPS e deve ser confirmado no deployment real.

### Dependências

Atualizações compatíveis do lockfile removeram os advisories diretamente corrigíveis sem troca de major. O grafo validado contém `next@15.5.29`, `zod@4.6.7`, `vitest@4.1.12` e `sharp@0.35.5`.

Permanece o `postcss@8.4.31` interno do Next 15. O resumo do `npm audit` registra uma vulnerabilidade alta em PostCSS e uma moderada atribuída ao Next por esse caminho transitivo. A correção sugerida pelo npm exige `--force` e migração para Next 16, mudança incompatível e não autorizada na CAD-9. No desenho atual, CSS é controlado pelo repositório e processado no build; não existe entrada de CSS do usuário. Esse aceite é restrito ao desenvolvimento local e deve ser reavaliado antes de qualquer exposição externa ou novo caminho de CSS não confiável.

### Histórico Git e segredos

Uma varredura heurística do histórico versionado procurou padrões de segredo e classificou os resultados encontrados como exemplos, placeholders ou configuração local sintética. Não houve correspondência não classificada. A ferramenta dedicada `gitleaks` não estava disponível; portanto, este resultado não substitui uma varredura dedicada no pipeline futuro.

## Bloqueadores e riscos residuais

### Bloqueador imediato — CAD-19

O cadastro continua funcional para qualquer e-mail válido. Para um preview destinado apenas ao proprietário, isso permite contas não autorizadas e contraria a premissa de acesso restrito. A CAD-19 deve fechar o cadastro antes de nova decisão da CAD-9.

### Validações dependentes de deployment

Somente o ambiente real poderá comprovar:

- TLS e HSTS;
- preservação segura de `Host`, `Origin` e `X-Forwarded-Host`;
- cookies e redirects sob o domínio final;
- logs, observabilidade e retenção do provedor;
- privilégios, conexões, backups e descarte no PostgreSQL hospedado;
- comportamento de múltiplas instâncias e controles de borda.

Essas verificações não autorizam antecipar a implementação da CAD-20 nem o deploy da CAD-21.

### Produção pública

Dados financeiros continuam em claro no PostgreSQL e acessíveis a operadores com privilégio direto. Também permanecem pendentes políticas operacionais de backup, retenção, descarte, rate limiting de operações autenticadas e gestão global de sessões. Por isso, a conclusão desta revisão não equivale a aprovação de produção pública.

## Evidências de validação

Resultados executados em 21 de novembro de 2026:

- `npm test`: 188 testes aprovados em 21 arquivos;
- `npm run test:integration`: 87 testes aprovados em 17 arquivos, exclusivamente no banco descartável `money_flow_test` em `127.0.0.1:5434`, removido ao final;
- `npm run lint` e `npx --no-install tsc --noEmit`: aprovados;
- `npx --no-install prisma validate`: aprovado contra a configuração sintética de teste;
- `npm run build`: aprovado com Next 15.5.29 e conexão direcionada ao banco de teste;
- inspeção HTTP da build em `127.0.0.1:3100`: headers globais presentes em `/`, `/login` e `/dashboard`; redirect sem sessão de `/dashboard` com `private, no-store`, `Pragma: no-cache` e `Expires: 0`;
- `npm audit --omit=dev` e `npm audit`: zero vulnerabilidades críticas, uma alta e uma moderada, ambas no caminho do PostCSS interno descrito acima;
- `git diff --check` e inspeção final do escopo versionado: executados antes da publicação da branch.

O Vitest emitiu um aviso não bloqueante sobre o carregamento futuro de configuração ESM/CJS. Ele não alterou os resultados e não foi suprimido nesta atividade.

## Critério para reabrir o gate

Depois da CAD-19, a CAD-9 deve confirmar novamente o cadastro fechado e repetir os gates relevantes. Somente então poderá decidir se a CAD-20 pode começar. A aprovação da CAD-20 ainda não autoriza deploy: a CAD-21 deverá validar o ambiente real com conta e dados exclusivamente sintéticos.
