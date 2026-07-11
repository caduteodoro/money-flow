# 11 - Threat Model de Segurança

## Identificação

- **Sprint e bloco:** Sprint 5, Bloco 1, Atividade 1.2.
- **Data da avaliação:** 11 de julho de 2026.
- **Commit-base:** `dddb1c2`.
- **Escopo:** autenticação, sessões, autorização, importação CSV, categorias, regras, transações, dashboard, audit logs, Prisma, PostgreSQL, configuração e dependências.
- **Metodologia:** inspeção estática do código e da documentação, inventário de pontos de entrada e fronteiras de confiança, matriz de isolamento por `userId` e auditorias não destrutivas com `npm audit --omit=dev` e `npm audit`.

Esta avaliação não incluiu pentest, tráfego de uma build de produção, inspeção de infraestrutura, banco com dados reais, backups ou testes dinâmicos. Severidades preliminares podem mudar após validação. Nenhum dado financeiro real, segredo ou identificador pessoal foi usado.

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

Os status usados são: **Confirmado**, **Parcialmente confirmado**, **Requer validação**, **Informativo** e **Planejado para pré-produção**.

### SEC-001 - Ausência de rate limiting em autenticação

- **Categoria:** autenticação e disponibilidade.
- **Status da evidência:** Confirmado.
- **Cenário:** cliente automatiza login, cadastro ou geração de audit logs.
- **Evidência técnica:** `loginAction` e `registerAction` não aplicam limitação; a ausência também está documentada no README.
- **Impacto:** tentativa de tomada de conta, uso intensivo de bcrypt e crescimento de banco/logs.
- **Probabilidade:** média.
- **Severidade atual:** alta.
- **Aplicabilidade:** relevante antes de exposição pública; o impacto atual depende do ambiente local.
- **Controle existente:** bcrypt, mensagem genérica no login e audit log de falha.
- **Risco residual:** tentativas e cadastros continuam ilimitados.
- **Recomendação:** desenhar política por operação, IP confiável e identidade normalizada antes de escolher tecnologia.
- **Validação futura:** testar rajadas, janelas, recuperação e IP compartilhado.

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
- **Probabilidade:** média sem limitação.
- **Severidade atual:** média.
- **Aplicabilidade:** relevante em ambiente público; há trade-off de UX.
- **Controle existente:** normalização e unicidade de e-mail.
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
- **Status da evidência:** Requer validação.
- **Cenário:** entrada não confiável alcança uma operação vulnerável de stringify de CSS.
- **Evidência técnica:** `npm audit --omit=dev` e `npm audit` reportaram `postcss < 8.5.10` via Next.js, com severidade moderada.
- **Impacto:** XSS se existir caminho de exploração.
- **Probabilidade:** não confirmada; não foi encontrado CSS controlado pelo usuário.
- **Severidade atual:** média segundo o advisory, condicionada ao contexto.
- **Aplicabilidade:** não há exploração comprovada no Money Flow.
- **Controle existente:** nenhum caminho de CSS dinâmico não confiável foi identificado.
- **Risco residual:** a versão vulnerável permanece no grafo de produção.
- **Recomendação:** avaliar atualização compatível; não aplicar correção forçada sem análise.
- **Validação futura:** confirmar versão resolvida e procurar caminho real até o stringify vulnerável.

### SEC-009 - CSRF e validação de Origin das Server Actions

- **Categoria:** integridade de requisições.
- **Status da evidência:** Requer validação.
- **Cenário:** origem externa tenta executar mutação autenticada.
- **Evidência técnica:** cookie usa `SameSite=Lax`; não há controle explícito de CSRF no código da aplicação.
- **Impacto:** alteração de recursos do usuário.
- **Probabilidade:** não confirmada; depende dos controles do Next.js e da configuração de produção.
- **Severidade atual:** média preliminar.
- **Aplicabilidade:** nenhuma exploração foi demonstrada.
- **Controle existente:** `SameSite=Lax`, sessão server-side e mecanismos internos do framework.
- **Risco residual:** comportamento de Origin/Host não foi testado.
- **Recomendação:** validar antes de adicionar mecanismo próprio.
- **Validação futura:** requisições cross-origin reais contra cada Action mutável.

### SEC-010 - Conteúdo dos logs de erro do Prisma

