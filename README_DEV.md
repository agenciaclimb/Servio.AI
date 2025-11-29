## Testes de Backend em Modo Memória

- Use `createDbWrapper(true)` nos testes para forçar memória.
- Utilize `db.fieldValue` (helpers contextuais) em vez de `admin.firestore.FieldValue`.
- `serverTimestamp` no modo memória retorna `Date` real (compatível com asserções).

Exemplo:

```js
// backend/tests/dbWrapper.test.js
const { createDbWrapper } = require('../src/dbWrapper');

describe('dbWrapper', () => {
  let db;
  beforeEach(() => {
    db = createDbWrapper(true); // força memória
  });

  it('increment', async () => {
    const ref = db.collection('users').doc('u1');
    await ref.set({ score: 10 });
    await ref.update({ score: db.fieldValue.increment(5) });
    const snap = await ref.get();
    expect(snap.data().score).toBe(15);
  });
});
```

### CI sem segredos

- Workflow: `.github/workflows/backend-ci-memory.yml` roda testes do backend em memória (sem Firebase).
- `NODE_ENV=test` e sem `GOOGLE_CLOUD_PROJECT` garantem fallback em memória.

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
