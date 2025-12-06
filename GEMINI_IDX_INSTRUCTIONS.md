# 🤖 Instruções para Gemini (Google IDX)

## 📋 O QUE VOCÊ PRECISA SABER

Você está ajudando no desenvolvimento do **Servio.AI**, um marketplace de serviços com IA integrada.

### ✅ O Que Você PODE Fazer

- **Ler arquivos** do projeto
- **Criar novos arquivos** (componentes, serviços, testes)
- **Editar arquivos existentes** (corrigir bugs, adicionar features)
- **Analisar código** e sugerir melhorias
- **Propor arquiteturas** e padrões

### ❌ O Que Você NÃO PODE Fazer

- **Executar comandos no terminal** (`npm`, `git`, `gcloud`, etc.)
- **Fazer commit automático** no Git
- **Fazer push automático** para GitHub
- **Rodar testes** ou servidores

---

## 🔄 WORKFLOW OBRIGATÓRIO

### Quando Você Editar/Criar Arquivos

**IMPORTANTE:** Após qualquer edição de código, você DEVE informar o desenvolvedor para executar:

```bash
# No terminal do Google IDX
git add .
git commit -m "feat: [descrever o que você fez]"
git push origin main
```

**Exemplo de mensagem que você deve enviar:**

```
✅ Arquivos criados/editados com sucesso!

📝 Arquivos modificados:
- src/components/NewFeature.tsx (criado)
- src/types.ts (editado - adicionada interface NewFeatureProps)
- backend/src/routes/feature.js (criado)

🚀 PRÓXIMO PASSO (VOCÊ PRECISA FAZER):
Execute no terminal do IDX:

git add .
git commit -m "feat: implementa NewFeature com validação"
git push origin main

Depois, execute no VS Code local:
.\sync-servio.ps1 -Mode Pull
```

---

## 📐 PADRÕES & CONVENÇÕES CRÍTICAS

### 1. **Email como ID** ⚠️

```javascript
// ✅ CORRETO
db.collection('users').doc('user@example.com');

// ❌ ERRADO
db.collection('users').doc(auth.currentUser.uid);
```

### 2. **Enums em Português**

```typescript
// User types
type UserType = 'cliente' | 'prestador' | 'admin' | 'prospector';

// Job statuses
type JobStatus = 'ativo' | 'suspenso' | 'concluido' | 'cancelado' | 'em_progresso';
```

### 3. **Estrutura de Commits**

```
<tipo>: <descrição curta>

Tipos válidos:
- feat: Nova funcionalidade
- fix: Correção de bug
- docs: Documentação
- style: Formatação
- refactor: Refatoração
- test: Testes
- chore: Manutenção
```

### 4. **Imports e Paths**

```typescript
// Frontend
import { User, Job } from '../types';
import { db, auth } from '../firebaseConfig';

// Backend
const db = require('../dbWrapper');
const { requireAuth } = require('../authorizationMiddleware');
```

### 5. **Tratamento de Erros**

```javascript
// Sempre use try-catch em async functions
try {
  const result = await someAsyncOperation();
  return res.status(200).json(result);
} catch (error) {
  console.error('Error in operation:', error);
  return res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
}
```

---

## 🎯 ARQUIVOS PRINCIPAIS

### Frontend (React + TypeScript)

| Arquivo                                   | Propósito              | Cuidado ao Editar               |
| ----------------------------------------- | ---------------------- | ------------------------------- |
| `src/App.tsx`                             | Routing principal      | ⚠️ Não quebrar rotas existentes |
| `src/types.ts`                            | Interfaces globais     | ⚠️ Mudanças afetam todo projeto |
| `src/components/ClientDashboard.tsx`      | Dashboard do cliente   | ✅ Pode editar                  |
| `src/components/ProviderDashboard.tsx`    | Dashboard do prestador | ✅ Pode editar                  |
| `src/components/MetricsPageDashboard.tsx` | Analytics (Fase 3)     | ⚠️ Conectado a Cloud Scheduler  |

### Backend (Node.js + Express)

| Arquivo                                    | Propósito                | Cuidado ao Editar                      |
| ------------------------------------------ | ------------------------ | -------------------------------------- |
| `backend/src/index.js`                     | All routes (4010 linhas) | ⚠️⚠️⚠️ MUITO CUIDADO - arquivo crítico |
| `backend/src/authorizationMiddleware.js`   | Auth/autorização         | ⚠️ Não quebrar requireAuth             |
| `backend/src/routes/scheduler.js`          | Cloud Scheduler handlers | ⚠️ Conectado a jobs automáticos        |
| `backend/src/services/analyticsService.js` | Analytics                | ✅ Pode editar                         |
| `backend/src/services/geminiService.js`    | AI (você!)               | ✅ Pode editar                         |

### Configurações

| Arquivo                    | Propósito    | Cuidado ao Editar                   |
| -------------------------- | ------------ | ----------------------------------- |
| `firestore.rules`          | Segurança DB | ⚠️⚠️⚠️ Testar muito antes de deploy |
| `package.json`             | Dependencies | ⚠️ Não quebrar scripts existentes   |
| `.github/workflows/ci.yml` | CI/CD        | ⚠️ Deployment automático            |

---

## 🚀 TAREFAS COMUNS

### Criar Novo Componente React

```typescript
// src/components/NewComponent.tsx
import React from 'react';
import { NewComponentProps } from '../types';

const NewComponent: React.FC<NewComponentProps> = ({ prop1, prop2 }) => {
  return (
    <div>
      {/* Implementação */}
    </div>
  );
};

export default NewComponent;
```

