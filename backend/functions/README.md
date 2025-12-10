# Firebase Cloud Functions - Servio.AI

Este diretório contém todas as Cloud Functions do projeto Servio.AI.

## 📋 Estrutura

```
backend/functions/
├── index.js              # Definições das Cloud Functions
├── index.test.js         # Testes unitários
├── package.json          # Dependências e scripts
├── omnichannelWebhook.js # Webhook para integrações (legacy)
└── README.md            # Esta documentação
```

## 🔐 Funções de Autenticação

### `processUserSignUp`

**Trigger**: `auth.user().onCreate()`  
**Objetivo**: Atribuir custom claim inicial ao novo usuário

Quando um usuário se registra via Firebase Auth, esta função:

1. Atribui o custom claim `{ role: 'cliente' }` automaticamente
2. Cria/atualiza o documento do usuário no Firestore (`users/{email}`)
3. Garante consistência entre Auth e Firestore

**Custom Claims no Servio.AI**:

- `role: 'cliente'` - Usuário padrão (contrata serviços)
- `role: 'prestador'` - Prestador de serviços
- `role: 'prospector'` - Acesso a ferramentas de prospecção
- `role: 'admin'` - Administrador do sistema

**Benefícios**:

- ✅ Controle de acesso baseado em roles (RBAC)
- ✅ Validação em Firestore Security Rules
- ✅ Middleware de autenticação no backend
- ✅ Token JWT contém role (sem necessidade de queries extras)

## 🛠️ Scripts de Manutenção

### Backfill Custom Claims

Se você já tem usuários no sistema antes de implementar custom claims, use o script de backfill:

```bash
npm run auth:backfill-claims
```

Este script:

1. Lista todos os usuários do Firebase Auth
2. Lê os documentos da coleção `users` no Firestore
3. Atribui custom claims baseado no campo `type`
4. Gera relatório detalhado em JSON

**Execução**:

```bash
# No diretório raiz do projeto
npm run auth:backfill-claims

# Ou diretamente
node backend/scripts/backfill-custom-claims.mjs
```

**Requisitos**:

- Credenciais Firebase Admin SDK configuradas
- Variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` ou `serviceAccountKey.json`

## 📦 Deploy

### Deploy de todas as functions

```bash
npm run functions:deploy
```

### Deploy de uma função específica

```bash
firebase deploy --only functions:processUserSignUp
```

### Ver logs em tempo real

```bash
npm run functions:logs

# Ou filtrando por função
firebase functions:log --only processUserSignUp
```

## 🧪 Testes

### Executar testes localmente

```bash
cd backend/functions
npm install
npm test
```

### Coverage

```bash
npm test -- --coverage
```

### Testes incluídos

- ✅ `processUserSignUp`: Atribuição de custom claims
- ✅ `processUserSignUp`: Criação de documento Firestore
- ✅ `processUserSignUp`: Error handling gracioso
- ✅ `isValidRole`: Validação de roles

## 🔄 Emuladores Firebase

Para testar functions localmente:

```bash
# Iniciar emuladores (Auth + Firestore + Functions)
firebase emulators:start

# Em outro terminal, executar testes
npm run test:backend
```

## 📚 Documentação Adicional

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Custom Claims Guide](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🔐 Segurança

**IMPORTANTE**:

- Custom claims são armazenados no JWT do usuário
- Não armazene dados sensíveis em custom claims
- Claims têm limite de 1000 bytes
- Claims são atualizados no próximo refresh do token (pode levar até 1 hora)

**Forçar refresh do token**:

```javascript
// No frontend
const user = firebase.auth().currentUser;
await user.getIdToken(true); // true = forçar refresh
```

## 🚀 Roadmap

- [ ] Function para atualizar custom claims quando `users.type` muda
- [ ] Function para validar permissões em operações críticas
- [ ] Webhook para notificações de mudança de role
- [ ] Logs estruturados com Winston/Bunyan
- [ ] Metrics e monitoring (Cloud Monitoring)

---

**Versão**: 1.0.0  
**Última atualização**: 09/12/2025  
**Mantido por**: Servio.AI Team
