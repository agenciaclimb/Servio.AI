# 🤖 IA INTEGRATION MANIFEST – Servio.AI

## **Para: Qualquer IA (Gemini, Claude, OpenAI, Manus, etc.)**

Se você é uma IA sendo integrada ao projeto **Servio.AI**, este arquivo contém as instruções que você **DEVE** seguir.

---

## 🎯 **Seu Objetivo**

Você é parte de um ecossistema profissional de engenharia. Sua responsabilidade é manter o sistema **estável, funcional e produção-ready** em 100% do tempo.

---

## 📜 **1. LEIA PRIMEIRO**

Antes de fazer qualquer coisa, **leia integralmente**:

```
/DOCUMENTO_MESTRE_SERVIO_AI.md
  → Seção: "🛡️ SERVIO.AI – PROTOCOLO OFICIAL"
  → Seção: "⚙️ IA OPERATING MODE – SERVIO.AI ENGINEERING 2.0"
```

Estes documentos definem como você **deve operar** no Servio.AI.

---

## ⚙️ **2. SEUS MODOS OPERACIONAIS**

### 🔴 **MODO 1: DESENVOLVIMENTO NORMAL**

Quando trabalhando em novos módulos ou features:

1. ✅ Consulte o Documento Mestre (estado atual do sistema)
2. ✅ Identifique dependências e impacto
3. ✅ Crie código seguindo arquitetura existente
4. ✅ Rode testes completos ao terminar
5. ✅ Se QUALQUER teste falhar → ative MODO 2 imediatamente

### 🟡 **MODO 2: HOTFIX (ATIVADO QUANDO TESTES FALHAM)**

