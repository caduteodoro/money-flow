# money-flow-security-review

## Quando usar

Use esta skill ao mexer em autenticação, upload, logs, banco de dados, autorização, dados financeiros ou qualquer área com impacto de privacidade.

## Objetivo

Revisar segurança, privacidade, LGPD/GDPR e upload seguro no Money Flow.

## Checklist de revisão

- Autenticação usa práticas seguras?
- Senhas usam hash forte?
- Rotas protegidas validam sessão?
- Queries filtram por `userId`?
- Upload valida extensão, MIME type, tamanho e conteúdo?
- Logs evitam dados sensíveis em claro?
- Não há exposição de transações de outros usuários?
- Não há tela administrativa com dados financeiros individuais?
- Há preparação para criptografia futura?
- Há preparação para scanner de arquivos no futuro?
- Entradas CSV/OFX são tratadas como não confiáveis?

## Saída esperada

- Achados por severidade.
- Recomendações práticas.
- Itens bloqueantes antes de produção.
- Testes ou validações sugeridas.
