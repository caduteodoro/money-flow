---
name: money-flow-security-review
description: Use ao revisar autenticação, autorização, sessões, uploads, logs, banco de dados, privacidade, LGPD, dados financeiros e isolamento por userId no Money Flow.
---

# Money Flow Security Review

## Quando usar

Use em mudanças ou revisões com impacto em autenticação, autorização, uploads, logs, dados financeiros, privacidade ou acesso ao banco.

## Objetivo

Identificar riscos de segurança e privacidade e propor correções proporcionais ao estágio do Money Flow.

## Instruções

- Verifique autenticação, sessão e proteção server-side das rotas.
- Confirme `userId` em toda consulta e mutação de dados do usuário.
- Trate CSV/OFX e IDs do navegador como entradas não confiáveis.
- Revise validação de extensão, MIME type, tamanho, estrutura e conteúdo de uploads.
- Verifique se logs e erros evitam senhas, tokens, descrições, valores e dados bancários.
- Considere LGPD/GDPR, criptografia futura e scanner de arquivos no roadmap.
- Classifique achados por severidade e diferencie bloqueios de produção de melhorias futuras.

## Checklist

- Senhas usam hash forte e tokens não são persistidos em claro?
- Rotas e Actions validam sessão no servidor?
- Queries, updates e relações são isolados por `userId`?
- Recursos inexistentes e alheios têm respostas indistinguíveis?
- Uploads são validados e tratados como não confiáveis?
- Não há tela administrativa expondo transações individuais?
- Logs e respostas não revelam dados financeiros sensíveis?

## Saída esperada

- Achados por severidade, com evidências.
- Risco, impacto e correção recomendada.
- Testes e validações necessários.
- Débitos de segurança claramente separados do escopo atual.

## Limites

- Não exponha dados financeiros reais nem segredos.
- Não crie migration ou altere schema sem autorização.
- Não amplie o escopo funcional para corrigir riscos não relacionados.
- Não declare segurança aprovada sem as validações correspondentes.
