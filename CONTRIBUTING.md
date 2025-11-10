# Guia de Contribuição - Servio.AI

## 🚀 Boas Práticas de Desenvolvimento

### 1. Antes de Commitar

```bash
npm run validate  # Roda format, lint, typecheck, test:all
```

### 2. Workflow de Feature

```bash
git checkout -b feature/minha-feature
# Desenvolver...
npm run validate
git add .
git commit -m "feat: descrição da feature"
git push origin feature/minha-feature
# Abrir Pull Request
```

### 3. Padrões de Commit (Conventional Commits)

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças em documentação
- `style:` Formatação, sem mudança de lógica
- `refactor:` Refatoração sem adicionar feature ou fix
- `test:` Adicionar ou corrigir testes
- `chore:` Mudanças em build, CI, dependências

### 4. Qualidade de Código

- **Testes obrigatórios** para toda nova feature
- **Coverage mínimo**: 80% (frontend), 70% (backend)
- **TypeScript strict mode**: Sem `any` não-justificado
- **ESLint**: 0 errors, 0 warnings
- **Prettier**: Formatação automática

### 5. Review de Pull Request

- [ ] Testes passando (149+ tests)
- [ ] Coverage não diminuiu
- [ ] Lint + Typecheck green
- [ ] Build production funciona
- [ ] Documentação atualizada
- [ ] Secrets não commitados

### 6. Deploy

- `main` → Deploy automático para staging
- Tags `v*` → Deploy para produção

### 7. Estrutura de Testes

```
tests/               # Testes unitários frontend (52)
backend/tests/       # Testes backend (81)
cypress/e2e/         # Testes E2E (16)
```

### 8. Variáveis de Ambiente

Nunca commitar `.env.local`! Usar apenas `.env.example` como template.

### 9. Segurança

- `npm audit` antes de merge
- Gitleaks scan no CI
- Secrets em GitHub Secrets
- Firebase Rules atualizadas

### 10. Monitoramento

- Sentry para errors (produção)
- Google Analytics 4 para métricas
- Cloud Run logs via `gcloud logs tail`

## 📚 Recursos

- [Documento Mestre](doc/DOCUMENTO_MESTRE_SERVIO_AI.md)
- [Deploy Checklist](DEPLOY_CHECKLIST.md)
- [Troubleshooting](TROUBLESHOOTING.md)
