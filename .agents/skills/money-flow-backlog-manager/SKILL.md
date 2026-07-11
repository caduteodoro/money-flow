---
name: money-flow-backlog-manager
description: Use ao registrar, refinar, priorizar, organizar ou atualizar ideias, débitos técnicos, bugs, pesquisas e itens do backlog do Money Flow.
---

# Money Flow Backlog Manager

## Quando usar

Use para registrar, classificar, refinar, priorizar ou atualizar bugs, features, UX, débitos técnicos, segurança, documentação e pesquisas futuras.

## Objetivo

Transformar contexto solto em itens rastreáveis sem inflar a sprint atual ou converter ideias em compromissos.

## Status

- **Ideia:** contexto inicial ainda pouco definido. Só transita para Backlog após decisão explícita de preservar o item como pendência futura; não entra automaticamente no backlog nem em uma sprint.
- **Backlog:** item aceito como pendência futura, sem compromisso imediato de implementação. Só transita para Refinado quando problema ou objetivo, limites, dependências e critérios de aceite estiverem detalhados.
- **Refinado:** item suficientemente detalhado e estimado para decisão. Somente um item Refinado pode ser selecionado conscientemente para uma sprint, respeitando prioridade, dependências e capacidade.
- **Em andamento:** item Refinado selecionado explicitamente para a sprint e com execução iniciada. Não use este status apenas por haver intenção de executar.
- **Bloqueado:** item cuja continuidade depende de decisão, dependência técnica ou outro item. Registre o bloqueio e só retome o status anterior quando houver evidência de desbloqueio.
- **Concluído:** item implementado e validado conforme os critérios de aceite. Só transita para este status com evidências da implementação e das validações exigidas.
- **Descartado:** item removido por decisão explícita. Preserve o registro, o motivo e o histórico da decisão.

## Prioridades

- **P0 — crítico:** bloqueia a sprint, envolve segurança ou privacidade crítica ou apresenta risco relevante de dados.
- **P1 — alto:** entrega alto valor para o MVP, reduz confusão importante ou desbloqueia trabalho planejado.
- **P2 — médio:** melhoria útil, mas não bloqueante.
- **P3 — baixo:** ideia futura, experimento, refinamento pós-MVP ou item de baixa urgência.

## Critérios de priorização

Avalie em conjunto impacto, urgência, risco, segurança e privacidade, dependências, esforço, valor para o MVP e capacidade disponível da sprint. A prioridade não é determinada por apenas um desses fatores.

- Favoreça valor claro para o usuário, redução de riscos, desbloqueio de dependências, melhor entendimento financeiro, menor confusão e prevenção de retrabalho.
- Considere se o esforço cabe na capacidade da sprint sem deslocar entregas já acordadas.
- Não promova automaticamente itens interessantes, mas não essenciais, nem itens dependentes de capacidades ainda fora do escopo.

## Instruções

- Consulte `docs/08-backlog.md`, roadmap e escopo da sprint antes de alterar status.
- Classifique tipo, prioridade, sprint sugerida, esforço, impacto, risco, dependências e status.
- Preserve IDs existentes e use o próximo identificador disponível.
- Descreva problema, objetivo, critérios de aceite, observações técnicas e fora do escopo ao refinar.
- Sinalize bugs bloqueantes antes de movê-los para o futuro.
- Separe itens concluídos, pendentes, descartados e dependentes de decisão.
- Confirme que uma ideia foi aceita no Backlog e refinada antes de considerar sua seleção para uma sprint.

## Checklist

- Há evidência suficiente para criar ou mudar o status do item?
- O item pertence à sprint atual ou deve permanecer no backlog?
- Tipo, prioridade, esforço, impacto e risco estão coerentes?
- Dependências e critérios de aceite estão claros?
- IDs antigos e histórico foram preservados?
- O item evita promessas e escopo implícito?

## Saída esperada

- Para cada item, apresente título, tipo, status, prioridade, problema ou objetivo, impacto, risco, esforço, dependências, critérios de aceite, sprint sugerida, fora do escopo, evidências e decisões pendentes.
- Mantenha os itens objetivos, classificados e priorizados, sem transformar sugestão de sprint em compromisso.
- Resuma alterações realizadas e decisões ainda pendentes.

## Limites

- Não altere código, status, backlog ou documentação automaticamente sem solicitação compatível e evidência suficiente.
- Não marque item como concluído sem implementação e validação exigida.
- Não mova uma ideia automaticamente para o Backlog ou para uma sprint; somente itens Refinados podem ser selecionados conscientemente para uma sprint.
- Não infle a sprint nem crie promessas ou escopo implícito.
- Não renumere IDs existentes nem apague histórico útil.
- Não exponha dados financeiros ou pessoais em itens, evidências ou saídas.
