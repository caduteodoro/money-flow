# 11 - Threat Model de Segurança

## Identificação

- **Sprint e bloco:** Sprint 5, Bloco 1, Atividade 1.2.
- **Data da avaliação:** 11 de julho de 2026.
- **Commit-base:** `dddb1c2`.
- **Escopo:** autenticação, sessões, autorização, importação CSV, categorias, regras, transações, dashboard, audit logs, Prisma, PostgreSQL, configuração e dependências.
- **Metodologia:** inspeção estática do código e da documentação, inventário de pontos de entrada e fronteiras de confiança, matriz de isolamento por `userId`, auditorias não destrutivas com `npm audit --omit=dev` e `npm audit` e validações locais controladas da Atividade 1.3.

As validações adicionais usaram uma build de produção local, requisições sintéticas sem sessão válida e inspeção das dependências instaladas. A avaliação não incluiu pentest, infraestrutura de produção, banco descartável, dados reais, backups ou testes dinâmicos com contas autenticadas. Severidades preliminares podem mudar após validação. Nenhum dado financeiro real, segredo ou identificador pessoal foi usado.

## Contexto e arquitetura

### Ativos protegidos

- Credenciais, tokens e sessões.
- Identidade e e-mail do usuário.
- Extratos, descrições, valores, contas, importações e transações.
- Categorias, regras e preferências do usuário.
- Audit logs, hashes e metadados operacionais.
- Integridade, disponibilidade e configuração da aplicação e do banco.

### Atores relevantes

- Usuário legítimo.
- Cliente remoto não autenticado.
- Usuário autenticado tentando acessar outro usuário.
- Arquivo CSV e IDs enviados pelo navegador, sempre não confiáveis.
- Operador ou agente com acesso à aplicação, infraestrutura ou PostgreSQL.
- Dependência externa comprometida ou vulnerável.

### Fronteiras de confiança

O fluxo principal observado é:

```text
Navegador
  -> middleware
  -> validação server-side da sessão
  -> Server Action ou página server-side
  -> serviço de domínio
  -> Prisma
  -> PostgreSQL
```

O middleware verifica apenas a presença do cookie nas rotas protegidas; ele não autentica o token. A autenticação efetiva ocorre no servidor por `getCurrentSession` e `requireCurrentUser`. As páginas e Actions protegidas inspecionadas fazem essa segunda validação, portanto o middleware funciona como redirecionamento antecipado, não como fronteira única de autorização.

## Superfície de ataque

| Área | Superfície observada | Fronteira principal |
|---|---|---|
| Rotas públicas | `/`, `/login`, `/register` | Credenciais, enumeração e abuso automatizado |
| Rotas protegidas | `/dashboard`, `/import`, `/transactions`, `/categories`; `/settings` está no matcher | Cookie e parâmetros não confiáveis; sessão revalidada no servidor |
| Server Actions | Login, cadastro, logout, preview/importação, categorias, regras e categorização | `FormData`, IDs e arquivo controlados pelo cliente |
| Route Handlers/APIs | Nenhum encontrado | Não aplicável no estado avaliado |
| Autenticação e sessão | Criação, validação, expiração e encerramento | Roubo, reutilização e retenção de sessão |
| Upload e parser CSV | Preview e confirmação de CSV estilo Nubank | Arquivo hostil, consumo de recursos e conteúdo financeiro |
| Prisma e PostgreSQL | Consultas, mutações, agregações e transações | Isolamento horizontal, integridade e privilégio do banco |
| Dashboard | KPIs, gráficos, insights e últimas transações | Exposição de descrições e valores ao navegador autenticado |
| Audit logs | Autenticação e importação | Metadados, hashes, retenção e acesso operacional |
| Configuração | `DATABASE_URL`, PostgreSQL, `NODE_ENV` e cookies | Segredos, TLS, proxy e diferenças de produção |
| Dependências | Next.js, React, Prisma, bcryptjs, Zod e dependências transitivas | Vulnerabilidades e atualização segura |

