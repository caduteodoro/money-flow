# 11 - Threat Model de Segurança

## Identificação

- **Sprint e bloco:** Sprint 5, Bloco 1, Atividade 1.2.
- **Data da avaliação:** 11 de julho de 2026.
- **Commit-base:** `dddb1c2`.
- **Escopo:** autenticação, sessões, autorização, importação CSV, categorias, regras, transações, dashboard, audit logs, Prisma, PostgreSQL, configuração e dependências.
- **Metodologia:** inspeção estática do código e da documentação, inventário de pontos de entrada e fronteiras de confiança, matriz de isolamento por `userId`, auditorias não destrutivas com `npm audit --omit=dev` e `npm audit` e validações locais controladas da Atividade 1.3.

As validações iniciais usaram uma build de produção local, requisições sintéticas sem sessão válida e inspeção das dependências instaladas. As atividades posteriores acrescentaram PostgreSQL descartável e testes dinâmicos com contas sintéticas autenticadas, incluindo a exclusão de conta da Atividade 5.3. A avaliação não incluiu pentest, infraestrutura de produção, dados reais ou backups. Severidades preliminares podem mudar após validação. Nenhum dado financeiro real, segredo ou identificador pessoal foi usado.

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

Os estados consolidados do Bloco 6 são: **Mitigado**, **Mitigado parcialmente**, **Aceito temporariamente**, **Adiado**, **Bloqueador de uso restrito**, **Bloqueador de produção pública** e **Não aplicável ou superado**. O detalhe completo e as fronteiras de liberação estão em [`docs/16-sprint-5-security-consolidation.md`](16-sprint-5-security-consolidation.md).

### SEC-001 - Rate limiting parcial em autenticação

- **Categoria:** autenticação e disponibilidade.
- **Status consolidado:** Mitigado parcialmente.
- **Cenário:** cliente automatiza login, cadastro ou geração de audit logs.
- **Evidência técnica:** `loginAction` aplica 5 tentativas por minuto e 10 por 15 minutos; `registerAction` aplica 3 tentativas por 15 minutos e 5 por hora. Ambas derivam buckets persistentes por HMAC da identidade normalizada antes de banco e bcrypt.
- **Impacto:** tentativa de tomada de conta, uso intensivo de bcrypt e crescimento de banco/logs.
- **Probabilidade:** média.
- **Severidade atual:** alta.
- **Aplicabilidade:** relevante antes de exposição pública; o impacto atual depende do ambiente local.
- **Controle existente:** janelas fixas atômicas no PostgreSQL, HMAC-SHA-256 sem e-mail bruto nos buckets, bcrypt, resposta neutra durante bloqueios e testes unitários/integração em banco descartável.
- **Risco residual:** a proteção é por identidade; múltiplos e-mails, origens distribuídas e operações fora de login/cadastro permanecem vetores possíveis. O tratamento neutro de `P2002` mitiga enumeração direta, mas não esses vetores.
- **Recomendação:** manter controles internos e avaliar borda confiável, limitação por origem e Turnstile antes de testadores externos.
- **Validação futura:** validar proxy/deployment, múltiplas instâncias, comportamento operacional do `fail-open` e abuso distribuído.

### SEC-002 - Dados financeiros em claro e acesso operacional

