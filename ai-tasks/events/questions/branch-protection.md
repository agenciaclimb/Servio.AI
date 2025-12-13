# BRANCH PROTECTION RULES - CONFIGURAÇÃO OBRIGATÓRIA

**Timestamp UTC**: 2025-12-13T14:05:00.000Z  
**Protocolo**: Supremo v4.0  
**Etapa**: ETAPA 2

## Situação

Branch `main` **NÃO está protegida** (HTTP 404 - Branch not protected).

## Risco de segurança

Sem branch protection, é possível:

- Fazer push direto para main (bypass de auditoria)
- Merge de PRs sem checks obrigatórios
- Violação do protocolo supremo

## Regras obrigatórias recomendadas

Para a branch `main`:

### 1. Status checks obrigatórios

- ✅ `Gemini Auditor Bot` (audit job)
- ✅ `PR Validation + Guardrails`
- ✅ `ci` (validação + guardrails)
- ⚠️ Bloquear merge até todos passarem

### 2. Proteções adicionais

- Require pull request reviews (1+ aprovações)
- Dismiss stale reviews when new commits pushed
- Require review from code owners (se aplicável)
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Do not allow bypassing the above settings

### 3. Restrições de push

- Restrict who can push to matching branches
- Admins: podem bypass (use com cautela)

## Configuração via GitHub CLI

```bash
gh api repos/agenciaclimb/Servio.AI/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=audit \
  --field required_status_checks[contexts][]="PR Validation + Guardrails" \
  --field enforce_admins=false \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field restrictions=null
```

## Configuração via GitHub UI

1. Ir para: https://github.com/agenciaclimb/Servio.AI/settings/branches
2. Clicar em "Add branch protection rule"
3. Branch name pattern: `main`
4. Marcar:
   - [x] Require a pull request before merging
   - [x] Require approvals (1)
   - [x] Require status checks to pass before merging
     - Adicionar: `audit` (Gemini Auditor Bot)
     - Adicionar: `PR Validation + Guardrails`
   - [x] Require conversation resolution before merging
5. Salvar

## Decisão necessária

Executor **NÃO pode configurar branch protection automaticamente** (requer permissões admin).

### Opções:

1. **Usuário configura manualmente** via GitHub UI
2. **Executor cria documentação** e bloqueia até configuração
3. **Prosseguir sem proteção** (NÃO RECOMENDADO - viola protocolo)

## Status atual

```json
{
  "branch": "main",
  "protected": false,
  "required_checks": [],
  "risk_level": "HIGH",
  "action": "AWAITING_USER_DECISION"
}
```
