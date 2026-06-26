# 04 - Importação de extratos

## Formatos

- CSV: suportado no MVP.
- OFX: prioridade na próxima versão.
- PDF: não será suportado como importação automática no MVP.

## CSV inicial

O formato de exemplo usa:

```csv
Data,Valor,Identificador,Descrição
01/04/2026,2500.00,fake-001,Salário Empresa Exemplo
```

## Pipeline planejado

1. Upload do arquivo.
2. Validação de extensão, tamanho e conteúdo.
3. Parsing em ambiente controlado.
4. Preview para o usuário.
5. Normalização de datas, valores e descrições.
6. Geração de `dedupeKey`.
7. Persistência de importação e transações.
8. Resumo de itens importados, ignorados e com erro.

## Segurança

Extratos são dados sensíveis. O sistema não deve logar conteúdo bruto do arquivo, descrições completas ou valores sem necessidade. Arquivos devem ser tratados como entrada não confiável.

## Dados reais

Nunca versionar extratos reais. Use apenas `sample-data/` com dados fictícios.
