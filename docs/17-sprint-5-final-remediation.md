# 17 - Sprint 5 - Remediacao final dos bloqueadores internos

## Objetivo e checkpoint

O Bloco 7A partiu do commit `dedce23e063d9ad3130ad0dccf6b0007995e59b0`, na branch publicada do Bloco 6, com upstream sincronizado, arvore limpa e nenhuma migration alterada. A Sprint 5 estava aberta, o Bloco 6 concluido e o Bloco 7A nao iniciado.

O usuario informou um checkpoint funcional manual aprovado para cadastro/autenticacao, importacao/historico, dashboard/filtros, categorias/regras, isolamento de duas contas sinteticas, exclusao invalida e valida e preservacao da segunda conta. Essa evidencia e manual e nao foi contabilizada como teste automatizado.

## Metodologia

Foram inspecionados `package.json`, lockfile, cadeias de dependencias, codigo e configuracao do Next/Prisma, Server Actions, cookies, middleware, controles de origem, testes e documentos. As auditorias npm foram processadas temporariamente e nenhum relatorio bruto foi salvo. Somente dados sinteticos e PostgreSQL 16 descartavel foram usados.

## SEC-008 - dependencias

### Fotografia inicial

`npm audit --omit=dev` reportou quatro altas: `next` direto e `nanoid`, `postcss` e `sharp` transitivos. `npm audit` reportou seis altas, acrescentando `brace-expansion` e `js-yaml` no ambiente de desenvolvimento.

| Pacote/cadeia | Alcance analisado | Tratamento |
|---|---|---|
| `next@15.5.19` | App Router e Server Actions sao usados; advisories proprios eram aplicaveis em potencial | atualizado para 15.5.23, sem major |
| `nanoid` via PostCSS | ferramenta transitiva, sem uso direto | atualizado de 3.3.15 para 3.3.18 |
| `js-yaml` via ESLint | somente tooling de desenvolvimento | atualizado para 4.3.1 |
| `brace-expansion` via Minimatch/ESLint | somente tooling com entradas do repositorio | atualizado dentro das faixas para 1.1.18 e 5.0.9, sem override |
| PostCSS interno do Next | CSS do build | permanece vulneravel no grafo, mas o build processa somente CSS estatico e confiavel |
| Sharp via Next | otimizacao de imagens | permanece vulneravel no grafo, mas nao existe caminho de imagem no produto atual |

Tambem foram alinhados `eslint-config-next@15.5.23`, `eslint@9.39.5`, `@eslint/eslintrc@3.3.6` e o PostCSS direto em 8.5.26. Nao houve `audit fix --force`, override, atualizacao major ou troca de runtime.

### Auditoria e aceite residual

A auditoria final deve ser lida literalmente: ela nao esta zerada. Restam tres altas em `npm audit --omit=dev` e tres na auditoria completa, agregadas em `next`, PostCSS interno 8.4.31 e Sharp 0.34.5. O npm indica Next 16 para remove-las, mas essa major nao foi autorizada.

O risco foi aceito somente para o modelo atual porque:

- nao existe CSS externo, dinamico ou controlado pelo usuario;
- o CSS do build e estatico e confiavel;
- nao existe uso de `next/image`;
- nao existe upload, importacao ou processamento de imagem;
- CSV e o unico tipo de arquivo enviado e possui validacao dedicada;
- nao existe rota nem configuracao de imagem remota/local nao confiavel para o otimizador.

Gatilhos obrigatorios de reavaliacao: adocao de `next/image`; qualquer upload/processamento de imagem; CSS externo ou do usuario; temas personalizados; preparacao para preview ou producao; e migracao planejada para Next 16.

Assim, `SEC-008` fica **mitigado parcialmente**, sem vulnerabilidade alta demonstravelmente alcancavel no desenho local atual. Os pacotes nao sao declarados corrigidos, o risco residual e conhecido e este aceite nao autoriza preview externo nem producao publica.

## SEC-010 - logging Prisma