**Depois de criar:**

1. Adicionar interface `NewComponentProps` em `src/types.ts`
2. Importar no componente pai
3. Informar dev para commitar

### Adicionar Endpoint Backend

```javascript
// Em backend/src/index.js (ou arquivo de rota apropriado)
app.post('/api/nova-rota', requireAuth, async (req, res) => {
  try {
    const email = req.auth.email;
    const { param1, param2 } = req.body;

    // Validação
    if (!param1 || !param2) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Lógica
    const result = await db.collection('collection_name').doc(docId).set({ data });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error in /api/nova-rota:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});
```

**Depois de adicionar:**

1. Documentar em `API_ENDPOINTS.md`
2. Adicionar teste (se necessário)
3. Informar dev para commitar

### Corrigir Bug

```bash
# 1. Identificar o problema
# 2. Ler o arquivo relevante
# 3. Propor correção explicando:
#    - O que estava errado
#    - Por que estava causando bug
#    - Como sua correção resolve
# 4. Fazer a edição
# 5. Informar dev para testar e commitar
```

---

## 🧪 TESTES

### Você NÃO pode executar, mas pode criar:

```typescript
// src/components/__tests__/NewComponent.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewComponent from '../NewComponent';

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

**Depois de criar teste:**

```
✅ Teste criado em: src/components/__tests__/NewComponent.test.tsx

🚀 PRÓXIMO PASSO:
Execute no terminal do IDX:

git add .
git commit -m "test: adiciona testes para NewComponent"
git push origin main

Depois, no VS Code local:
npm test
```

---

## 📊 COLLECTIONS FIRESTORE

### Estrutura Atual

| Collection             | Doc ID                  | Campos Principais                   |
| ---------------------- | ----------------------- | ----------------------------------- |
| `users`                | email                   | type, name, phone, avatar           |
| `jobs`                 | auto                    | clientId, providerId, title, status |
| `proposals`            | auto                    | jobId, proposalId, status           |
| `prospector_prospects` | {prospectorId}\_{phone} | name, phone, enrichedData           |
| `prospector_campaigns` | auto                    | prospectorId, channels, status      |
| `analytics_daily`      | YYYY-MM-DD              | metrics, campaigns                  |

### Ao Criar Nova Collection

```javascript
// Backend
const newDoc = await db.collection('new_collection').add({
  field1: value1,
  field2: value2,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

**Depois de criar:**

1. Atualizar `firestore.rules` com permissões
2. Documentar em `IDX_CONTEXT.md`
3. Informar dev para deploy das rules

---

## ⚠️ QUANDO PEDIR AJUDA DO DEV

### Situações que você NÃO pode resolver sozinho:

1. **Executar testes** → Dev precisa rodar `npm test`
2. **Ver logs de produção** → Dev precisa rodar `gcloud logging read`
3. **Deploy** → Dev precisa rodar `npm run build` e `firebase deploy`
4. **Instalar dependências** → Dev precisa rodar `npm install`
5. **Testar API** → Dev precisa rodar `curl` ou Postman
6. **Resolver conflitos Git** → Dev precisa editar manualmente

### Como pedir:

```
❌ Não posso executar comandos no terminal.

🙋 PRECISO DE AJUDA:
Execute no terminal do IDX:

npm install nova-dependencia
npm test

Depois me informe o resultado para eu continuar.
```

---

## 🎯 CHECKLIST PRÉ-COMMIT

Antes de pedir para o dev commitar, verifique:

- [ ] Código segue padrões do projeto (email como ID, enums em PT)
- [ ] Imports corretos e completos
- [ ] Tratamento de erros em try-catch
- [ ] Validação de inputs em endpoints
- [ ] Tipos TypeScript corretos (se frontend)
- [ ] Comentários explicando lógica complexa
- [ ] Nenhum console.log desnecessário
- [ ] Nenhum código comentado "morto"

---

## 📞 INFORMAÇÕES DE CONTEXTO

### URLs Importantes

- **Frontend**: https://gen-lang-client-0737507616.web.app
- **Backend**: https://servio-backend-v2-1000250760228.us-west1.run.app
- **GitHub**: https://github.com/agenciaclimb/Servio.AI
- **Firebase Console**: https://console.firebase.google.com/project/gen-lang-client-0737507616

### Secrets (NÃO hardcodar!)

```javascript
// ❌ NUNCA FAZER
const apiKey = 'AIza...hardcoded...';

// ✅ SEMPRE FAZER
const apiKey = process.env.GEMINI_API_KEY;
```

### Status Atual

```
✅ Fase 3 COMPLETA
- 5 Cloud Scheduler jobs ativos
- Analytics Dashboard live
- Backend revision: 00025-dp2
- Frontend: Production LIVE

🎯 Próxima Fase: Phase 4
- AI Autopilot
- Marketplace Matching
```

---

## 🤝 MENSAGEM FINAL

**Lembre-se:**

1. Você é **EXCELENTE** em analisar e escrever código ✅
2. Você **NÃO PODE** executar comandos ❌
3. **SEMPRE** informe o dev após criar/editar arquivos 📢
4. Siga os **padrões do projeto** rigorosamente 📐
5. Quando em dúvida, **pergunte antes de editar** ❓

**Objetivo:** Trabalhar EM EQUIPE com o desenvolvedor para criar código de qualidade!

---

**Última Atualização**: 05/12/2025  
**Versão**: 1.0  
**Mantido por**: Servio.AI Team
