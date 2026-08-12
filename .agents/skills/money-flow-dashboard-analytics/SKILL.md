---
name: money-flow-dashboard-analytics
description: Use ao criar ou revisar dashboards, KPIs, filtros, tabelas, gráficos, insights, períodos, cálculos financeiros e bibliotecas de visualização no Money Flow.
---

# Money Flow Dashboard Analytics

## Objetivo

Entregar analytics financeiros corretos, reconciliáveis, interpretáveis, acessíveis e isolados por usuário, mantendo cálculo e apresentação separados.

## Fluxo de trabalho

1. Inspecionar código, schema, migrations, testes, dados fictícios e documentação vigente antes de propor contratos ou visuais.
2. Registrar o contrato de cada métrica e confrontar implementação, interface e testes. Não corrigir divergências materiais silenciosamente.
3. Verificar ownership, reconciliação, datas, estados de borda, arquitetura, desempenho, responsividade, acessibilidade e privacidade.
4. Justificar cada visualização e qualquer mudança de biblioteca antes de implementar.
5. Validar fórmulas, contratos tipados, filtros e experiência; separar fatos, riscos, recomendações e decisões pendentes.

## Contratos financeiros e temporais

- Declarar para cada métrica: pergunta financeira, fórmula, numerador, denominador, tipos e direções incluídos ou excluídos, tratamento de sinais, período, timezone, limites inclusivos ou exclusivos, regra para zero ou ausência de base, filtro por `userId` e reconciliação esperada.
- Distinguir explicitamente resultado do período, resultado acumulado e saldo bancário real. Nunca chamar resultado calculado ou acumulado de saldo bancário sem conciliação comprovada.
- Definir período anterior equivalente, comportamento sem base anterior e granularidade determinística. Impedir `Infinity`, `NaN` e percentuais enganosos.
- Manter ordenação temporal estável e tratar intervalo de um ponto, conversões de data, timezone e deslocamento de dia.
- Fazer KPIs, gráficos, tabelas, insights e drill-through consumirem contratos e intervalos reconciliáveis.

## Categorias, ofensores e drill-through

- Basear analytics por categoria em despesas quando a pergunta for sobre gastos; não forçar entradas em categorias de gasto.
- Representar `Sem categoria` explicitamente, agrupar `Outros` por regra determinística e reconciliar todas as parcelas com o total de saídas. Nenhuma transação elegível pode desaparecer da análise.
- Medir cobertura de categorização e preservar atribuições manuais e a prioridade vigente das fontes de categorização.
- Sustentar maiores transações, descrições normalizadas, categoria de maior impacto e dias de maior volume somente quando o modelo e os dados comprovarem a semântica.
- Não chamar descrição normalizada de estabelecimento sem evidência. Não expor descrições financeiras reais em logs, fixtures, telemetria, erros, documentação ou relatórios técnicos.
- Fazer o drill-through aplicar filtros server-side autorizados, preservando `userId`, período, categoria ou `Sem categoria` e demais dimensões que explicam o insight.

## Visualizações e experiência

- Exigir de cada gráfico: pergunta analítica clara, justificativa do tipo visual, título orientado à pergunta, unidade, escala, tooltip consistente, formatação `pt-BR` e alternativa textual.
- Prever estado vazio, pouco volume, responsividade, mouse e toque, contraste adequado, foco e navegação por teclado quando aplicável. Não depender somente de verde e vermelho para transmitir significado.
- Evitar gráficos decorativos, redundantes ou que sugiram precisão e causalidade não sustentadas pelos dados.
- Revisar loading, erro, ausência total de transações, período sem movimentação, somente entradas, somente saídas, pouco volume, transações sem categoria, ausência de comparação e telas pequenas.

## Bibliotecas de visualização

- Antes de criar, trocar ou ampliar um motor gráfico, avaliar a biblioteca existente, necessidade real, licença, compatibilidade com React e Next.js App Router, SSR e client components, TypeScript, bundle, importação modular ou tree-shaking, manutenção, comunidade, acessibilidade, responsividade, toque e testes.
- Comparar o custo de manter o motor atual, substituí-lo ou conviver com dois motores. Apache ECharts pode ser candidato, nunca escolha automática.
- Não instalar nem remover dependências sem justificativa técnica e aprovação explícita.

### Sankey e fluxos

- Exigir semântica comprovada, conservação de valores, limite determinístico de nós, `Sem categoria`, `Outros`, tooltip com valor e percentual, legibilidade, avaliação de desempenho, acessibilidade mínima e fallback alternativo.
- Não comprimir Sankey em mobile portrait nem usá-lo para representar saldo bancário, patrimônio ou conciliação inexistente.
- Condicionar Sankey a spike e aprovação técnica.

## Arquitetura e desempenho

- Separar cálculo de apresentação, preferir agregações server-side e enviar ao cliente somente dados necessários e tipados.
- Filtrar toda query financeira por `userId`, inclusive agregações e drill-through; não depender apenas de middleware ou filtros client-side.
- Evitar N+1, consultas repetidas e implementações divergentes da mesma métrica. Revisar serialização de moeda e datas.
- Avaliar volume, plano de consulta e índices relevantes. Não criar schema, índice ou migration automaticamente; registrar evidência, alternativas e decisão necessária.

## Testes obrigatórios

- Testar fórmulas, sinais, zero, divisão por zero, comparação temporal, timezone, limites e ordenação.
- Testar reconciliação entre KPIs, gráficos, tabelas e categorias, incluindo `Sem categoria`, `Outros`, período vazio e um único ponto.
- Testar isolamento multiusuário com fixtures adversariais e preservação da categorização manual.
- Testar estados vazios, somente entradas, somente saídas, pouco volume e parâmetros inválidos de filtro.
- Testar acessibilidade, responsividade, mouse, teclado e toque quando aplicável.

## Saída esperada

- Separar fatos comprovados, fórmulas e contratos, divergências, riscos de interpretação, riscos técnicos, recomendações, testes e decisões pendentes.
- Identificar explicitamente dependências, schema, índices ou migrations que exigem aprovação.
- Informar evidências, limitações e o que não foi validado; usar linguagem financeira descritiva, sem julgar ou aconselhar o usuário.

## Guardrails

- Não crie analytics antes de suas dependências de dados estarem prontas.
- Não altere sem autorização explícita: dependências, schema, migrations, semântica financeira, classificação de transferências, estornos ou reversões, nem regras ou prioridades de categorização.
- Não exponha dados de outro usuário, descrições, valores ou outros dados financeiros sensíveis.
- Não introduza aconselhamento financeiro, previsão ou IA externa sem escopo explícito.
- Não amplie o escopo silenciosamente. Transforme divergências materiais, novas dependências e migrations em checkpoint para decisão.
