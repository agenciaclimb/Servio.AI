# Task 3.2 — Integrar Gemini CLI com GitHub Actions

ID: 3.2
Protocolo: v4.0

Descrição:
Configuração de workflow no GitHub Actions para executar Gemini CLI em eventos de push/PR.

Critérios de Aceitação:

- Workflow do GitHub Actions configurado
- CLI executada em eventos de push e pull request
- Workflow gera relatórios e logs
- Workflow configurável para diferentes ambientes
- Status da execução visível no GitHub

Arquivos:

- Criar: `.github/workflows/gemini_cli.yml`
- Modificar: (nenhum)

Dependências: (nenhuma)
Esforço Estimado: 6h

Plano de Implementação:

1. Adicionar workflow YAML com jobs de audit/validate
2. Configurar secrets para GEMINI_API_KEY
3. Executar CLI em `pull_request` e `push`
4. Artefatos: salvar relatório de auditoria
5. Validar em branch de teste