1. 🛑 **STOP** – Pause TODO desenvolvimento
2. 🔍 **DIAGNOSE** – Identifique a causa raiz (não o sintoma)
3. 🔧 **FIX** – Corrija o problema real
4. 📝 **DOCUMENT** – Registre no Documento Mestre (#update_log)
5. ✅ **REVALIDATE** – Rode todos os testes novamente
6. 🔄 **REPEAT** – Se outro erro surgir, volte ao passo 1

### 🟢 **MODO 3: ESTABILIDADE TOTAL**

Quando 100% dos testes estão verdes:

1. ✅ Confirmar que o sistema está em "Green State"
2. ✅ Revisar logs do Cloud Run (sem erros)
3. ✅ Validar webhooks (SendGrid, WhatsApp, etc.)
4. ✅ Conferir Firestore (permissões OK, sem falhas)
5. ✅ Declarar sistema como "READY FOR PRODUCTION" ou "READY FOR NEXT PHASE"

---

## 🚨 **3. PROTOCOLO HOTFIX 1.0 (OBRIGATÓRIO)**

### Quando ativar:
- ❌ Qualquer teste E2E falha
- ❌ Qualquer teste de integração falha
- ❌ Qualquer teste unitário falha
- ❌ Cloud Run mostra erros nos logs
- ❌ Webhook não processa eventos
- ❌ Firestore falha permissões
- ❌ WhatsApp não envia mensagens
- ❌ AI responde com contradições ou loops

### Como proceder:

```
┌─ PASSO 1: Diagnosticar causa raiz
│  • Qual é o erro exato?
│  • Onde ocorre? (qual arquivo/linha)
│  • Por que ocorre?
│  • Como reproduzir?
│
├─ PASSO 2: Criar branch fix
│  git checkout -b fix/[nome-do-erro]
│
├─ PASSO 3: Corrigir o problema REAL (não apenas o teste)
│  • Editar backend/frontend/firestore/webhook conforme necessário
│  • NÃO alterar testes para mascarar bugs
│  • NÃO usar gambiarras
│
├─ PASSO 4: Commit estruturado
│  git commit -m "fix: [descrição clara da correção]"
│
├─ PASSO 5: Registrar no Documento Mestre
│  Adicionar seção #update_log com:
│  - Data e hora (YYYY-MM-DD HH:MM)
│  - Qual teste falhou
│  - Causa raiz identificada
│  - Impacto do bug
│  - Tipo da correção (backend/frontend/IA/etc)
│  - Arquivos alterados
│  - Link do PR
│
├─ PASSO 6: Criar Pull Request
│  Descrever:
│  • Motivo do bug
│  • Impacto no sistema
│  • Como foi corrigido
│  • Arquivos modificados
│
├─ PASSO 7: Revalidar TODOS os testes
│  npm test                # Testes unitários
│  npm run test:backend    # Backend tests
│  npm run e2e:smoke       # E2E tests
│
└─ PASSO 8: Repetir até 100% verde
   Se outro erro aparecer → volte ao PASSO 1
```

---

## 📋 **4. CÓDIGO DE CONDUTA (OBRIGATÓRIO)**

### ✅ PERMITIDO

- ✅ Corrigir bugs reais
- ✅ Implementar features siguindo arquitetura
- ✅ Registrar tudo no Documento Mestre
- ✅ Rodar testes completos
- ✅ Fazer perguntas sobre o sistema
- ✅ Sugerir melhorias documentadas
- ✅ Revisar código existente
- ✅ Otimizar performance com testes

### ❌ PROIBIDO

- ❌ Ignorar falhas de teste
- ❌ Alterar testes para passar artificialmente
- ❌ Usar soluções temporárias (gambiarras)
- ❌ Fazer push direto na main
- ❌ Silenciar erros
- ❌ Alterar comportamento sem documentar
- ❌ Criar lógica paralela para burlar testes
- ❌ Prosseguir desenvolvimento com testes falhando
- ❌ Modificar regras de segurança (Firestore, Auth)
- ❌ Comentar código sem razão técnica

---

## 🟢 **5. GREEN STATE CHECKLIST**

Antes de declarar o sistema "pronto", confirme:

- [ ] 100% dos testes E2E passam
- [ ] 100% dos testes de integração passam
- [ ] 100% dos testes unitários passam
- [ ] Cloud Run tem status HEALTHY (sem erros)
- [ ] Firestore sem falhas de permissão
- [ ] Webhooks processando eventos corretamente
- [ ] WhatsApp enviando mensagens + mídia
- [ ] Nenhum fluxo trava ou entra em deadlock
- [ ] AI respondendo logicamente (sem loops)
- [ ] Documento Mestre atualizado
- [ ] Logs revisados (sem warnings críticos)

---

## 📚 **6. ARQUITETURA CRÍTICA (MEMORIZE)**

### Identidades de Usuário

```javascript
// ⚠️ NUNCA use Firebase Auth UID
// ✅ SEMPRE use email como ID

// ERRADO:
const userId = auth.currentUser.uid;  // ❌ PROIBIDO

// CORRETO:
const userId = auth.currentUser.email; // ✅ OBRIGATÓRIO

// Exemplo correto em Firestore:
db.collection('users').doc(auth.currentUser.email).get()
```

### Colégios Firestore

```
users/{email}                    → Documentos de usuário
jobs/{jobId}                     → Ofertas/Jobs
prospector_prospects/{leadId}    → Leads do prospector
prospector_campaigns/{campaignId} → Campanhas enviadas
email_logs/{logId}               → Logs de SendGrid
email_events/{eventId}           → Eventos de email
conversations/{conversationId}   → Chats omnichannel
```

### Backend Endpoints (Cloud Run)

```
URL: https://servio-backend-v2-1000250760228.us-west1.run.app

/api/health                      → Health check
/api/prospector/import-leads     → Importar leads (AUTH REQUIRED)
/api/prospector/enrich-lead      → Enriquecer lead (AUTH REQUIRED)
/api/prospector/send-campaign    → Enviar campanha (AUTH REQUIRED)
/api/sendgrid-webhook            → Webhook SendGrid
/api/whatsapp-webhook            → Webhook WhatsApp
```

### Papéis de Usuário

```javascript
'cliente'       → Cliente (contrata prestadores)
'prestador'     → Service provider
'prospector'    → Prospection agent (NOVO)
'admin'         → Administrator
```

---

## 🔐 **7. SEGREDOS E VARIÁVEIS**

### Armazenadas em Google Cloud Secret Manager

```
GOOGLE_PLACES_API_KEY      → Google Places API
SENDGRID_API_KEY           → SendGrid Email API
GEMINI_API_KEY             → Google Gemini AI
STRIPE_SECRET_KEY          → Stripe Payments
WHATSAPP_BUSINESS_PHONE_ID → WhatsApp API
```

### NUNCA exponha secrets em:

- ❌ Código-fonte
- ❌ Logs
- ❌ Commits
- ❌ Variáveis de ambiente locais
- ❌ Documentação pública

### Para usá-los localmente:

```bash
# Copiar .env.example para .env.local
cp .env.example .env.local

# Preencher com valores locais de desenvolvimento
# (nunca usar valores de produção)
```

---

## 📞 **8. QUANDO PEDIR AJUDA**

Se encontrar algo que não entende:

1. **Primeiro**: Consulte o Documento Mestre
2. **Depois**: Procure em `API_ENDPOINTS.md`
3. **Depois**: Veja exemplos similares no código existente
4. **Finalmente**: Pergunte documentando a dúvida

### Como documentar uma pergunta:

```
[DÚVIDA] [Módulo]: Descrição clara da pergunta
Contexto: Onde está o código?
Tentativa anterior: O que já tentou?
Impacto: Por que precisa disso?
```

---

## 🎓 **9. RECURSOS OBRIGATÓRIOS**

Você **DEVE** ler e entender:

| Arquivo | Conteúdo | Tempo |
|---------|----------|-------|
| DOCUMENTO_MESTRE_SERVIO_AI.md | Estado, arquitetura, protocolo | 30 min |
| API_ENDPOINTS.md | Todas as rotas backend | 15 min |
| types.ts | Interfaces TypeScript | 10 min |
| firestore.rules | Regras de segurança | 15 min |
| STRIPE_GUIA_RAPIDO.md | Integração de pagamentos | 10 min |
| OMNICHANNEL_WEBHOOKS_CONFIG.md | Webhooks multicanal | 15 min |

**Total recomendado: 1h 15 min**

---

## 🚀 **10. FLUXO PADRÃO DE TRABALHO**

```
1. ✅ Ler tarefa solicitada
   └─ Consultar Documento Mestre para contexto

2. ✅ Planejar modificações
   └─ Listar arquivos que serão alterados
   └─ Identificar testes afetados

3. ✅ Fazer modificações
   └─ Seguir padrões de código existentes
   └─ Adicionar comentários em lógica complexa

4. ✅ Rodar testes locais
   └─ Verificar se nenhum teste quebrou

5. ✅ Fazer commit estruturado
   └─ Mensagem clara: "feat/fix: descrição"

6. ✅ Registrar no Documento Mestre
   └─ #update_log com contexto completo

7. ✅ Fazer push para GitHub
   └─ Esperar CI/CD validar

8. ✅ Confirmar estabilidade
   └─ Todos os testes verdes?
   └─ Cloud Run health OK?
   └─ Logs limpos?

9. ✅ Comunicar conclusão
   └─ Status final do sistema
   └─ Próximos passos recomendados
```

---

## 📊 **11. PRIORIDADES EXECUTIVAS**

Quando em conflito entre múltiplas tarefas:

```
PRIORIDADE 1: Estabilidade do sistema
             (Se quebrado, nada funciona)

PRIORIDADE 2: Correção de bugs críticos
             (Bugs bloqueiam usuários)

PRIORIDADE 3: Novos módulos/features
             (Adicionam funcionalidade)

PRIORIDADE 4: Otimizações
             (Sistema já está funcionando)

PRIORIDADE 5: Refatorações
             (Melhoram código, não funcionalidade)
```

---

## ✅ **12. VALIDAÇÃO FINAL**

Antes de finalizar uma tarefa, confirme:

- [ ] Código está 100% funcionando
- [ ] Todos os testes passam
- [ ] Documento Mestre foi atualizado
- [ ] Nenhuma regressão foi introduzida
- [ ] Logs não mostram erros críticos
- [ ] PR foi criada (se necessário)
- [ ] Equipe foi comunicada do progresso

---

## 📞 **CONTATO E SUPORTE**

Se a IA não conseguir resolver algo seguindo este manifesto:

1. Registre no Documento Mestre que a IA está bloqueada
2. Descreva exatamente o que não consegue fazer
3. Deixe código comentado explicando o problema
4. Crie uma issue no GitHub para humanos revisar

---

## 🎯 **RESUMO EXECUTIVO**

```
Você é parte de um sistema profissional.
Sua responsabilidade: Manter tudo estável e funcionando.

Se algo quebrar:
  → Pause tudo
  → Conserte a falha real
  → Registre no Documento Mestre
  → Revalidate tudo
  → Prossiga

Nunca ignore erros. Nunca use gambiarras.
Sempre priorize estabilidade sobre velocidade.

Bem-vindo ao Servio.AI Engineering Team 🚀
```

---

**Última atualização**: 04/12/2025  
**Status**: ATIVO  
**Validade**: Permanente até revogação explícita
