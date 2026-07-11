# 10 - Skills do Codex

## Diagnostico

As cinco Skills do Money Flow estavam na estrutura correta em `.agents/skills`, cada uma em sua propria pasta e com um `SKILL.md`. Entretanto, os arquivos nao possuíam frontmatter YAML com `name` e `description`. Sem esses metadados, o Codex nao tinha as informacoes usadas para descobrir e acionar as Skills.

Nao foram encontrados nomes duplicados, arquivos vazios, `SKILL.md` solto, Skills duplicadas em diretorios superiores ou configuracao do repositorio desabilitando Skills.

## Estrutura correta

```text
.agents/skills/
├── money-flow-backlog-manager/SKILL.md
├── money-flow-dashboard-analytics/SKILL.md
├── money-flow-data-model-review/SKILL.md
├── money-flow-docs-writer/SKILL.md
└── money-flow-security-review/SKILL.md
```

Cada arquivo comeca com frontmatter delimitado por `---`, usando um `name` igual ao diretorio e uma `description` que informa quando a Skill deve ser acionada.

## Skills corrigidas

- `money-flow-backlog-manager`
- `money-flow-dashboard-analytics`
- `money-flow-data-model-review`
- `money-flow-docs-writer`
- `money-flow-security-review`

Os conteúdos foram preservados e reorganizados em objetivo, instrucoes, checklist, saida esperada e limites. As Skills complementam o `AGENTS.md` sem substitui-lo.

## Como testar

A sessao atual pode manter o catalogo carregado antes das correcoes. Para testar a descoberta real, encerre a sessao e abra uma nova sessao do Codex na raiz do repositorio. Em seguida:

1. Execute `/skills` e confirme que as cinco Skills aparecem.
2. Invoque explicitamente `$money-flow-security-review`.
3. Invoque explicitamente `$money-flow-data-model-review`.
4. Invoque explicitamente `$money-flow-docs-writer`.
5. Invoque explicitamente `$money-flow-dashboard-analytics`.
6. Invoque explicitamente `$money-flow-backlog-manager`.

Prompts minimos:

```text
Use $money-flow-security-review e informe quais regras de isolamento por userId devem ser verificadas.
Use $money-flow-data-model-review e resuma os riscos atuais do modelo de categorias.
Use $money-flow-docs-writer e informe quais documentos devem ser atualizados ao final de uma sprint.
Use $money-flow-dashboard-analytics e liste os cuidados para interpretar os KPIs do dashboard.
Use $money-flow-backlog-manager e explique como um item deve ser classificado antes de entrar em uma sprint.
```

## Resultado da nova sessao

Pendente. Preencher apos confirmar a listagem em `/skills` e as cinco invocacoes explicitas em uma nova sessao.
