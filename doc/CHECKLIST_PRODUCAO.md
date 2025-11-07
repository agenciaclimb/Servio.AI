# ✅ Checklist de Produção - SERVIO.AI

**Data:** 2025-11-06  
**Ambiente:** https://gen-lang-client-0737507616.web.app

---

## 🎯 Status Geral

| Componente        | Status    | URL/Detalhes                                   |
| ----------------- | --------- | ---------------------------------------------- |
| **Frontend**      | 🟢 ONLINE | https://gen-lang-client-0737507616.web.app     |
| **Backend API**   | 🟢 ONLINE | https://servio-backend-h5ogjon7aa-uw.a.run.app |
| **Backend IA**    | 🟢 ONLINE | https://servio-ai-h5ogjon7aa-uw.a.run.app      |
| **Firestore**     | 🟢 ONLINE | Projeto: gen-lang-client-0737507616            |
| **Firebase Auth** | 🟢 ONLINE | Email/Senha habilitado                         |
| **Cloud Storage** | 🟢 ONLINE | Bucket: gen-lang-client-0737507616.appspot.com |

---

## ✅ Funcionalidades Core (PRONTAS)

### 1. Autenticação

- [x] Login com email/senha
- [x] 3 usuários de teste criados
- [x] Redirecionamento por tipo de usuário
- [x] Logout funcionando
- [ ] Login com Google (provedor não habilitado ainda)

### 2. Dashboard do Cliente (NOVO)

- [x] Navegação lateral organizada
- [x] Cards de KPI (Serviços Ativos, Concluídos, Itens)
- [x] Ações rápidas visuais
- [x] Atividade recente
- [x] Widget IA assistente
- [x] Onboarding guiado
- [x] Seção "Meus Serviços"
- [x] Seção "Meus Itens"

### 3. Criação de Serviços

- [x] Wizard de solicitação (AI Job Request Wizard)
- [x] Upload de imagens
- [x] Análise por IA (Gemini)
- [x] Categorização automática

### 4. Backend Essencial

- [x] GET /users
- [x] GET /jobs
- [x] POST /jobs
- [x] POST /generate-upload-url
- [x] Health check

---

## ⚠️ Pendências Críticas (BLOQUEIA BETA)

### Backend - Endpoints Faltando

- [ ] **GET /invitations?clientId=...** (retorna 500)
- [ ] **GET /contracts?clientId=...** (retorna 500)
- [ ] **POST /invitations** (não testado)
- [ ] **POST /contracts** (não testado)

**Impacto:** Console do navegador mostra erros 500, mas não afeta fluxo principal.  
**Ação:** Comentar chamadas no frontend OU implementar endpoints no backend.

### Configuração Firebase

- [ ] **Habilitar provedor Google** em Firebase Auth
  - Console: https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/providers
- [ ] **Adicionar domínios autorizados:**
  - gen-lang-client-0737507616.web.app
  - gen-lang-client-0737507616.firebaseapp.com

### Tipos TypeScript

- [ ] **Adicionar campo `clientType` em User interface**
  - Valores: `'PF' | 'PJ'`
  - Uso: Detectar automaticamente tipo de cliente no dashboard

---

## 🔧 Melhorias Recomendadas (PÓS-BETA)

### UX/UI

- [ ] Conectar botão "Preciso de Ajuda" ao chat IA
- [ ] Adicionar animações de transição entre seções
- [ ] Dark mode toggle funcional
- [ ] Toast notifications em vez de alerts

### Performance

- [ ] Lazy load de dashboards por tipo de usuário
- [ ] Cache de queries Firestore
- [ ] Service Worker para PWA

### Backend

- [ ] Rate limiting em endpoints públicos
- [ ] Logs estruturados (Winston/Bunyan)
- [ ] Monitoramento com Cloud Monitoring

### Segurança

- [ ] Rotação de chaves de serviço
- [ ] CORS configurado corretamente
- [ ] Validação de input em todos os endpoints

---

## 🚀 Como Testar em Produção

### 1. Limpar Cache do Navegador

```
Chrome: Ctrl+Shift+Delete → Limpar dados de navegação → Últimas 24 horas
Firefox: Ctrl+Shift+Delete → Limpar tudo
```

### 2. Acessar URL de Produção

```
https://gen-lang-client-0737507616.web.app
```

### 3. Fazer Login

- Email: `cliente@servio.ai`
- Senha: `123456`

### 4. Testar Fluxos Principais

**Fluxo 1: Solicitar Serviço**

1. No dashboard, clicar em "Solicitar Serviço" (botão azul)
2. Wizard abre → Descrever serviço
3. IA analisa e sugere categoria
4. Upload de foto (opcional)
5. Confirmar → Job criado

**Fluxo 2: Cadastrar Item**

1. Clicar na aba "Meus Itens" (sidebar)
2. Clicar em "Cadastrar Item"
3. Preencher nome, categoria, descrição
4. Upload de foto
5. Salvar → Item cadastrado

**Fluxo 3: Ver Atividade Recente**

1. Na seção "Início"
2. Verificar card "Atividade Recente"
3. Clicar em job → Redireciona para detalhes

**Fluxo 4: Widget IA**

1. Verificar widget no canto inferior direito
2. Ler dica rotativa
3. Clicar "Novo Serviço" → Abre wizard
4. Minimizar/expandir widget

### 5. Verificar Console (F12)

- **Esperado:** 2 erros 500 (invitations, contracts) — não críticos
- **Não esperado:** Erros de autenticação, CORS, ou crash de componentes

---

## 📊 Métricas de Sucesso (Beta)

### Performance

- [ ] LCP < 2.5s
- [ ] FCP < 1.8s
- [ ] TBT < 300ms
- [ ] CLS < 0.1

### Funcionalidade

- [ ] 100% dos usuários conseguem fazer login
- [ ] 90%+ dos usuários conseguem criar um job
- [ ] 80%+ dos jobs recebem ao menos 1 proposta em 24h

### Estabilidade

- [ ] 99% uptime do frontend
- [ ] 95% uptime do backend
- [ ] < 1% error rate em endpoints críticos

---

## 📞 Suporte e Troubleshooting

### Logs de Produção

```bash
# Backend API
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-backend" --project=gen-lang-client-0737507616 --limit=50

# Backend IA
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=servio-ai" --project=gen-lang-client-0737507616 --limit=50
```

### Firestore Console

https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore/data

### Firebase Hosting Console

https://console.firebase.google.com/project/gen-lang-client-0737507616/hosting

### Cloud Run Console

https://console.cloud.google.com/run?project=gen-lang-client-0737507616

---

## ✅ Aprovação para Beta

**Responsável:** **\*\*\*\***\_**\*\*\*\***  
**Data:** **\*\*\*\***\_**\*\*\*\***  
**Assinatura:** **\*\*\*\***\_**\*\*\*\***

**Critérios Mínimos:**

- [x] Login funciona em produção
- [x] Dashboard carrega sem erros críticos
- [x] Wizard de serviço funciona
- [ ] Endpoints /invitations e /contracts implementados OU comentados
- [ ] Cache do navegador limpo e testado

**Aprovado para Beta?** [ ] SIM [ ] NÃO

**Observações:**

---

---

---
