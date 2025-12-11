### Objetivo
Implementar um middleware de rate limiting para proteger endpoints sensíveis da API contra abuso e ataques de força bruta.

### Detalhes Técnicos
- **Biblioteca:** `express-rate-limit` ou similar.
- **Endpoints a Proteger:**
  - Autenticação (`/login`, `/register`)
  - Criação de Usuário (`POST /users`)
  - Submissão de Proposta (`POST /proposals`)

### Critérios de Aceitação
- [ ] Middleware implementado e aplicado aos endpoints definidos.
- [ ] Requisições acima do limite retornam HTTP 429.
- [ ] Configurações são controladas via variáveis de ambiente.
- [ ] Testes de integração validam o bloqueio e a permissão de requisições.