## Controles comprovados

- Senhas armazenadas com bcrypt e custo 12.
- Token de sessão aleatório de 32 bytes; apenas seu SHA-256 é persistido.
- Cookie de sessão `httpOnly`, `SameSite=Lax`, `Secure` em produção, restrito a `/` e com expiração.
- Sessão validada no servidor; sessão vencida é rejeitada e removida.
- `userId` das operações protegidas derivado da sessão, não do navegador.
- Recursos sensíveis buscados por `id + userId`; mutações críticas também incluem `userId`.
- Respostas controladas para recursos inexistentes ou alheios nos serviços avaliados.
- Deduplicação por `userId + dedupeKey`, transação de banco e `skipDuplicates`.
- CSV limitado a 2 MB e validado por extensão, MIME type, UTF-8, byte nulo e estrutura.
- Erros internos de importação, categorias, regras e transações não são repassados diretamente ao cliente.
- Audit logs usam hashes ou metadados agregados e não registram descrições ou valores individuais.
- Não há `dangerouslySetInnerHTML`, Route Handler público nem tela administrativa de transações no estado avaliado.

## Matriz de riscos

Os status usados são: **Confirmado**, **Parcialmente confirmado**, **Requer validação**, **Mitigado pelo framework no ambiente testado**, **Informativo** e **Planejado para pré-produção**.

### SEC-001 - Rate limiting parcial em autenticação

- **Categoria:** autenticação e disponibilidade.
- **Status da evidência:** Parcialmente confirmado.
- **Cenário:** cliente automatiza login, cadastro ou geração de audit logs.
- **Evidência técnica:** `loginAction` aplica 5 tentativas por minuto e 10 por 15 minutos; `registerAction` aplica 3 tentativas por 15 minutos e 5 por hora. Ambas derivam buckets persistentes por HMAC da identidade normalizada antes de banco e bcrypt.
- **Impacto:** tentativa de tomada de conta, uso intensivo de bcrypt e crescimento de banco/logs.
- **Probabilidade:** média.
- **Severidade atual:** alta.
- **Aplicabilidade:** relevante antes de exposição pública; o impacto atual depende do ambiente local.
- **Controle existente:** janelas fixas atômicas no PostgreSQL, HMAC-SHA-256 sem e-mail bruto nos buckets, bcrypt, resposta neutra durante bloqueios e testes unitários/integração em banco descartável.
- **Risco residual:** a proteção é por identidade; múltiplos e-mails, origens distribuídas e operações fora de login/cadastro permanecem vetores possíveis. O cadastro ainda expõe P2002 quando não está bloqueado.
- **Recomendação:** manter controles internos e avaliar borda confiável, limitação por origem e Turnstile antes de testadores externos.
- **Validação futura:** validar proxy/deployment, múltiplas instâncias, comportamento operacional do `fail-open` e abuso distribuído.

### SEC-002 - Dados financeiros em claro e acesso operacional

- **Categoria:** privacidade e proteção de dados.
- **Status da evidência:** Planejado para pré-produção.
- **Cenário:** credencial do banco comprometida ou operador privilegiado consulta transações.
- **Evidência técnica:** campos como descrição, valor e payload não têm criptografia de aplicação em `prisma/schema.prisma`; a documentação prevê criptografia futura.
- **Impacto:** exposição financeira ampla e implicações LGPD/GDPR.
- **Probabilidade:** baixa no ambiente local; dependente da operação futura.
- **Severidade atual:** alta no contexto pré-produção, não um bloqueio comprovado do desenvolvimento local.
- **Aplicabilidade:** requisito arquitetural antes de produção.
- **Controle existente:** isolamento lógico por `userId`, ausência de tela administrativa e minimização de logs.
- **Risco residual:** acesso direto ao banco contorna os controles de UI e serviço.
- **Recomendação:** definir threat model de operadores, classificar campos e avaliar criptografia e gestão de chaves sem prometer implementação imediata.
- **Validação futura:** revisar privilégios, backups e acesso operacional na infraestrutura escolhida.