- **Categoria:** privacidade e proteção de dados.
- **Status consolidado:** Bloqueador de produção pública.
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
- **Status consolidado:** Mitigado parcialmente.
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
- **Status consolidado:** Mitigado.
- **Cenário:** atacante testa se determinados e-mails já possuem conta.
- **Evidência técnica:** o Bloco 4 removeu a mensagem e o `fieldErrors.email` específicos. E-mail novo e duplicado usam o mesmo redirect e mensagem no login; cadastro não cria sessão nem cookie. Somente a unique constraint de `User.email` recebe tratamento neutro, e a criação permanece atômica sob concorrência.
- **Impacto:** confirmação de cadastro e apoio a phishing direcionado.
- **Probabilidade:** reduzida no fluxo direto; o limiter por identidade limita repetição, mas não impede inferência temporal, tentativa posterior de login ou abuso distribuído.
- **Severidade atual:** média.
- **Aplicabilidade:** relevante em ambiente público; há trade-off de UX.
- **Controle existente:** normalização, unicidade de e-mail, rate limiting por identidade antes de bcrypt/banco, destino e mensagem equivalentes e ausência de autenticação automática no cadastro.
- **Risco residual:** persistência e auditoria diferem internamente; tempo não foi caracterizado e um login posterior com a senha escolhida pode revelar que a conta nova foi criada.
- **Recomendação:** manter a resposta neutra e avaliar verificação de e-mail ou convite somente em evolução futura compatível com o produto.
- **Validação futura:** medir diferenças temporais em ambiente representativo e reavaliar o fluxo quando houver verificação de e-mail ou convite.

### SEC-005 - Isolamento relacional não garantido integralmente pelo banco (mitigado)

- **Categoria:** autorização e integridade do modelo.
- **Status consolidado:** Mitigado.
- **Cenário:** novo serviço, script ou falha futura cria associação entre usuários.
- **Evidência técnica:** duas migrations adicionaram chaves candidatas `id + userId` em `Category`, `BankAccount` e `StatementImport` e substituíram por FKs compostas as seis relações de pai, regra/categoria, transação/categoria, transação/conta, transação/importação e importação/conta.
- **Impacto:** corrupção de integridade e potencial exposição cruzada.
- **Probabilidade:** baixa; os fluxos revalidam propriedade e o PostgreSQL rejeita associação cruzada.
- **Severidade atual:** baixa, residual.
- **Aplicabilidade:** defesa estrutural comprovada em PostgreSQL 16 e Prisma 5.22.
- **Controle existente:** filtros e mutações por `id + userId` na aplicação, cinco FKs compostas com `NO ACTION` e uma FK composta com `CASCADE`.
- **Risco residual:** futuras exclusões funcionais de destinos opcionais precisam desvincular referências explicitamente pelo mesmo usuário; privilégios capazes de desabilitar constraints permanecem risco operacional.
- **Recomendação:** preservar os filtros da aplicação e os testes diretos das constraints em toda mudança relacional futura.
- **Validação realizada:** diagnóstico com zero anomalias; seis tentativas cruzadas rejeitadas; cascata, exclusão de usuário, atomicidade, recriação desde zero, drift e rollback aprovados em banco descartável.

### SEC-006 - Unicidade estrutural de categorias (mitigado)

- **Categoria:** integridade e concorrência.
- **Status consolidado:** Mitigado; Atividade 5.2 concluída.
- **Cenário:** criações ou renomeações concorrentes geravam categorias equivalentes no mesmo escopo.
- **Evidência técnica:** `Category.comparisonKey` guarda a chave canônica; filhos usam unique `userId + comparisonKey + parentId` e raízes usam índice único parcial `userId + comparisonKey` com `parentId IS NULL`.
- **Impacto:** árvore ambígua e regras inconsistentes.
- **Probabilidade:** baixa, residual para escritores privilegiados fora dos caminhos revisados.
- **Severidade atual:** baixa, residual.
- **Aplicabilidade:** garantia estrutural comprovada em PostgreSQL 16 e Prisma 5.22.
- **Controle existente:** precheck por chave no serviço, escrita conjunta de nome/chave e decisão atômica nos dois índices.
- **Risco residual:** futuros escritores diretos precisam gerar a chave canônica; o índice parcial não aparece declarativamente no schema do Prisma 5.22 e depende da migration versionada.
- **Recomendação:** preservar a migration, a função canônica e os testes diretos/concorrentes em toda nova escrita de categoria.
- **Validação realizada:** diagnóstico sem duplicidades, paridade TypeScript/SQL, bloqueio seguro de migration, criação e renomeação concorrentes, SQL/Prisma diretos, recriação desde zero e rollback descartável.

