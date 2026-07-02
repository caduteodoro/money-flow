# 08 - Sprint 3

## Objetivo

Transformar o dashboard mockado em uma visao real baseada nas transacoes importadas pelo usuario autenticado.

A Sprint 3 manteve o escopo do MVP: dashboard real, KPIs, filtros, graficos simples, insights basicos, tabela de ultimas transacoes, estado vazio e polish visual. Categorias, OFX, PDF automatico, Open Finance, PWA e IA externa ficaram fora do escopo.

## Contexto herdado da Sprint 2

A Sprint 2 entregou:

- Importacao CSV protegida por autenticacao.
- Validacao de extensao, MIME type, tamanho, UTF-8 e estrutura.
- Preview e confirmacao na mesma tela.
- Persistencia em `StatementImport` e `Transaction`.
- Deduplicacao por `userId` e `dedupeKey`.
- Historico de importacoes com mes ou periodo do extrato.
- Audit log seguro de importacao, sem conteudo bruto do CSV, descricoes completas ou valores financeiros sensiveis.

## Entregas por bloco

### Bloco 1 - Camada de dados e KPIs

- Criada a camada server-side em `lib/dashboard`.
- Criados tipos para filtros, parametros, KPIs, maior saida e resumo.
- Implementados filtros de data:
  - `imported-period`
  - `last-30-days`
  - `current-month`
  - `previous-month`
- Implementado `getDashboardSummary(params)` exigindo `userId`.
- KPIs calculados com base nas transacoes persistidas do usuario autenticado.

### Bloco 2 - Dashboard conectado aos dados reais

- `/dashboard` passou a obter o usuario autenticado no servidor.
- A pagina passou a chamar `getDashboardSummary`.
- Componentes de KPI, estado vazio, filtro visual e tabela passaram a receber dados prontos.
- Usuarios sem transacoes veem estado vazio com link para `/import`.
- Usuarios com transacoes veem KPIs reais e tabela de ultimas transacoes.

### Bloco 3 - Graficos e insights

- Adicionadas series agregadas para graficos.
- Implementada evolucao financeira por dia ou por mes.
- Implementado comparativo de entradas vs saidas.
- Implementados insights basicos calculados localmente, sem IA externa.

### Bloco 3.5 - UI polish

- Melhorada a hierarquia visual do dashboard.
- Cards, graficos, insights, tabela, sidebar e topbar receberam polish visual.
- O visual foi mantido como SaaS financeiro limpo, com teal/azul como cor primaria e verde/vermelho para positivo/negativo.

### Bloco 3.6 - Responsive fix

- Corrigida a quebra visual dos KPIs em zoom 100%.
- Valores financeiros passaram a usar `whitespace-nowrap` e `tabular-nums`.
- O grid dos KPIs passou a usar menos colunas em desktop comum e 6 colunas apenas em telas muito largas.
- O grafico principal teve altura reduzida para evitar excesso de espaco branco.
- Containers receberam `min-w-0` e ajustes para evitar overflow horizontal desnecessario.

### Bloco 4 - Fechamento e documentacao

- README atualizado para refletir dashboard real.
- Arquitetura documentada com `lib/dashboard`.
- Seguranca e privacidade atualizadas para cobrir dashboard, queries por `userId` e ausencia de logs sensiveis.
- Roadmap atualizado com Sprint 3 concluida e Sprint 4 focada em categorias.

## Regras dos KPIs

- Entradas: transacoes de entrada ou valores positivos.
- Saidas: transacoes de saida ou valores negativos, retornadas em valor absoluto para exibicao.
- Saldo: entradas menos saidas.
- Gasto medio diario: saidas divididas pela quantidade de dias do periodo.
- Maior saida: maior transacao de saida do periodo, em valor absoluto.
- Quantidade de transacoes: total de transacoes consideradas no periodo.

## Filtros de periodo

- Periodo importado.
- Ultimos 30 dias.
- Mes atual.
- Mes anterior.

Os filtros afetam KPIs, graficos, insights e tabela.

A interface tambem exibe o intervalo real considerado pelo filtro ativo. Quando o usuario ja possui transacoes importadas, mas o filtro atual nao encontra movimentacoes, o dashboard mostra um estado especifico de periodo vazio em vez de sugerir primeira importacao.

## Graficos

- Evolucao financeira: entradas e saidas agregadas por dia ou por mes, conforme tamanho do periodo.
- Entradas vs saidas: comparativo simples do movimento financeiro do periodo.

Os graficos sao implementados com HTML/CSS leve, sem biblioteca nova.

## Insights

Insights basicos calculados localmente:

- Maior gasto do periodo.
- Se houve mais saidas do que entradas.
- Saldo positivo ou negativo.
- Gasto medio diario.
- Quantidade de transacoes importadas no periodo.

Os insights usam tom leve e informativo, sem julgamento agressivo.

## Seguranca aplicada

- `userId` e obrigatorio para consultar o dashboard.
- Toda query financeira do dashboard filtra por `userId`.
- Nao ha tela administrativa para visualizar transacoes de usuarios.
- Nao sao registrados valores financeiros sensiveis, descricoes completas ou conteudo bruto de CSV em logs.
- Apenas dados ficticios em `sample-data/` devem ser usados no GitHub.
- O dashboard exibe dados do proprio usuario autenticado.

## Manutencao posterior

Apos o fechamento da Sprint 3, foram aplicados ajustes de preparacao para Sprint 4:

- Remocao de rotulos visuais antigos de sprint na home e importacao.
- Exibicao do intervalo real considerado pelo filtro ativo no dashboard.
- Estado visual separado para filtro sem transacoes no periodo.
- Mensagens controladas para erros esperados de importacao CSV.
- Contadores de importacao calculados com base na quantidade realmente inserida pelo banco.
- Documentacao de guardrails para categorias, regras e transacoes por `userId`.

## Validacoes tecnicas realizadas

Durante os blocos da Sprint 3, foram executadas validacoes como:

- `npx prisma validate`
- `npx prisma migrate status`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Observacao: `npx prisma generate` foi executado em blocos anteriores da Sprint 3 quando aplicavel. Em um momento, houve bloqueio operacional do Windows por arquivo do Prisma Client em uso, sem alteracao de schema nesta sprint.

## Testes manuais recomendados

- Usuario sem transacoes deve ver estado vazio amigavel.
- Usuario com CSV ficticio importado deve ver KPIs, graficos, insights e tabela.
- Trocar filtros deve atualizar KPIs, graficos, insights e tabela.
- Filtro sem transacoes deve mostrar estado de periodo vazio quando o usuario ja possui dados importados.
- Dashboard deve mostrar o intervalo real considerado pelo filtro ativo.
- Usuario B nao deve ver dados importados pelo usuario A.
- Dashboard em zoom 100% nao deve quebrar valores financeiros nos KPIs.

## Fora do escopo

- Categorias.
- Edicao de transacoes.
- OFX.
- PDF automatico.
- Open Finance.
- PWA.
- IA externa.
- Projecoes financeiras complexas.
- Recorrencia.
- Run rate avancado.