### SEC-003 - Operações dispendiosas sem limitação

- **Categoria:** disponibilidade e abuso autenticado.
- **Status da evidência:** Confirmado.
- **Cenário:** preview, confirmação de CSV ou aplicação de regras são repetidos ou executados em paralelo.
- **Evidência técnica:** essas Actions não têm rate limiting; o arquivo é limitado a 2 MB, mas a frequência não é limitada.
- **Impacto:** consumo de CPU, memória, queries e crescimento do banco.
- **Probabilidade:** média após exposição pública.
- **Severidade atual:** média.
- **Aplicabilidade:** depende do volume, deployment e quantidade de instâncias.
- **Controle existente:** limite do arquivo, validação e transações de banco.
- **Risco residual:** repetição e concorrência permanecem possíveis.
- **Recomendação:** definir cotas por usuário/operação e limites de concorrência.
- **Validação futura:** uploads paralelos e aplicação repetida de regras.

### SEC-004 - Enumeração de e-mail no cadastro

- **Categoria:** autenticação e privacidade.
- **Status da evidência:** Confirmado.
- **Cenário:** atacante testa se determinados e-mails já possuem conta.
- **Evidência técnica:** `registerAction` retorna mensagem específica para violação de unicidade `P2002`.
- **Impacto:** confirmação de cadastro e apoio a phishing direcionado.
- **Probabilidade:** média; o limiter por identidade reduz repetição direta, mas não corrige a enumeração nem abuso distribuído.
- **Severidade atual:** média.
- **Aplicabilidade:** relevante em ambiente público; há trade-off de UX.
- **Controle existente:** normalização, unicidade de e-mail e rate limiting por identidade antes do bcrypt e da criação.
- **Risco residual:** diferença explícita na resposta.
- **Recomendação:** decidir conscientemente a política de resposta e combiná-la com rate limiting.
- **Validação futura:** comparar conteúdo, status e tempo entre e-mail existente e novo.

### SEC-005 - Isolamento relacional não garantido integralmente pelo banco

- **Categoria:** autorização e integridade do modelo.
- **Status da evidência:** Parcialmente confirmado.
- **Cenário:** novo serviço, script ou falha futura cria associação entre usuários.
- **Evidência técnica:** FKs de categoria pai, regra/categoria, transação/categoria, conta e importação não incorporam `userId`.
- **Impacto:** corrupção de integridade e potencial exposição cruzada.
- **Probabilidade:** baixa nos fluxos atuais, que revalidam propriedade.
- **Severidade atual:** média.
- **Aplicabilidade:** risco estrutural; não há exploração comprovada pelas Actions atuais.
- **Controle existente:** filtros e mutações por `id + userId` na camada de serviço.
- **Risco residual:** acesso direto ou novo caminho pode contornar o serviço.
- **Recomendação:** propor constraints compostas somente após inspeção de dados, impacto, rollback e aprovação.
- **Validação futura:** tentar relações cruzadas diretamente em banco de teste.

### SEC-006 - Unicidade de categorias raiz depende da aplicação

- **Categoria:** integridade e concorrência.
- **Status da evidência:** Parcialmente confirmado.
- **Cenário:** criações concorrentes geram categorias raiz equivalentes.
- **Evidência técnica:** `@@unique([userId, name, parentId])` inclui `parentId` anulável; a normalização comparativa ocorre no serviço.
- **Impacto:** árvore ambígua e regras inconsistentes.
- **Probabilidade:** baixa a média sob concorrência.
- **Severidade atual:** média.
- **Aplicabilidade:** risco de integridade, não acesso horizontal comprovado.
- **Controle existente:** busca de nomes equivalentes na aplicação.
- **Risco residual:** a verificação pode sofrer TOCTOU e a constraint não cobre de forma robusta raízes com `NULL`.
- **Recomendação:** avaliar índice/constraint apropriado sem presumir banco vazio.
- **Validação futura:** duas criações concorrentes do mesmo nome raiz.

