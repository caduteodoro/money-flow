# 16 - Sprint 5 - Consolidacao de seguranca, privacidade e prontidao tecnica

## Objetivo e checkpoint

O Bloco 6 consolida a postura comprovada do Money Flow sem implementar novas mitigacoes, infraestrutura ou features. A auditoria partiu de `f24d313766aa18de6dbce79104771ee69d0b734c`, com `SEC-005`, `SEC-006` e `SEC-007` mitigados, Bloco 5 concluido e Sprint 5 aberta.

O resultado e uma fotografia tecnica, nao uma autorizacao de deploy. Uso local, preview restrito e producao publica possuem fronteiras distintas.

## Metodologia

Foram inspecionados o threat model, README, seguranca/privacidade, roadmap, backlog, arquitetura, modelo de dados, documentos das Atividades 5.1 a 5.3, codigo server-side, middleware, schema, nove migrations, lockfile e suites automatizadas. A evidência foi classificada na seguinte ordem:

1. constraint ou comportamento observado no PostgreSQL real descartavel;
2. teste de integracao atravessando Prisma, servico ou action real;
3. teste unitario de contrato ou falha;
4. inspecao estatica contextualizada;
5. documentacao, apenas como registro e nunca como prova isolada.

Foram executadas auditorias npm informativas separadas para producao e grafo completo, sem `npm audit fix`, atualizacao ou relatorio bruto versionado. Todas as fixtures e valores usados foram sinteticos.

## Matriz consolidada dos achados

| ID | Titulo atual | Severidade original | Risco original | Controle e evidencia | Risco residual | Status consolidado | Impacto de liberacao | Proxima recomendacao |
|---|---|---|---|---|---|---|---|---|
| `SEC-001` | Rate limiting parcial em autenticacao | Alta | brute force, enumeracao e custo de bcrypt/logs | Login e cadastro usam buckets PostgreSQL atomicos, identidade normalizada, HMAC, scopes separados e testes unitarios/PostgreSQL | sem IP/origem, abuso distribuido e demais operacoes | Mitigado parcialmente | local aceitavel; uso restrito exige acesso controlado; bloqueia exposicao publica sem camada complementar | validar topologia, origem e comportamento operacional do `fail-open` |
| `SEC-002` | Dados financeiros em claro e acesso operacional | Alta | operador ou credencial do banco acessa dados financeiros | isolamento por `userId`, FKs compostas, ausencia de tela administrativa e logs minimizados | operador privilegiado e backups veem dados em claro | Bloqueador de producao publica | local aceitavel; restrito somente com operacao controlada; impede producao publica | definir modelo de operador, privilegios, criptografia e chaves |
| `SEC-003` | Operacoes dispendiosas sem limitacao | Media | repeticao/paralelismo de preview, importacao e regras | autenticacao, CSV de ate 2 MB, validacao e transacoes | sem cotas de frequencia ou concorrencia | Mitigado parcialmente | risco conhecido em uso restrito pequeno; bloqueia producao publica | definir cotas por usuario/operacao e testes de concorrencia |
| `SEC-004` | Enumeracao de e-mail no cadastro | Media | confirmar existencia de conta | resposta/destino neutros, sem login automatico, unique atomica, limiter e testes unitarios/PostgreSQL | tempo e login posterior ainda permitem inferencia | Mitigado | nao bloqueia uso restrito; residual deve ser reavaliado antes de fluxo publico | medir timing em ambiente representativo |
| `SEC-005` | Isolamento relacional multiusuario | Media | associacoes cruzadas entre tenants | filtros `userId`, seis FKs compostas, testes `P2003`, catalogo, rollback e recriacao | escritor privilegiado ou constraint desabilitada | Mitigado | nao bloqueia; preservar regressao em toda mudanca relacional | manter filtros da aplicacao e constraints |
| `SEC-006` | Unicidade estrutural de categorias | Media | categorias equivalentes concorrentes | `comparisonKey`, unique de filhos, indice parcial de raizes, testes concorrentes/SQL/Prisma | escritor direto deve manter chave; indice parcial depende da migration | Mitigado | nao bloqueia; migration manual e fonte de verdade | preservar funcao canonica, migration e testes |
| `SEC-007` | Exclusao segura e retencao minima | Media | dados e sessoes sobrevivem a exclusao | senha/frase, transacao unica, todas as sessoes, logs/buckets exatos, dois tenants e rollback PostgreSQL | audit logs operacionais e backups sem politica | Mitigado | banco ativo nao bloqueia; `BCK-032/033` bloqueiam declaracao operacional completa | definir retencao e restore sem reintroducao |
| `SEC-008` | Advisories no grafo de dependencias | Media no registro original | XSS condicional em PostCSS | nenhum caminho CSS dinamico identificado; auditoria npm atualizada | 4 pacotes altos no grafo de producao e 6 no completo, incluindo `next` direto | Bloqueador de uso restrito | impede exposicao externa, inclusive preview, ate triagem/atualizacao compativel | atividade dedicada de dependencias, sem fix forcado |
| `SEC-009` | CSRF e validacao de Origin | Baixa condicional | action autenticada acionada por origem externa | Next compara `Origin` com host, `SameSite=Lax` e teste local same/cross-origin | proxy futuro pode reescrever headers | Mitigado parcialmente | local comprovado; bloqueia uso restrito ate teste atras do proxy real | repetir teste no deployment escolhido |
| `SEC-010` | Logs de erro do Prisma | Media preliminar | erro registra identificador ou dado sensivel | respostas publicas sao controladas; teste sintetico confirmou que `P2002` loga e-mail | logger de producao permanece em `error`; outros erros nao caracterizados | Bloqueador de uso restrito | local sintetico aceitavel; dados pessoais reais nao devem entrar nesses logs | definir redaction/configuracao e teste de regressao antes de preview |
| `SEC-011` | Gestao limitada de sessoes antigas | Baixa | sessao roubada permanece valida | token forte em hash, cookie seguro, expiracao fixa, logout fail-closed e exclusao de conta revoga todas | sem painel, logout global ou revogacao por evento | Aceito temporariamente | aceitavel em preview restrito com risco conhecido; reavaliar para producao publica | decidir gestao/revogacao global em atividade futura |
| `SEC-012` | Headers de seguranca ausentes | Baixa | menor defesa contra framing, MIME e outros vetores | escape React e cache privado em login/cadastro | CSP, anti-framing, nosniff e politicas finais ausentes; HSTS depende do deploy | Bloqueador de producao publica | pode ser aceito temporariamente em preview controlado; impede producao publica | desenhar headers e validar HTTPS/cache no Bloco 7 |
| `SEC-013` | CSV Injection sem caminho atual | Informativa | formula futura em arquivo exportado | nao existe exportacao e React escapa a renderizacao | requisito pode ser esquecido em feature futura | Nao aplicavel ou superado | nao bloqueia o produto atual | tornar neutralizacao criterio de qualquer exportacao futura |

