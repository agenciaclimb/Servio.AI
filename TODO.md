# TODOs e Melhorias Futuras - SERVIO.AI

Este documento rastreia funcionalidades pendentes e melhorias planejadas para versões futuras.

## 🔴 Crítico (Antes de Produção)

### Backend - Pagamentos

- **Stripe Payout/Transfer Implementation**
  - **Arquivo**: `backend/src/index.js:136`
  - **Descrição**: Implementar transferência real para conta conectada do prestador via Stripe
  - **Status**: ✅ Concluído - Lógica implementada com `stripe.transfers.create()`
  - **Impacto**: Alto - necessário para liberação de pagamentos real
  - **Referência**: [Stripe Connect Documentation](https://stripe.com/docs/connect)

## 🟡 Importante (v1.1)

### Frontend - Admin

- **Suspend Provider Logic**
  - **Arquivo**: `doc/FraudAlertModal.tsx:37`
  - **Descrição**: Implementar lógica de suspensão de prestador após alerta de fraude
  - **Status**: Placeholder com alert
  - **Impacto**: Médio - segurança da plataforma

### Testes

- **Expandir Cobertura de Testes**
  - **Cobertura Atual**: Backend 38%, Frontend ~0%
  - **Meta**: Backend 70%+, Frontend 50%+
  - **Foco**: Jobs CRUD, Disputes, File Upload, Stripe webhooks

## 🟢 Desejável (Futuro)

### Documentação

- **API Documentation**
  - Gerar documentação Swagger/OpenAPI para todos os endpoints
  - Adicionar exemplos de requests/responses

### Monitoramento

- **Logging Estruturado**
  - Implementar Winston ou Pino para logs estruturados
  - Integrar com Google Cloud Logging

### Performance

- **Caching Strategy**
  - Implementar cache Redis para queries frequentes
  - Cache de perfis de usuário e catálogo de serviços

## 📋 Próximas Versões

Ver `doc/PLANO_POS_MVP_v1.1.md` para roadmap completo.

---

**Última atualização**: 31/10/2025 21:05
