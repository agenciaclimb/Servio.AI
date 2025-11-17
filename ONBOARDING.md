# 👋 Bem-vindo ao Servio.AI!

**Guia de Onboarding para Desenvolvedores**

---

## 🎯 Sobre o Projeto

O **Servio.AI** é uma plataforma que conecta clientes a prestadores de serviços qualificados. Este guia vai te ajudar a começar a contribuir rapidamente.

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Firebase
- **Database**: Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Payments**: Stripe
- **AI**: Google Gemini 2.0
- **Tests**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Hosting**: Firebase Hosting + Cloud Run

---

## 🚀 Setup Inicial (15 minutos)

### 1. Pré-requisitos

Certifique-se de ter instalado:

- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) (recomendado)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`

### 2. Clone e Instale

```bash
# Clone o repositório
git clone https://github.com/agenciaclimb/Servio.AI.git
cd servio.ai

# Instale dependências
npm install

# Instale browsers Playwright
npx playwright install chromium
```

### 3. Configure Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```bash
# Firebase (pedir ao tech lead)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=servio-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=servio-ai
VITE_FIREBASE_STORAGE_BUCKET=servio-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# Desenvolvimento
VITE_USE_MOCK_DATA=true
VITE_ENABLE_ANALYTICS=false
```

### 4. Primeiro Build

```bash
# Verificar se tudo está OK
npm run typecheck
npm test
npm run build

# Iniciar servidor dev
npm run dev
```

Acesse: http://localhost:5173

---

## 📁 Estrutura do Projeto

```
servio.ai/
├── src/                    # Código fonte frontend
│   ├── components/         # Componentes React
│   ├── contexts/           # Context API
│   ├── services/          # Serviços (API, Firebase)
│   └── App.tsx            # Componente principal
├── backend/               # Backend Node.js
│   └── src/               # Código backend
├── tests/                 # Testes unitários
│   ├── e2e/              # Testes E2E (Playwright)
│   └── *.test.tsx        # Testes unitários (Vitest)
├── doc/                   # Documentação
├── scripts/              # Scripts utilitários
├── DEPLOY_CHECKLIST.md   # Checklist de deploy
├── PRODUCTION_READINESS.md  # Status de produção
└── COMANDOS_UTEIS.md     # Referência de comandos
```

### Principais Arquivos

- `src/App.tsx` - Entry point da aplicação
- `src/services/api.ts` - Client HTTP para backend
- `src/firebaseConfig.ts` - Configuração Firebase
- `vite.config.ts` - Configuração Vite
- `playwright.config.ts` - Configuração E2E

---

## 🔧 Workflow de Desenvolvimento

### 1. Criar Nova Feature

```bash
# 1. Criar branch
git checkout -b feature/nome-da-feature

# 2. Desenvolver
npm run dev

# 3. Escrever testes
# Criar arquivo: tests/MinhaFeature.test.tsx

# 4. Executar testes
npm test

# 5. Validar código
npm run lint:fix
npm run format
npm run typecheck
```

### 2. Antes de Commitar

```bash
# Validação completa
npm run validate

# Se tudo passar:
git add .
git commit -m "feat: descrição da feature"
git push origin feature/nome-da-feature
```

### 3. Criar Pull Request

1. Vá para GitHub
2. Crie PR da sua branch para `main`
3. Aguarde CI passar (testes automáticos)
4. Solicite review
5. Mergear após aprovação

---

## 🧪 Testes

### Testes Unitários (Vitest)

```bash
# Rodar todos
npm test

# Watch mode (recomendado durante dev)
npm run test:watch

# Testar arquivo específico
npm run test:file -- MinhaFeature

# UI interativa
npm run test:ui
```

**Exemplo de teste**:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MinhaFeature from './MinhaFeature';

describe('MinhaFeature', () => {
  it('renderiza corretamente', () => {
    render(<MinhaFeature />);
    expect(screen.getByText('Título')).toBeInTheDocument();
  });
});
```

### Testes E2E (Playwright)

```bash
# Smoke tests (rápidos)
npm run e2e:smoke

# Com browser visível
npm run e2e:smoke:headed

# UI interativa (debug)
npm run e2e:ui
```

