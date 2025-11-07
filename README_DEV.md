# README_DEV — Abertura do Workspace (Dev)

Passos mínimos para abrir o projeto e evitar travamentos de agentes (Gemini / IA):

1. Abrir o projeto no VS Code:
   cd "C:\Users\JE\servio.ai"
   code .

2. Confiar no Workspace (Trust) quando solicitado pelo VS Code.

3. Recarregar a janela do VS Code:
   Command Palette → Developer: Reload Window

4. Abrir os painéis de Gemini:
   - Gemini: Open Chat
   - Gemini: Sign In

5. Checar Output → selecionar "Gemini Code Assist" para confirmar logs/estado.

Scripts úteis:

- Listar arquivos grandes (> 5MB): PowerShell -> `./scripts/find_large_files.ps1`
- Limpar arquivos .log grandes: PowerShell -> `./scripts/cleanup_large_logs.ps1`

Observações:

- Foi adicionada configuração do VS Code para reduzir indexação pesada e aumentar memória do tsserver.
- Entradas de build/artefatos foram adicionadas ao `.gitignore` para evitar indexação por agentes/CI.