### SEC-007 - Retenção e exclusão de dados não implementadas

- **Categoria:** privacidade e conformidade.
- **Status da evidência:** Planejado para pré-produção.
- **Cenário:** sessões, logs e dados financeiros permanecem além da finalidade ou solicitação do titular.
- **Evidência técnica:** não há fluxo de exclusão de conta nem política operacional de retenção e backups.
- **Impacto:** aumento do impacto de incidentes e risco LGPD/GDPR.
- **Probabilidade:** média quando houver operação real.
- **Severidade atual:** média.
- **Aplicabilidade:** requisito de produto e operação antes de produção.
- **Controle existente:** cascatas relacionais ao excluir usuário.
- **Risco residual:** não existe processo que acione e verifique exclusão completa.
- **Recomendação:** definir retenção, exclusão, exportação e tratamento de backups.
- **Validação futura:** ciclo de exclusão e conferência de cópias e relações.

### SEC-008 - Advisory transitivo de PostCSS

- **Categoria:** dependências e XSS.
- **Status da evidência:** Confirmado quanto ao advisory; sem caminho explorável identificado.
- **Cenário:** entrada não confiável alcança uma operação vulnerável de stringify de CSS.
- **Evidência técnica:** Next.js 15.5.19 resolve PostCSS 8.4.31 em sua cadeia, enquanto a dependência direta instalada resolve PostCSS 8.5.15. `npm audit --omit=dev` e `npm audit` reportaram o advisory de severidade moderada no grafo de produção.
- **Impacto:** XSS se existir caminho de exploração.
- **Probabilidade:** baixa no contexto observado; não foi encontrado caminho de entrada do usuário para geração ou stringify de CSS.
- **Severidade atual:** média segundo o advisory, condicionada ao contexto.
- **Aplicabilidade:** não há exploração comprovada no Money Flow.
- **Controle existente:** nenhum caminho de CSS dinâmico não confiável foi identificado.
- **Risco residual:** a versão vulnerável permanece no grafo de produção.
- **Recomendação:** acompanhar a dependência e avaliar atualização por caminho compatível; não aplicar correção forçada sem análise.
- **Validação futura:** reavaliar o caminho de exploração ao alterar geração de estilos ou atualizar o framework. Não foram executados `npm audit fix`, atualização forçada ou override.

### SEC-009 - CSRF e validação de Origin das Server Actions

- **Categoria:** integridade de requisições.
- **Status da evidência:** Mitigado pelo framework no ambiente testado; validação do proxy/deployment pendente.
- **Cenário:** origem externa tenta executar mutação autenticada.
- **Evidência técnica:** o handler de Server Actions do Next.js 15.5.19 compara `Origin` com `Host` ou `X-Forwarded-Host`. Uma requisição same-origin alcançou a camada de autenticação, enquanto uma requisição sintética com Origin divergente foi rejeitada como Server Action inválida.
- **Impacto:** alteração de recursos do usuário.
- **Probabilidade:** baixa no fluxo local testado; depende da preservação correta dos headers no deployment.
- **Severidade atual:** baixa no ambiente testado, condicionada ao deployment.
- **Aplicabilidade:** o teste local comprovou a mitigação do fluxo exercitado, não uma garantia para a infraestrutura futura.
- **Controle existente:** comparação nativa de origem do framework, `SameSite=Lax` como controle complementar e sessão server-side.
- **Risco residual:** proxy ou plataforma que reescreva incorretamente `Host`, `Origin` ou `X-Forwarded-Host` pode alterar a eficácia do controle.
- **Recomendação:** validar o comportamento no deployment antes de adicionar mecanismo próprio.
- **Validação futura:** repetir requisições same-origin e cross-origin reais atrás do proxy escolhido.