### SEC-007 - Exclusao segura de conta e retencao minima (mitigado)

- **Categoria:** privacidade e conformidade.
- **Status consolidado:** Mitigado; Atividade 5.3 concluida.
- **Cenário:** sessoes, logs e dados financeiros poderiam permanecer alem da solicitacao de exclusao do titular.
- **Evidência técnica:** `/settings` exige sessao, senha atual e frase exata; o servico remove dados, sessoes, logs e identificadores inequivocamente vinculaveis em uma unica transacao.
- **Impacto:** aumento do impacto de incidentes e risco LGPD/GDPR.
- **Probabilidade:** baixa no banco ativo; residual para backups e operacao.
- **Severidade atual:** baixa, residual.
- **Aplicabilidade:** requisito de produto e operação antes de produção.
- **Controle existente:** exclusao imediata e transacional, filtros explicitos por `userId`, remocao de todas as sessoes, `emailHash` e buckets HMAC exatos, cookie limpo somente apos commit e nenhuma persistencia de recibo ou tombstone.
- **Risco residual:** nao ha politica operacional de retencao/anonimizacao de audit logs nem expurgo de backups; restauracoes podem reintroduzir dados excluidos.
- **Recomendação:** tratar `BCK-032` e `BCK-033` antes da operacao real com backups.
- **Validação realizada:** PostgreSQL real com dois usuarios, inventario completo, snapshots integrais do outro tenant, invalidacao de sessoes e falha intermediaria com rollback total.

### SEC-008 - Advisories no grafo de dependencias

- **Categoria:** dependências e XSS.
- **Status consolidado:** Bloqueador de uso restrito.
- **Cenário:** vulnerabilidades conhecidas no framework e dependencias transitivas podem afetar Server Actions, cache, SSRF, disponibilidade, processamento de imagem ou CSS.
- **Evidência técnica:** em 8 de agosto de 2026, `npm audit --omit=dev` reportou quatro vulnerabilidades altas no grafo de producao (`next`, `postcss`, `nanoid` e `sharp`). `npm audit` reportou seis altas no total, acrescentando `brace-expansion` e `js-yaml`.
- **Impacto:** exposicao, indisponibilidade ou comportamento inseguro dependendo do caminho alcancavel.
- **Probabilidade:** condicionada aos caminhos usados; o projeto usa App Router e Server Actions, enquanto nenhum CSS dinamico nao confiavel foi encontrado.
- **Severidade atual:** alta segundo a auditoria atual.
- **Aplicabilidade:** exige triagem por advisory e versao antes de qualquer exposicao externa; ausencia de exploracao demonstrada nao equivale a mitigacao.
- **Controle existente:** acesso atual local e ausencia de CSS dinamico nao confiavel identificado.
- **Risco residual:** pacotes vulneraveis permanecem no grafo executavel e de desenvolvimento.
- **Recomendação:** executar atividade dedicada de compatibilidade e atualizacao, sem `npm audit fix` forcado.
- **Validação futura:** confirmar caminhos aplicaveis, atualizar por versao suportada e repetir testes/auditoria.

### SEC-009 - CSRF e validação de Origin das Server Actions

- **Categoria:** integridade de requisições.
- **Status consolidado:** Mitigado parcialmente; validação do proxy/deployment pendente.
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
- **Status consolidado:** Bloqueador de uso restrito.
- **Cenário:** erro do driver registra parâmetros ou contexto sensível.
- **Evidência técnica:** a configuração registra `error/warn` em desenvolvimento e `error` em produção. Em PostgreSQL descartável, uma colisão sintética `P2002` incluiu o e-mail sintético na saída capturada; os hashes sintéticos de senha não apareceram.
- **Impacto:** exposição operacional de metadados ou dados financeiros.
- **Probabilidade:** confirmada para o erro de unicidade exercitado; outros erros permanecem inconclusivos.
- **Severidade atual:** média.
- **Aplicabilidade:** depende da observabilidade e do erro gerado.
- **Controle existente:** mensagens internas são convertidas em respostas genéricas em vários serviços.
- **Risco residual:** resposta controlada não impede que dados pessoais alcancem o log operacional.
- **Recomendação:** definir redaction ou configuração segura de logging e cobrir por regressão antes de uso externo.
- **Validação futura:** ampliar a caracterização para erros financeiros sintéticos e confirmar a saída da configuração corrigida.

