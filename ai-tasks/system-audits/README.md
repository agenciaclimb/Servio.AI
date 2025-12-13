# System Audits Directory

This directory contains weekly system-wide security and quality audits generated automatically by the Gemini System Audit workflow.

## Structure

```
ai-tasks/system-audits/
├── system-audit-2025-W01.json   # Week 1 of 2025
├── system-audit-2025-W01.md     # Week 1 report
├── system-audit-2025-W02.json
├── system-audit-2025-W02.md
└── ...
```

## Schedule

- **Trigger**: Every Monday at 02:00 UTC
- **Workflow**: `.github/workflows/gemini-system-audit.yml`
- **Runner**: `scripts/gemini/run_system_audit.cjs`

## Report Contents

Each audit includes:

1. **Metrics**
   - Total commits
   - Contributors
   - Branches
   - Source files count
   - Test files count

2. **Security scan**
   - Potential secret leaks
   - Sensitive patterns in git history

3. **Gemini analysis**
   - Risk level assessment (LOW/MEDIUM/HIGH)
   - Findings
   - Recommendations

## Non-blocking

Unlike PR audits, system audits are **informational only**:

- ✅ Do NOT block development
- ✅ Do NOT prevent merges
- ✅ Provide weekly health snapshots
- ✅ Track long-term trends

## Access

Reports are committed automatically to main branch by `github-actions[bot]`.

## Manual trigger

```bash
gh workflow run gemini-system-audit.yml
```