### SEC-010 - Conteúdo dos logs de erro do Prisma

- **Categoria:** logging e exposição de dados.
- **Status da evidência:** Requer validação.
- **Cenário:** erro do driver registra parâmetros ou contexto sensível.
- **Evidência técnica:** a configuração estática registra `error/warn` em desenvolvimento e `error` em produção. Nenhum erro real do Prisma foi provocado para evitar afetar os dados locais existentes; parâmetros, contexto e stack trace permanecem inconclusivos.
- **Impacto:** exposição operacional de metadados ou dados financeiros.
- **Probabilidade:** não confirmada.
- **Severidade atual:** média preliminar.
- **Aplicabilidade:** depende da observabilidade e do erro gerado.
- **Controle existente:** mensagens internas são convertidas em respostas genéricas em vários serviços.
- **Risco residual:** resposta controlada não garante log controlado.
- **Recomendação:** testar redaction em ambiente controlado.
- **Validação futura:** provocar erros fictícios representativos e inspecionar logs em banco ou ambiente descartável com dados sintéticos.

### SEC-011 - Gestão limitada de sessões antigas

- **Categoria:** sessão.
- **Status da evidência:** Confirmado.
- **Cenário:** sessão roubada continua válida depois de um novo login ou logout em outro dispositivo.
- **Evidência técnica:** estaticamente, cada login cria sessão independente, logout remove somente a sessão correspondente ao cookie atual, apenas `tokenHash` é persistido e a expiração é configurada para 30 dias. Dinamicamente, um cookie sintético inválido não autenticou o usuário.
- **Impacto:** prolongamento de acesso indevido.
- **Probabilidade:** baixa no estágio atual.
- **Severidade atual:** baixa.
- **Aplicabilidade:** pode aumentar antes de produção.
- **Controle existente:** token forte, cookie seguro e expiração.
- **Risco residual:** sem listagem ou revogação global.
- **Recomendação:** avaliar gestão de dispositivos e revogação em eventos sensíveis.
- **Validação futura:** testar dois logins reais simultâneos, logout independente, sessão persistida expirada e efeito sobre as demais sessões. Nenhum cenário de sessão roubada foi executado.

### SEC-012 - Headers de segurança não configurados explicitamente

- **Categoria:** defesa em profundidade.
- **Status da evidência:** Parcialmente confirmado.
- **Cenário:** ausência de CSP, proteção contra framing ou outras políticas amplia outro defeito.
- **Evidência técnica:** na build de produção local não foram observados `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` ou `X-Frame-Options`. Login e cadastro retornaram `Cache-Control: private, no-cache, no-store`; rotas protegidas redirecionaram sem sessão.
- **Impacto:** redução de defesa em profundidade.
- **Probabilidade:** baixa isoladamente.
- **Severidade atual:** baixa.
- **Aplicabilidade:** a ausência foi confirmada na aplicação testada. HSTS não foi conclusivamente avaliado porque o teste ocorreu em HTTP e depende de HTTPS/deployment; cache de página autenticada permanece pendente.
- **Controle existente:** escape padrão do React e ausência de `dangerouslySetInnerHTML`.
- **Risco residual:** políticas de navegador não confirmadas.
- **Recomendação:** avaliar os headers como hardening e defesa em profundidade. CSP exige decisão compatível com os recursos do frontend; nem todo header deve ser adotado sem análise.
- **Validação futura:** inspecionar HSTS e headers finais no deployment e o cache de páginas com sessão sintética válida.

### SEC-013 - CSV Injection sem caminho explorável atual