## Fronteiras de liberacao

### Ambiente local

O uso exclusivamente local pelo desenvolvedor e compativel com a postura atual. Continuam necessarios dados ficticios, banco de desenvolvimento isolado, segredos fora do Git e ausencia de extratos reais.

### Uso restrito

O codigo nao esta pronto, por si so, para preview externo. Antes de convidar pessoas, precisam ser resolvidos:

- `SEC-008`: advisories altos no grafo executavel;
- `SEC-009`: teste de Origin/Host atras do proxy real;
- `SEC-010`: e-mail observado em log de erro Prisma;
- controle de acesso e protecao da origem coerentes com o preview restrito, sem presumir `BCK-031` implementado.

Com esses bloqueadores resolvidos, `SEC-003`, `SEC-011` e parte de `SEC-012` podem permanecer riscos conhecidos em um grupo pequeno, desde que haja limite operacional, acesso controlado e monitoramento definido.

### Producao publica

Producao publica exige tambem tratamento de `SEC-002`, limites para operacoes dispendiosas, headers/HTTPS/cache finais, politicas de audit logs e backups, privilegios do banco, observabilidade, restore seguro e reavaliacao de dependencia/infraestrutura. O Bloco 6 nao seleciona provedor, Cloudflare, dominio ou arquitetura cloud.

## Inventario dos controles comprovados

- autenticacao: bcrypt, respostas controladas, cadastro neutro e sessao server-side;
- sessao: token aleatorio, apenas hash no banco, cookie HTTP-only/SameSite, expiracao e revogacao fail-closed;
- rate limiting: PostgreSQL, HMAC, scopes de login/cadastro, concorrencia atomica e `fail-open` restrito;
- autorizacao: `requireCurrentUser`, IDs do cliente tratados como nao confiaveis e filtros `userId` nos servicos financeiros;
- banco: seis FKs compostas, unicidade estrutural de categorias, dedupe por usuario e exclusao transacional;
- importacao: tamanho, extensao, MIME, UTF-8, byte nulo, estrutura, parser, dedupe e ausencia de CSV bruto;
- privacidade: sem tela administrativa financeira, respostas genericas e audit logs minimizados;
- testes: PostgreSQL 16 descartavel com guardrail, migrations reais e fixtures sinteticas.