### SEC-011 - Gestão limitada de sessões antigas

- **Categoria:** sessão.
- **Status consolidado:** Aceito temporariamente.
- **Cenário:** sessão roubada continua válida depois de um novo login ou logout em outro dispositivo.
- **Evidência técnica:** cada login cria sessão independente, logout remove somente a sessão correspondente ao hash do cookie atual, apenas `tokenHash` é persistido e a expiração é fixa em 30 dias. Testes PostgreSQL comprovam duas sessões simultâneas, logout independente, ausência idempotente e rejeição/remoção de sessão expirada. Erros inesperados na exclusão propagam antes de limpar o cookie ou auditar sucesso.
- **Impacto:** prolongamento de acesso indevido.
- **Probabilidade:** baixa no estágio atual.
- **Severidade atual:** baixa.
- **Aplicabilidade:** pode aumentar antes de produção.
- **Controle existente:** token forte, cookie seguro, expiração, revogação confirmada da sessão atual e testes PostgreSQL.
- **Risco residual:** sem listagem ou revogação global.
- **Recomendação:** avaliar gestão de dispositivos e revogação em eventos sensíveis.
- **Validação futura:** avaliar revogação global ou por evento sensível antes de produção. Nenhum cenário com token realmente roubado foi executado.

### SEC-012 - Headers de segurança não configurados explicitamente

- **Categoria:** defesa em profundidade.
- **Status consolidado:** Bloqueador de produção pública.
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
- **Status consolidado:** Não aplicável ou superado no produto atual; não existe exportação.
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
| Importações | Preview, confirmação e histórico | `userId` da sessão; conta validada por `id + userId`; histórico por usuário | FK composta importação/conta; índices por usuário | Abuso de recursos permanece fora deste controle |
| Transações | Listagem e categorização | Leitura por usuário; transação e categoria por `id + userId`; update por usuário | Dedupe e FKs compostas para categoria, conta e importação | Filtros da aplicação ainda são necessários para confidencialidade |
| Categorias | Listagem, criação e edição | Pai/recurso por `id + userId`; limite de hierarquia e chave canônica no serviço | FK composta de pai; unique de filhos e índice parcial de raízes | Escritores privilegiados devem manter `comparisonKey` coerente |
| Regras | Listagem, criação, ativação e aplicação | Regra, categoria e transação filtradas por usuário; update só sem categoria | FK composta regra/categoria com cascata | Filtros da aplicação ainda são necessários para autorização |
| Dashboard | Count, aggregate e consulta do período | Todas as queries observadas filtram por `userId` | Índices por usuário e data | Dados do próprio usuário são enviados ao navegador por necessidade funcional |
| Audit logs | Autenticação e importação | ID do usuário quando disponível; metadados minimizados | FK anulável e índices | Retenção, acesso operacional e logs do Prisma não verificados |

As proteções dos fluxos atuais estão comprovadas na aplicação. Desde a Atividade 5.1, o banco também garante que as seis relações multiusuário existentes tenham o mesmo `userId`; mudanças relacionais futuras continuam exigindo inspeção dos dados, rollback e aprovação explícita.

