# 🔒 SECURITY.md — Política de Segurança

**Versão**: 1.0  
**Status**: Ativo  
**Data**: 11 de dezembro de 2025

---

## Reportar Vulnerabilidades

❌ **NÃO** abrir GitHub Issue pública  
✅ **SIM** enviar email: security@servio.ai

---

## Políticas Obrigatórias

### 1. Segredos

- ❌ Nunca commitar `.env`
- ✅ Usar Google Cloud Secret Manager
- ✅ Variáveis injetadas em runtime
- ✅ Pre-commit hooks verificam regex

### 2. Autenticação

- Email é ID de usuário (não UID)
- JWT validado em todo endpoint
- Senhas hasheadas com bcrypt
- Auditoria de login ativa

### 3. Autorização

- Firestore rules por role
- `isAdmin()`, `isProvider()`, `isClient()`
- Validação backend
- Sem lógica segura somente em frontend

### 4. Dados

- PCI-DSS: Stripe trata cartões (nunca armazenar)
- GDPR: Direito ao esquecimento implementado
- Backup diário
- Criptografia em trânsito (HTTPS)

### 5. Dependências

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Exigência: 0 vulnerabilidades
```

### 6. Código

- Validação de input
- Output encoding
- CSRF protection
- Rate limiting

---

## Security Checklist

- [ ] Sem `.env` em repositório
- [ ] Pre-commit scanner ativo
- [ ] npm audit passando
- [ ] Firestore rules auditadas
- [ ] JWT validado em todas as rotas
- [ ] Secrets em Secret Manager
- [ ] Backup verificado
- [ ] Logs de auditoria ativos

---

## Contato Segurança

- **Email**: security@servio.ai
- **Resposta**: 24h máximo
- **Disclosure**: Responsível (90 dias)

---

_Security Policy | Servio.AI | Production_