## Cobertura automatizada e BCK-011

A fundacao da Sprint 5 cobre autenticacao/sessao, rate limiting, autorizacao de categorias/regras/transacoes, FKs compostas, unicidade concorrente e exclusao/rollback. Ela nao equivale a uma suite completa do produto.

`BCK-011` permanece **Backlog**. Seu escopo explicito inclui parser CSV, normalizacao financeira, dedupe, filtros de data e fluxos de sessao/importacao. Sessao recebeu cobertura robusta, mas parser CSV, regras de datas do dashboard e o fluxo integral de preview/importacao nao possuem cobertura equivalente. `BCK-020` concluido comprova hardening especifico, nao encerra o item amplo.

## Logs e correlacionabilidade

Audit logs persistem `userId` quando disponivel e hashes SHA-256 de e-mail, IP e user-agent. Buckets usam HMAC por identidade. A exclusao de conta remove vinculos diretos, `emailHash` exato e os quatro digests de login/cadastro; hashes globais de IP/user-agent nao sao apagados por aproximacao porque podem ser compartilhados.

O logger Prisma configurado com `error` em producao foi caracterizado em banco descartavel: uma colisao sintetica `P2002` incluiu o e-mail sintetico na saida capturada, mas nao incluiu os hashes sinteticos de senha. Isso confirma risco de correlacionabilidade e impede uso com dados pessoais reais antes de uma politica/configuracao de logging segura.

## Dependencias e configuracao

As versoes instaladas foram conferidas contra `package.json`, lockfile e `npm ls`. Em 8 de agosto de 2026, `npm audit --omit=dev` reportou quatro vulnerabilidades altas no grafo de producao: `next` direto e transitivas em `postcss`, `nanoid` e `sharp`. `npm audit` reportou seis altas no total, acrescentando `brace-expansion` e `js-yaml` no grafo completo. O resultado substitui a fotografia historica de um unico advisory moderado de PostCSS.

Nao houve `npm audit fix`, alteracao de versao ou edicao de `package.json`/lockfile. `RATE_LIMIT_HMAC_SECRET` exige pelo menos 32 bytes; `.env` e logs sao ignorados pelo Git. `next.config.ts` habilita apenas strict mode e nao declara headers ou configuracao especial de proxy/origem.

## Retencao, backups e riscos aceitos

`BCK-032` e `BCK-033` permanecem Backlog, P1 e fora da Sprint 5 atual. Nao existe politica operacional definitiva de audit logs, prazo de expurgo de backups ou prevencao de reintroducao de contas em restore. A mitigacao de `SEC-007` vale para o banco ativo, nao para copias externas.

Sao aceitos temporariamente apenas no contexto local ou restrito controlado: gestao limitada de sessoes, ausencia parcial de headers e ausencia de cotas nas operacoes autenticadas, sempre observadas as fronteiras acima.

## GAPs sem novos IDs

Nenhum ID foi criado. Permanecem como recomendacoes a rastrear por decisao futura:

- redaction ou desativacao segura dos logs de erro Prisma;
- triagem/atualizacao compativel dos advisories atuais;
- cotas e limites de concorrencia para operacoes dispendiosas;
- pacote de headers, cache e HTTPS/HSTS;
- roteiro reproduzivel de validacao de proxy, Origin e host.

## Recomendacoes para o Bloco 7

1. nao integrar nem liberar preview antes de tratar `SEC-008` e `SEC-010`;
2. escolher uma topologia apenas para validacao e repetir CSRF/Origin, host, cookies e redirects atras do proxy;
3. validar headers, cache autenticado, HTTPS/HSTS e protecao contra acesso direto a origem;
4. definir gates objetivos para uso restrito e producao publica;
5. preservar a regressao completa, as nove migrations e a separacao do banco de desenvolvimento;
6. levar `BCK-011`, `BCK-012`, `BCK-031`, `BCK-032` e `BCK-033` sem promove-los automaticamente.

## Limitacoes

Nao houve pentest, deploy, proxy real, provedor cloud, dados reais, teste de backup/restore, alteracao de dependencia ou avaliacao de acesso operacional real. A auditoria npm reflete o registry no instante da execucao e pode mudar. Buscas textuais foram usadas somente para localizar candidatos; conclusoes foram baseadas no contexto do codigo e nos testes.
