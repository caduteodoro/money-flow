# money-flow-backlog-manager

## Quando usar

Use esta skill sempre que houver novas ideias, bugs, melhorias de UX, débitos técnicos, dúvidas de produto ou itens futuros para o Money Flow.

Use especialmente quando o usuário disser coisas como:

- "anota no backlog"
- "isso fica para Sprint 4+"
- "melhoria futura"
- "talvez depois"
- "não vamos fazer agora"
- "isso é bug ou melhoria?"
- "organiza meu backlog"
- "prioriza esses itens"
- "cria docs/08-backlog.md"

## Objetivo

Ajudar a manter o backlog do Money Flow claro, organizado, priorizado e coerente com o roadmap do projeto.

A skill deve transformar ideias soltas em itens acionáveis, separando:

- Bug
- Melhoria de UX
- Feature
- Débito técnico
- Segurança/privacidade
- Documentação
- Ideia futura
- Dúvida de produto

## Princípios

- Não misturar backlog com escopo da sprint atual sem decisão explícita.
- Não transformar ideia em compromisso.
- Não inflar sprint em andamento.
- Priorizar clareza, valor para o usuário e segurança.
- Registrar o motivo do item existir.
- Manter o backlog útil para desenvolvimento com Codex.
- Evitar itens genéricos demais.
- Sempre que possível, escrever o item em linguagem de produto e técnica.
- Não renumerar IDs antigos do backlog.
- Se um item for bug bloqueante da sprint atual, sinalizar como bloqueante antes de mover para futuro.
- Separar claramente o que é bug, melhoria, feature, dívida técnica e ideia futura.

## Roadmap de referência

### Sprint 3

- Dashboard com dados reais.
- KPIs.
- Filtro de datas.
- Gráficos.
- Tabela de transações.
- Insights iniciais.

### Sprint 4

- Categorias.
- Categoria pai/filha.
- Edição/criação de categorias.
- Regras automáticas.
- Transações não categorizadas.

### Sprint 5

- Hardening de segurança.
- Rate limiting.
- Revisão de privacidade.
- Documentação final do MVP.
- Preparação para OFX.

### Pós-MVP

- MFA.
- Recuperação de senha.
- Login social opcional.
- OFX parser.
- Criptografia forte.
- Zero-knowledge/privacy mode.
- Scanner de arquivos.
- Deploy com observabilidade.

## Como classificar itens

Para cada item novo, classifique com:

- Tipo: Bug, Feature, UX, Tech Debt, Segurança, Documentação ou Pesquisa.
- Prioridade: Alta, Média ou Baixa.
- Sprint sugerida: Sprint atual, Sprint 4, Sprint 5 ou Pós-MVP.
- Esforço estimado: P, M ou G.
- Impacto: Baixo, Médio ou Alto.
- Risco: Baixo, Médio ou Alto.
- Dependências, se houver.
- Status: Ideia, Backlog, Refinado, Em andamento, Bloqueado, Concluído ou Descartado.

## Critérios de priorização

Priorize itens que:

1. Aumentam valor claro para o usuário.
2. Reduzem risco de segurança ou privacidade.
3. Desbloqueiam outras funcionalidades.
4. Melhoram entendimento financeiro.
5. Reduzem confusão na interface.
6. Evitam retrabalho técnico futuro.

Evite priorizar agora itens que:

- Dependem de categorias antes da Sprint 4.
- Exigem IA externa.
- Exigem Open Finance.
- Exigem deploy/produção antes do MVP local estar estável.
- Aumentam muito o escopo da sprint atual.
- São legais, mas não essenciais para o MVP.

## Formato recomendado do backlog

Ao criar ou atualizar `docs/08-backlog.md`, use esta estrutura:

```md
# 08 - Backlog

## Visão geral

Este documento registra ideias, melhorias, bugs, débitos técnicos e decisões futuras do Money Flow.

O backlog não representa compromisso imediato de implementação. Ele serve para preservar contexto e apoiar priorização das próximas sprints.

## Status possíveis

- Ideia
- Backlog
- Refinado
- Em andamento
- Bloqueado
- Concluído
- Descartado

## Itens

| ID | Tipo | Item | Descrição | Prioridade | Sprint sugerida | Esforço | Status |
|----|------|------|-----------|------------|-----------------|---------|--------|
| BCK-001 | UX | Melhorar responsividade da tabela | Ajustar tabela para melhor leitura em telas menores e desktop com sidebar. | Média | Sprint 4 | M | Backlog |
```

## Formato de item refinado

Quando o usuário pedir para detalhar um item, use este formato:

```md
## BCK-000 - Nome do item

**Tipo:** Feature / UX / Bug / Tech Debt / Segurança / Documentação
**Prioridade:** Alta / Média / Baixa
**Sprint sugerida:** Sprint 4 / Sprint 5 / Pós-MVP
**Esforço estimado:** P / M / G
**Status:** Ideia / Backlog / Refinado

### Problema

Explique o problema ou oportunidade.

### Objetivo

Explique o que este item deve resolver.

### Critérios de aceite

- [ ] Critério 1.
- [ ] Critério 2.
- [ ] Critério 3.

### Observações técnicas

Inclua arquivos prováveis, riscos, dependências ou decisões técnicas.

### Fora do escopo

Liste o que não deve entrar neste item para evitar escopo inchado.
```