O vazamento vinha da configuracao do Prisma Client com logging direto de `error`: a mensagem produzida pelo engine podia incorporar o valor que causou `P2002` antes que a resposta publica fosse neutralizada.

O cliente passou a emitir eventos para uma funcao pequena e testavel. O evento bruto nunca e encaminhado ao sink. A saida possui somente:

- nome fixo `application_error`;
- UUID aleatorio para correlacao sem identidade;
- contexto enumerado;
- classificacao tecnica;
- codigo Prisma validado no formato `Pdddd`, somente quando recebido separadamente em um erro conhecido.

`message`, `meta`, `stack`, argumentos, e-mail, senha, hash, token, descricao e valores nao fazem parte do tipo de saida. Warning do Prisma segue o mesmo descarte em desenvolvimento. Respostas publicas continuam controladas pelos fluxos existentes.

Tres testes unitarios exercitam payloads sinteticos adversariais. Um teste PostgreSQL real provoca duplicidade `P2002` e confirma que e-mail, hash e nome sinteticos nao aparecem no sink, preservando a classificacao tecnica. `SEC-010` fica **mitigado** no logger controlado pela aplicacao. Observabilidade externa continua como gate de deployment.

## SEC-009 - contrato tecnico de origem e proxy

O Next 15.5.23 ja compara `Origin` com `Host` ou `X-Forwarded-Host` nas Server Actions. O projeto nao requer origem alternativa e, portanto, nao adiciona allowlist nem mecanismo concorrente. O cookie de sessao usa `Secure` em producao, `HttpOnly`, `SameSite=Lax` e escopo `/`.

Contrato independente de provedor:

1. existir uma unica origem publica canonica em HTTPS;
2. o proxy remover valores `X-Forwarded-*` fornecidos pelo cliente e escrever os valores canonicos;
3. `Host`, `Origin` e protocolo encaminhado devem representar a requisicao publica original;
4. a origem do runtime nao pode ser acessivel diretamente pelo publico;
5. origens adicionais so podem ser configuradas por necessidade comprovada e lista fechada;
6. a aplicacao nao usa `X-Forwarded-For`, `X-Forwarded-Host` ou `X-Forwarded-Proto` como identidade/autorizacao;
7. configuracao ausente ou inconsistente deve impedir a liberacao, nao ampliar confianca em headers.

Checklist futuro: testar same-origin e cross-origin atras do proxy, host invalido, headers forjados, HTTPS/redirects, cookie `Secure`, acesso direto a origem e logs da plataforma. Sem provedor ou deploy, `SEC-009` permanece **mitigado parcialmente** e como gate operacional de preview externo.

## Regressao e migrations

- teste especifico unitario de logging: 3 testes aprovados;
- testes unitarios completos: 11 arquivos e 59 testes aprovados;
- integracao PostgreSQL completa: 13 arquivos e 64 testes aprovados;
- as nove migrations foram aplicadas desde a primeira em banco descartavel;
- nenhuma migration ou mudanca semantica de schema foi criada;
- lint, TypeScript, build, `prisma format` e `prisma validate` aprovados;
- `prisma generate` aprovado com Prisma Client 5.22.0.

## Riscos residuais e recomendacao

- PostCSS e Sharp vulneraveis permanecem no grafo e exigem reavaliacao pelos gatilhos documentados;
- proxy, headers encaminhados, origem canonica, TLS, cookies e observabilidade externa nao foram validados em deployment;
- `SEC-002`, `SEC-003` e `SEC-012` permanecem fora deste bloco;
- `BCK-011` e `BCK-012` continuam pendentes, `BCK-031` permanece ideia e `BCK-032/033` permanecem GAPs P1;
- nao existe autorizacao para preview externo ou producao publica.

O Bloco 7B deve decidir os gates finais e a eventual integracao da Sprint 5 sem converter este resultado tecnico em aprovacao operacional. A Sprint 5 permanece aberta.

> Nota de continuidade: o gate posterior foi aprovado no Bloco 7B e esta documentado em [`docs/18-sprint-5-closure.md`](18-sprint-5-closure.md). O fechamento autoriza integracao local, nao preview, producao ou deploy.