**Cobertura atual**: 48.36% (meta: >40% ✅)

---

## 🎨 Padrões de Código

### TypeScript

```typescript
// ✅ BOM - Tipos explícitos
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ EVITAR - any
function getUser(id: any): any {
  // ...
}
```

### React Components

```typescript
// ✅ BOM - Functional components com TypeScript
interface MyComponentProps {
  title: string;
  count: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, count }) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  );
};

// ❌ EVITAR - Props sem tipo
export const MyComponent = ({ title, count }) => {
  // ...
};
```

### Naming Conventions

- **Components**: PascalCase (`UserCard.tsx`)
- **Functions**: camelCase (`getUserById()`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase com I prefix opcional (`IUser` ou `User`)
- **Types**: PascalCase (`UserType`)

---

## 🐛 Debug

### Frontend

```typescript
// Usar console.warn/error em dev, não console.log
if (import.meta.env.DEV) {
  console.warn('Debug info:', data);
}

// React DevTools
// Instalar: https://react.dev/learn/react-developer-tools
```

### Backend

```javascript
// Logs estruturados
console.log('[API]', 'User created:', userId);
console.error('[ERROR]', 'Failed to create user:', error);
```

### E2E Tests

```bash
# Ver browser executando
npm run e2e:headed

# Pausar execução para debug
# No teste, adicione: await page.pause();

# Ver screenshots/vídeos
ls test-results/
```

---

## 📚 Recursos Importantes

### Documentação Obrigatória

1. [COMANDOS_UTEIS.md](./COMANDOS_UTEIS.md) - Referência rápida
2. [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Processo de deploy
3. [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) - Métricas e status

### Documentação Externa

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

## ❓ Perguntas Frequentes

### Como rodar apenas meus testes?

```bash
npm run test:file -- MeuArquivo
```

### Como atualizar dependências?

```bash
# Verificar updates disponíveis
npm run deps:update

# Atualizar específica
npm update nome-da-lib
```

### Build falha com erro de memória

```bash
# Aumentar limite de memória
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Erro de porta em uso

```bash
# Matar processo na porta
npx kill-port 5173
```

### Como usar mock data?

```bash
# No .env
VITE_USE_MOCK_DATA=true

# No código
import { MOCK_USERS } from './mockData';
```

---

## 🎯 Checklist do Primeiro Dia

- [ ] Clone e instale o projeto
- [ ] Configure `.env`
- [ ] Execute `npm run dev` com sucesso
- [ ] Execute `npm test` - todos passam
- [ ] Execute `npm run e2e:smoke` - todos passam
- [ ] Leia `COMANDOS_UTEIS.md`
- [ ] Configure VS Code extensions (ESLint, Prettier, TypeScript)
- [ ] Faça um commit simples (ex: atualizar README)
- [ ] Crie um PR de teste
- [ ] Converse com o time sobre a arquitetura

---

## 🤝 Como Contribuir

### Issues

1. Verifique se já existe issue similar
2. Use templates: Bug Report, Feature Request
3. Seja claro e detalhado
4. Adicione screenshots quando relevante

### Pull Requests

1. **Título claro**: `feat: adiciona filtro de busca`
2. **Descrição completa**: O que, por que, como
3. **Screenshots**: Para mudanças visuais
4. **Testes**: Adicione/atualize testes
5. **Documentação**: Atualize se necessário

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona novo componente
fix: corrige bug no login
docs: atualiza README
test: adiciona testes E2E
refactor: melhora performance do cache
chore: atualiza dependências
```

---

## 🆘 Precisa de Ajuda?

- **Tech Lead**: [nome@email.com]
- **Slack**: #servio-dev
- **Docs**: `doc/DOCUMENTO_MESTRE_SERVIO_AI.md`
- **Status Report**: `pwsh scripts/status-report.ps1`

---

## 🎉 Bem-vindo ao Time!

Estamos felizes em ter você no Servio.AI! 🚀

**Próximos Passos**:

1. Complete o checklist acima
2. Faça sua primeira contribuição
3. Participe do daily standup
4. Conheça o time

Qualquer dúvida, é só perguntar! 😊

---

**Última atualização**: 13/11/2025  
**Versão**: 1.0
