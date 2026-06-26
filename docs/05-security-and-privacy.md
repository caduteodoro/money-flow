# 05 - Segurança e privacidade

## Princípios

- Privacidade por padrão.
- Menor exposição possível de dados financeiros.
- Isolamento rigoroso por `userId`.
- Logs úteis sem conteúdo sensível em claro.
- Evolução considerando LGPD/GDPR.

## Regras atuais

- `.env` real não deve ser versionado.
- Extratos reais não devem entrar no GitHub.
- Não criar telas administrativas para visualizar transações dos usuários.
- Descrições de transações, CPF, dados bancários e nomes completos não devem ser logados sem necessidade.

## Autenticação futura

Na Sprint 1, revisar:

- Hash de senha com algoritmo forte.
- Política de sessão.
- Cookies seguros.
- Proteção de rotas.
- Rate limiting em rotas sensíveis.

## Upload futuro

Na Sprint 2, revisar:

- Tamanho máximo.
- Extensões permitidas.
- MIME type.
- Parsing seguro.
- Scanner de arquivos no roadmap.
- Armazenamento temporário com limpeza.

## Criptografia futura

Antes de produção, avaliar criptografia de campos sensíveis e uma arquitetura que impeça operadores da plataforma de visualizar transações individuais.