- **Categoria:** entrada e exportação futura.
- **Status da evidência:** Informativo.
- **Cenário:** campo iniciado por fórmula é futuramente exportado e aberto em planilha.
- **Evidência técnica:** descrições são renderizadas com escape do React; não existe exportação CSV/Excel.
- **Impacto:** execução de fórmula somente em um fluxo futuro de exportação.
- **Probabilidade:** sem caminho atual identificado.
- **Severidade atual:** informativa.
- **Aplicabilidade:** não é vulnerabilidade explorável no fluxo atual.
- **Controle existente:** não há exportação; React escapa HTML.
- **Risco residual:** requisito pode ser esquecido ao adicionar exportação.
- **Recomendação:** registrar neutralização como requisito de qualquer exportação futura.
- **Validação futura:** testar campos iniciados por `=`, `+`, `-` e `@` quando houver exportação.

## Isolamento por `userId`

| Domínio | Operações observadas | Proteção na aplicação | Proteção estrutural no banco | Risco residual |
|---|---|---|---|---|
| Usuário e sessão | Login, criar, validar e invalidar sessão | Sessão obtida do cookie; token validado server-side | Hash único e FK da sessão para usuário | Tentativas ilimitadas e gestão limitada de sessões |
| Importações | Preview, confirmação e histórico | `userId` da sessão; conta validada por `id + userId`; histórico por usuário | FKs simples; índices por usuário | Relações não incorporam `userId`; abuso de recursos |
| Transações | Listagem e categorização | Leitura por usuário; transação e categoria por `id + userId`; update por usuário | Dedupe composto; FK de categoria simples | Integridade entre usuários depende do serviço |
| Categorias | Listagem, criação e edição | Pai/recurso por `id + userId`; limite de hierarquia no serviço | FK de pai simples; unique com `parentId` anulável | Relação cruzada e duplicidade raiz não impedidas integralmente no banco |
| Regras | Listagem, criação, ativação e aplicação | Regra, categoria e transação filtradas por usuário; update só sem categoria | FK de categoria simples | Novo caminho fora do serviço pode criar associação cruzada |
| Dashboard | Count, aggregate e consulta do período | Todas as queries observadas filtram por `userId` | Índices por usuário e data | Dados do próprio usuário são enviados ao navegador por necessidade funcional |
| Audit logs | Autenticação e importação | ID do usuário quando disponível; metadados minimizados | FK anulável e índices | Retenção, acesso operacional e logs do Prisma não verificados |

As proteções dos fluxos atuais estão comprovadas na aplicação. O banco não garante sozinho que todos os lados de relações financeiras pertençam ao mesmo usuário. Qualquer migration futura exige inspeção dos dados existentes, proposta de rollback e aprovação explícita.

A Atividade 1.3 confirmou estaticamente que `userId` é derivado de `requireCurrentUser`; buscas e updates sensíveis usam `id + userId`; transação e categoria são validadas separadamente; categoria e regra precisam pertencer ao mesmo usuário; e importações, dashboard e agregações filtram por `userId`. Os serviços avaliados usam respostas controladas para recurso inexistente ou alheio. Permanecem pendentes teste dinâmico com dois usuários, concorrência, tentativa de inserção cruzada diretamente no banco, constraints compostas e validação da integridade estrutural. SEC-005 e SEC-006 não estão corrigidos.

## Rate limiting: controles atuais e candidatos restantes

| Operação | Abuso a mitigar | Prioridade preliminar |
|---|---|---|
| Login | Força bruta e credential stuffing | P0/P1 |
| Cadastro | Enumeração, spam e custo de bcrypt | P1 |
| Preview CSV | CPU, memória e consultas repetidas | P1 |
| Confirmação da importação | Escritas, concorrência e crescimento do banco | P1 |
| Aplicação de regras | Varreduras e updates repetidos | P1/P2 |
| Categorias e regras | Spam de recursos e mutações | P2 |
| Dashboard | Consultas e agregações repetidas | P2 |