- **Categoria:** logging e exposição de dados.
- **Status da evidência:** Requer validação.
- **Cenário:** erro do driver registra parâmetros ou contexto sensível.
- **Evidência técnica:** Prisma registra `error` em produção e `error/warn` em desenvolvimento; a saída real não foi capturada.
- **Impacto:** exposição operacional de metadados ou dados financeiros.
- **Probabilidade:** não confirmada.
- **Severidade atual:** média preliminar.
- **Aplicabilidade:** depende da observabilidade e do erro gerado.
- **Controle existente:** mensagens internas são convertidas em respostas genéricas em vários serviços.
- **Risco residual:** resposta controlada não garante log controlado.
- **Recomendação:** testar redaction em ambiente controlado.
- **Validação futura:** provocar erros fictícios representativos e inspecionar logs.

### SEC-011 - Gestão limitada de sessões antigas

- **Categoria:** sessão.
- **Status da evidência:** Confirmado.
- **Cenário:** sessão roubada continua válida depois de um novo login ou logout em outro dispositivo.
- **Evidência técnica:** cada login cria sessão; logout invalida apenas o token atual; validade é de 30 dias.
- **Impacto:** prolongamento de acesso indevido.
- **Probabilidade:** baixa no estágio atual.
- **Severidade atual:** baixa.
- **Aplicabilidade:** pode aumentar antes de produção.
- **Controle existente:** token forte, cookie seguro e expiração.
- **Risco residual:** sem listagem ou revogação global.
- **Recomendação:** avaliar gestão de dispositivos e revogação em eventos sensíveis.
- **Validação futura:** testar múltiplas sessões e logout independente.

### SEC-012 - Headers de segurança não configurados explicitamente

- **Categoria:** defesa em profundidade.
- **Status da evidência:** Requer validação.
- **Cenário:** ausência de CSP, proteção contra framing ou outras políticas amplia outro defeito.
- **Evidência técnica:** `next.config.ts` contém apenas `reactStrictMode`.
- **Impacto:** redução de defesa em profundidade.
- **Probabilidade:** baixa isoladamente.
- **Severidade atual:** baixa.
- **Aplicabilidade:** headers reais da build/deployment não foram inspecionados.
- **Controle existente:** escape padrão do React e ausência de `dangerouslySetInnerHTML`.
- **Risco residual:** políticas de navegador não confirmadas.
- **Recomendação:** definir headers após inventariar recursos e ambiente.
- **Validação futura:** inspecionar respostas de uma build de produção.

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

## Rate limiting: candidatos e requisitos de decisão

| Operação | Abuso a mitigar | Prioridade preliminar |
|---|---|---|
| Login | Força bruta e credential stuffing | P0/P1 |
| Cadastro | Enumeração, spam e custo de bcrypt | P1 |
| Preview CSV | CPU, memória e consultas repetidas | P1 |
| Confirmação da importação | Escritas, concorrência e crescimento do banco | P1 |
| Aplicação de regras | Varreduras e updates repetidos | P1/P2 |
| Categorias e regras | Spam de recursos e mutações | P2 |
| Dashboard | Consultas e agregações repetidas | P2 |

A implementação não foi escolhida. A decisão depende da topologia de deployment, proxy confiável, quantidade de instâncias, armazenamento compartilhado, semântica de IP e cotas por usuário. Esta matriz não coloca automaticamente todos os candidatos no escopo de implementação da Sprint 5.

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

- Proteção CSRF e validação de Origin/Host das Server Actions.
- Headers efetivos de uma build de produção.
- Conteúdo real dos logs do Prisma em erros representativos.
- Confiabilidade do proxy e de `x-forwarded-for`/`x-real-ip`.
- Privilégios do usuário PostgreSQL.
- Política e operação de backups, retenção e descarte.
- Caminho explorável do advisory de PostCSS no contexto real.
- Testes dinâmicos de autorização com dois usuários.
- Concorrência em categorias, regras e importações.

## Critérios de decisão

- Nenhum risco crítico comprovado bloqueia a continuidade normal do Bloco 1.
- Riscos altos não entram automaticamente como implementação imediata; severidade, contexto e capacidade devem orientar o planejamento.
- SEC-001 é prioridade de desenho técnico antes da implementação de rate limiting.
- SEC-002 é requisito relevante antes de produção, não declaração de incidente ou bloqueio do desenvolvimento local.
- Qualquer migration de hardening exige inspeção de dados, proposta técnica, impacto, rollback e aprovação explícita.
- Achados preliminares podem subir, cair ou ser encerrados após testes.

## Plano controlado

As próximas atividades propostas, ainda não concluídas nem automaticamente comprometidas com a Sprint 5, são:

1. Validações manuais de segurança.
2. Desenho de rate limiting.
3. Hardening de autenticação e sessão.
4. Análise estrutural do modelo.
5. Privacidade e retenção.
6. Dependências e headers.
7. Testes automatizados e regressão.
