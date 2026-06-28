# 04 - Importacao de extratos

## Formatos

- CSV: base implementada no MVP.
- OFX: planejado para depois do MVP inicial.
- PDF: fora do escopo de importacao automatica no MVP.

## CSV inicial

O formato de exemplo usa dados ficticios em `sample-data/nubank-sample.csv`:

```csv
Data,Valor,Identificador,Descricao
01/04/2026,2500.00,fake-001,Salario Empresa Exemplo
```

O parser inicial aceita o CSV estilo Nubank e converte as linhas para um formato interno normalizado. O restante do sistema nao deve depender de colunas especificas do Nubank.

## Pipeline da Sprint 2

1. Receber arquivo CSV como entrada nao confiavel.
2. Validar extensao `.csv`.
3. Validar MIME type permitido.
4. Validar tamanho maximo.
5. Validar UTF-8 e ausencia de bytes nulos.
6. Detectar parser compativel via registry.
7. Normalizar data, valor, descricao, direcao e identificador externo.
8. Gerar `fileHash`, `descriptionHash` e `dedupeKey`.
9. Gerar preview com duplicatas por usuario.
10. Confirmar importacao a partir do mesmo arquivo selecionado.
11. Persistir `StatementImport` e `Transaction` sem salvar CSV bruto.
12. Exibir resumo e historico em `/import`.

## Deduplicacao

`dedupeKey` e calculado com:

- Provedor de origem.
- Identificador externo quando existir.
- Data da transacao.
- Valor em centavos.
- Hash da descricao normalizada.

A restricao `@@unique([userId, dedupeKey])` impede duplicidade entre importacoes do mesmo usuario. O servico tambem marca duplicatas ja existentes e duplicatas repetidas dentro do proprio CSV.

## Audit log

Ao importar, o sistema registra `STATEMENT_IMPORTED` com metadados seguros:

- `format`
- `sourceProvider`
- `fileHash`
- `fileSizeBytes`
- `rowCount`
- `importedCount`
- `duplicateCount`
- `invalidRowCount`
- `skippedCount`

Nao registrar conteudo bruto do arquivo, descricoes completas, valores individuais ou dados bancarios sensiveis.

## Dados reais

Nunca versionar extratos reais. Use apenas `sample-data/` com dados ficticios.
