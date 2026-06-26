# Money Flow - Orientação para agentes Codex

## Visão do produto

Money Flow é um sistema web de finanças pessoais com o slogan "Seu GPS financeiro pessoal." O produto ajuda usuários a importar extratos bancários, inicialmente CSV e depois OFX, para gerar KPIs, dashboards, gráficos, tabelas, categorias editáveis e insights financeiros.

Este repositório também é um projeto de estudo técnico e portfólio profissional. Toda mudança deve preservar clareza, segurança, documentação e evolução incremental.

## Stack obrigatória

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Docker Compose.

## Princípios de privacidade

- Nunca usar dados bancários reais no repositório.
- Nunca versionar extratos reais.
- Nunca registrar descrições completas de transações, CPF, dados de conta bancária, nomes completos ou valores sensíveis sem necessidade.
- Assumir LGPD/GDPR como requisito de produto desde o roadmap.
- Preparar a arquitetura para criptografia futura de campos sensíveis.
- Planejar uma arquitetura em que operadores da plataforma não consigam visualizar transações individuais dos usuários.

## Regras de segurança

- Toda consulta de transações, contas, categorias, importações e regras deve filtrar por `userId`.
- Não criar telas administrativas para visualizar dados financeiros de usuários.
- Uploads futuros devem validar extensão, MIME type, tamanho, estrutura e conteúdo.
- Logs de auditoria devem registrar eventos importantes sem texto financeiro sensível em claro.
- Senhas futuras devem usar hash forte, com biblioteca reconhecida e configuração revisada.
- Preparar pontos de integração para scanner de arquivos no futuro.
- Tratar CSV/OFX como entrada não confiável.

## Regras de documentação

- Manter `README.md` e `docs/` atualizados em toda sprint.
- Registrar decisões de arquitetura quando alterarem modelo, segurança, importação ou analytics.
- Documentar limitações conhecidas e o que ainda é mockado.
- Não prometer funcionalidades que ainda não existem sem marcar como planejadas.

## Regras de desenvolvimento

- Preferir mudanças pequenas, coesas e testáveis.
- Seguir os padrões existentes antes de criar novas abstrações.
- Usar TypeScript estrito.
- Manter componentes de UI desacoplados da lógica de domínio.
- Não implementar funcionalidades fora da sprint atual sem alinhamento.
- Não introduzir dependências novas sem motivo claro.

## Escopo do MVP

- Cadastro e login.
- Sessão e rotas protegidas.
- Upload CSV.
- Preview, validação e importação.
- Deduplicação por `dedupeKey`.
- Histórico de importações.
- Dashboard com KPIs, gráficos, filtros, tabela e insights.
- Categorias pai/filha, edição manual e regras automáticas.
- Audit logs, revisão de privacidade e documentação final do MVP.

## Formatos de extrato

- CSV: suportado no MVP.
- OFX: prioridade após o MVP inicial.
- PDF: fora do escopo de importação automática no MVP.

## Avisos permanentes

- Nunca versionar extratos reais.
- Nunca criar tela administrativa que exponha transações dos usuários.
- Sempre considerar LGPD/GDPR no roadmap.
- Sempre manter README e docs atualizados.
