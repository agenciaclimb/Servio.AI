# Branch Protection Configuration Guide

**Repository**: agenciaclimb/Servio.AI  
**Branch**: main  
**Status**: ✅ ACTIVE  
**Last Verified**: 2025-12-15

---

## Current Configuration

### Required Status Checks

- ✅ **CI/CD Pipeline** must pass before merging
- ✅ **Tests** (npm test) must pass
- ✅ **Lint** checks must pass
- ✅ **Build** must succeed

### Branch Protection Rules

```yaml
Branch: main
└── Require a pull request before merging: ✅
    ├── Require approvals: 0 (can be increased for team review)
    ├── Dismiss stale pull request approvals when new commits are pushed: ✅
    └── Require review from Code Owners: ❌ (optional)

└── Require status checks to pass before merging: ✅
    ├── Require branches to be up to date before merging: ✅
    └── Status checks that are required:
        ├── build-and-test
        ├── lint
        └── smoke-tests

└── Require conversation resolution before merging: ✅

└── Include administrators: ❌ (admins can bypass for emergencies)

└── Restrict who can push to matching branches: ❌
```

---

## Verification Checklist

### 1. Access GitHub Branch Protection

```bash
# Navigate to:
https://github.com/agenciaclimb/Servio.AI/settings/branches
```

### 2. Verify Main Branch Rules

- [ ] "Require a pull request before merging" is enabled
- [ ] "Require status checks to pass before merging" is enabled
- [ ] CI/CD checks are listed as required
- [ ] "Require conversation resolution" is enabled

### 3. Test Protection (Simulation)

```bash
# Attempt direct push to main (should fail):
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test: direct push"
git push origin main
# Expected: ❌ Error - protected branch

# Proper workflow:
git checkout -b feat/test-branch-protection
git push origin feat/test-branch-protection
# Then create PR on GitHub
```

### 4. CI/CD Integration

- [ ] GitHub Actions workflow runs on PR
- [ ] Tests execute automatically
- [ ] Lint checks run
- [ ] Build process completes
- [ ] Merge blocked if any check fails

---

## Configuration Commands

### Enable via GitHub CLI (gh)

```bash
# Install GitHub CLI: https://cli.github.com/
gh auth login

# Enable branch protection for main:
gh api repos/agenciaclimb/Servio.AI/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["build-and-test","lint"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field required_conversation_resolution=true \
  --field restrictions=null
```

### Verify Protection Status

```bash
gh api repos/agenciaclimb/Servio.AI/branches/main/protection | jq
```

---

## Troubleshooting

### Issue: "Push declined due to branch protection"

**Solution**: This is expected! Create a feature branch and PR instead.

### Issue: "PR can't be merged - status checks required"

**Solution**: Wait for CI/CD to complete. Fix any failing tests/lint errors.

### Issue: "Admin bypass needed for hotfix"

**Temporary Override**:

1. Go to Settings → Branches → Edit main protection
2. Temporarily disable "Require status checks"
3. Merge critical fix
4. **Immediately re-enable protection**

---

## Maintenance

### Monthly Verification

```bash
# Add to monthly checklist:
- [ ] Branch protection still active on main
- [ ] CI/CD checks still required
- [ ] No unauthorized changes to rules
- [ ] Test protection with dummy PR
```

### Update Required Checks

When adding new CI/CD jobs, update required checks:

1. Settings → Branches → Edit main
2. "Require status checks to pass"
3. Add new check to list (e.g., "e2e-tests", "security-scan")
4. Save changes

---

## References

- **GitHub Docs**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- **CI/CD Config**: `.github/workflows/ci.yml`
- **Issue Tracking**: [#33](https://github.com/agenciaclimb/Servio.AI/issues/33)

---

**Last Updated**: 2025-12-15  
**Task**: task-1.0  
**Status**: ✅ COMPLETE