Login e cadastro usam PostgreSQL compartilhado, chaves HMAC por identidade e `fail-open` restrito à indisponibilidade reconhecida do storage. Não há proteção por IP. Os demais candidatos continuam sem implementação; decisões de borda dependem da topologia de deployment, proxy confiável, quantidade de instâncias e custos. Cloudflare Access, WAF/rate limiting, Turnstile e proteção da origem permanecem em discovery como camadas complementares.

## Privacidade e retenção

- Descrições, valores e outros dados financeiros estão em claro no PostgreSQL; o sistema atual não é zero-knowledge.
- Isolamento por `userId` e ausência de tela administrativa reduzem exposição pela aplicação, mas não impedem acesso operacional direto ao banco.
- Audit logs atuais minimizam conteúdo usando hashes e agregados; logs reais do Prisma ainda precisam ser verificados.
- SHA-256 de e-mails e IPs reduz exposição direta, mas valores previsíveis podem ser submetidos a ataques de dicionário.
- Sessões têm expiração de 30 dias e logout da sessão atual; não há gestão global de dispositivos.
- Não há política implementada de retenção, exclusão do titular ou descarte de backups.
- Cascatas do schema ajudam uma futura exclusão, mas não constituem por si só processo LGPD completo.
- Criptografia, acesso operacional, retenção, exclusão e backups exigem desenho pré-produção; este documento não promete implementação imediata.

## Pontos pendentes de validação

### Validação local futura em ambiente descartável

- Testes dinâmicos de autorização com dois usuários.
- Dois logins simultâneos, logout independente e sessão persistida expirada.
- Conteúdo real dos logs do Prisma em erros representativos.
- Cache de páginas autenticadas.
- Concorrência em categorias, regras e importações.

### Validação de deployment e pré-produção

- Proxy e preservação de `Host`, `Origin` e `X-Forwarded-Host`.
- Confiabilidade de `x-forwarded-for`/`x-real-ip`.
- TLS, HSTS e headers finais.
- Múltiplas instâncias e armazenamento distribuído.
- Política e operação de backups, retenção e descarte.
- Privilégios do usuário PostgreSQL.
- Logs e observabilidade da plataforma.

O advisory de PostCSS continua acompanhado, sem caminho explorável identificado no contexto atual.

## Observações informativas das validações

A build local executada em `127.0.0.1:3100` gerou redirects para `http://localhost:3100/login`. Isso não demonstrou vulnerabilidade. O comportamento deve ser conferido futuramente na configuração de host e proxy do deployment, sem atribuição de severidade adicional enquanto não houver evidência de impacto.

## Critérios de decisão

- Nenhum risco crítico comprovado bloqueia a continuidade normal do Bloco 1.
- Riscos altos não entram automaticamente como implementação imediata; severidade, contexto e capacidade devem orientar o planejamento.
- SEC-001 foi mitigado para login e cadastro por identidade, mas permanece aberto para abuso distribuído, borda e outras operações.
- SEC-002 é requisito relevante antes de produção, não declaração de incidente ou bloqueio do desenvolvimento local.
- SEC-009 está mitigado pelo framework no ambiente testado, mas a conclusão depende da configuração do proxy/deployment.
- SEC-008 permanece no grafo de produção; ausência de caminho explorável identificado não elimina o advisory.
- Qualquer migration de hardening exige inspeção de dados, proposta técnica, impacto, rollback e aprovação explícita.
- Achados preliminares podem subir, cair ou ser encerrados após testes.

## Plano controlado

As próximas atividades propostas, ainda não concluídas nem automaticamente comprometidas com a Sprint 5, são:

1. Validações manuais de segurança.
2. Validar rate limiting no deployment e decidir proteção complementar de borda.
3. Hardening de autenticação e sessão.
4. Análise estrutural do modelo.
5. Privacidade e retenção.
6. Dependências e headers.
7. Testes automatizados e regressão.