A Atividade 1.3 confirmou estaticamente que `userId` é derivado de `requireCurrentUser`; os Blocos 2 e 4 acrescentaram testes dinâmicos de autorização. A Atividade 5.1 comprovou diretamente no PostgreSQL a rejeição das seis inserções cruzadas e os comportamentos de exclusão. A Atividade 5.2 comprovou a unicidade estrutural sob concorrência. A Atividade 5.3 comprovou exclusao integral e rollback com dois usuarios; `SEC-005`, `SEC-006` e `SEC-007` estao mitigados.

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
- A exclusao do titular existe no banco ativo, e imediata e transacional; nao ha recibo, tombstone ou soft delete.
- Nao ha politica implementada de retencao/anonimizacao de audit logs ou descarte de backups.
- Criptografia, acesso operacional, retencao e backups ainda exigem desenho pre-producao; este documento nao promete implementacao imediata.

## Pontos pendentes de validação

### Validação local futura em ambiente descartável

- Conteúdo real dos logs do Prisma em erros representativos.
- Cache de páginas autenticadas.
- Concorrência em regras e importações.

### Validação de deployment e pré-produção

- Proxy e preservação de `Host`, `Origin` e `X-Forwarded-Host`.
- Confiabilidade de `x-forwarded-for`/`x-real-ip`.
- TLS, HSTS e headers finais.
- Múltiplas instâncias e armazenamento distribuído.
- Política e operação de backups, retenção e descarte.
- Privilégios do usuário PostgreSQL.
- Logs e observabilidade da plataforma.

Os advisories atuais de dependencias exigem triagem antes de uso externo. A ausencia de um caminho CSS dinamico nao resolve os demais achados de `next`, `nanoid`, `sharp`, `brace-expansion` e `js-yaml`.

## Observações informativas das validações

A build local executada em `127.0.0.1:3100` gerou redirects para `http://localhost:3100/login`. Isso não demonstrou vulnerabilidade. O comportamento deve ser conferido futuramente na configuração de host e proxy do deployment, sem atribuição de severidade adicional enquanto não houver evidência de impacto.

## Critérios de decisão

- Nenhum risco critico foi reportado pela auditoria atual, mas `SEC-008` e `SEC-010` bloqueiam uso restrito ate tratamento explicito.
- Riscos altos não entram automaticamente como implementação imediata; severidade, contexto e capacidade devem orientar o planejamento.
- SEC-001 foi mitigado para login e cadastro por identidade, mas permanece aberto para abuso distribuído, borda e outras operações.
- SEC-004 foi mitigado pelo cadastro neutro do Bloco 4, sem declaração de resolução total por causa dos canais residuais temporal e de login posterior.
- SEC-002 é requisito relevante antes de produção, não declaração de incidente ou bloqueio do desenvolvimento local.
- SEC-009 está mitigado pelo framework no ambiente testado, mas a conclusão depende da configuração do proxy/deployment.
- SEC-008 agora agrega advisories altos no grafo de producao e desenvolvimento; ausencia de exploracao demonstrada nao autoriza exposicao externa.
- Qualquer migration de hardening exige inspeção de dados, proposta técnica, impacto, rollback e aprovação explícita.
- Achados preliminares podem subir, cair ou ser encerrados após testes.

## Plano controlado

O plano controlado permanece como referencia historica de sequencia. Os Blocos 3 a 6 executaram partes de autenticacao, modelo, privacidade, dependencias e regressao; pendencias nao sao iniciadas automaticamente:

1. Validações manuais de segurança.
2. Validar rate limiting no deployment e decidir proteção complementar de borda.
3. Hardening de autenticação e sessão — cadastro neutro e revogação segura concluídos no Bloco 4; gestão global permanece futura.
4. Analise estrutural do modelo — FKs compostas, unicidade e exclusao validadas; `BCK-012` permanece aberto.
5. Privacidade e retencao — exclusao do banco ativo concluida; `BCK-032` e `BCK-033` permanecem abertos.
6. Dependencias e headers — consolidados no Bloco 6 e ainda bloqueantes conforme a matriz.
7. Testes automatizados e regressao — fundacao de seguranca aprovada; `BCK-011` amplo permanece aberto.
