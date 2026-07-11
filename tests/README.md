# Testes de integração

O PostgreSQL de integração é descartável e separado do desenvolvimento: usa o projeto Compose `money-flow-test`, banco `money_flow_test` e porta local `5434`. O diretório de dados usa `tmpfs`, sem volume persistente.

Execute o ciclo seguro completo com `npm run test:integration`. O orquestrador valida o destino, sobe somente `docker-compose.test.yml`, aguarda o healthcheck, aplica as migrations existentes, roda os testes e remove o container em `finally`.

Os scripts `test:integration:db:up`, `test:integration:migrate` e `test:integration:db:down` permitem diagnóstico por etapa. Todos usam credenciais sintéticas internas e passam pelo guardrail que rejeita o banco e a porta de desenvolvimento. O comando de encerramento não remove volumes.
