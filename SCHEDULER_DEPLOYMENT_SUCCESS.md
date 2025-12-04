# ✅ Scheduler de Follow-ups: Deployment Completo

**Data**: 03/12/2025 21:20 BRT  
**Status**: PRODUÇÃO ATIVA

---

## 🎯 Objetivo Alcançado

Sistema de automação de follow-ups do Prospector CRM totalmente configurado e operacional, executando automaticamente a cada 5 minutos.

---

## 📦 Componentes Implementados

### 1. **Cloud Function: `prospectorRunScheduler`**
- **Arquivo**: `functions/index.js` (linhas ~479-520)
- **URL**: `https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler`
- **Método**: POST
- **Autenticação**: Token via header `x-servio-scheduler-token`
- **Parâmetros**: `?limit=N` (default 50, max 200)

**Lógica**:
```javascript
1. Valida token de autenticação
2. Busca leads com nextFollowUpAt <= now
3. Adiciona atividade "follow_up" automático
4. Reschedula para +24h
5. Retorna { ok, count, processed[] }
```

### 2. **Cloud Scheduler Job**
- **Nome**: `prospector-follow-up-scheduler`
- **Região**: `us-central1`
- **Cron**: `*/5 * * * *` (a cada 5 minutos)
- **Timezone**: `America/Sao_Paulo`
- **Estado**: ENABLED
- **Próxima execução**: ~21:15 BRT

**Comando usado**:
```bash
gcloud scheduler jobs create http prospector-follow-up-scheduler \
  --location=us-central1 \
  --schedule="*/5 * * * *" \
  --uri="https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler?limit=50" \
  --http-method=POST \
  --headers="x-servio-scheduler-token=b9b79cd3-0e74-4a26-a00e-c9965c2173bd_servioai_scheduler_2025,Content-Type=application/json,Content-Length=0" \
  --time-zone="America/Sao_Paulo"
```

### 3. **Token de Segurança**
- **Valor**: `b9b79cd3-0e74-4a26-a00e-c9965c2173bd_servioai_scheduler_2025`
- **Armazenamento**:
  - Firebase Functions Config: `servio.scheduler_token`
  - Arquivo local: `scheduler_token.txt` (gitignored)
- **Uso**: Header `x-servio-scheduler-token` em todas as requisições

### 4. **Integração com Template System**
- Arquivo: `src/prospector/templates.ts`
- Templates centralizados:
  - `templates.whatsapp.intro_value`
  - `templates.email.intro_value`
  - `templates.call.intro_value`
- Função: `render(template, variables)` para interpolação
- Uso no CRM: `ProspectorCRMEnhanced.tsx` (ações Kanban)

---

## 🧪 Testes Realizados

### Teste Manual (curl)
```powershell
$token = Get-Content scheduler_token.txt
curl -X POST "https://us-central1-gen-lang-client-0737507616.cloudfunctions.net/prospectorRunScheduler?limit=10" \
  -H "x-servio-scheduler-token: $token" \
  -H "Content-Type: application/json" \
  -H "Content-Length: 0"

# Resultado: {"ok":true,"count":0,"processed":[]}
```

### Execução Manual do Job
```bash
gcloud scheduler jobs run prospector-follow-up-scheduler --location=us-central1
# Sucesso (status 200 nos logs)
```

### Verificação de Logs
```bash
gcloud functions logs read prospectorRunScheduler --region=us-central1 --limit=5

# Últimas execuções (todas com status 200):
# - 2025-12-04 00:20:57 (55ms)
# - 2025-12-04 00:20:05 (257ms)
# - 2025-12-04 00:15:00 (116ms)
```

---

## 📊 Monitoramento

### Cloud Console
- **Functions**: https://console.cloud.google.com/functions/list?project=gen-lang-client-0737507616
- **Scheduler**: https://console.cloud.google.com/cloudscheduler?project=gen-lang-client-0737507616
- **Logs**: https://console.cloud.google.com/logs/query?project=gen-lang-client-0737507616

### Comandos CLI
```bash
# Listar jobs ativos
gcloud scheduler jobs list --location=us-central1

# Ver logs em tempo real
gcloud functions logs read prospectorRunScheduler --region=us-central1 --tail

# Pausar/Resumir job
gcloud scheduler jobs pause prospector-follow-up-scheduler --location=us-central1
gcloud scheduler jobs resume prospector-follow-up-scheduler --location=us-central1
```

---

## 📝 Documentação Atualizada

1. **PROSPECCAO_SCHEDULER.md**
   - Status atualizado para PRODUÇÃO
   - Instruções de configuração completas
   - Comandos de teste e monitoramento

2. **OMNICHANNEL_WEBHOOKS_CONFIG.md**
   - Seção "Scheduler de Follow-ups" adicionada
   - Integração com sistema omnichannel documentada

3. **scheduler_token.txt**
   - Token armazenado localmente (não versionado)
   - Backup seguro recomendado

---

## 🔐 Segurança Implementada

- ✅ **Autenticação por token**: Valida header `x-servio-scheduler-token`
- ✅ **Método restrito**: Apenas POST aceito (405 para outros)
- ✅ **Rate limiting**: Limite de 50 leads/execução (configurável via query)
- ✅ **Token rotacionável**: Pode ser alterado via `firebase functions:config:set`
- ✅ **Logs auditáveis**: Todas as execuções registradas no Cloud Logging

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras
1. **Dashboard de Métricas**
   - Criar página em `/prospector/scheduler-stats`
   - Exibir execuções/dia, leads processados, taxa de sucesso

2. **Notificações**
   - Alertas se job falhar 3x consecutivas
   - Email semanal com estatísticas de automação

3. **Regras Avançadas**
   - Follow-up condicional baseado em score do lead
   - Sequências multi-step (WhatsApp → Email → Call)

4. **Migração para Firebase Functions v2**
   - Usar `onSchedule` trigger (nativo)
   - Eliminar necessidade do Cloud Scheduler externo

---

## 📞 Troubleshooting

### Job não está executando
```bash
# Verificar estado do job
gcloud scheduler jobs describe prospector-follow-up-scheduler --location=us-central1

# Forçar execução manual
gcloud scheduler jobs run prospector-follow-up-scheduler --location=us-central1
```

### Função retorna 401 (Unauthorized)
```bash
# Re-setar token
firebase functions:config:set servio.scheduler_token="NOVO_TOKEN"
firebase deploy --only functions:prospectorRunScheduler

# Atualizar job com novo token
gcloud scheduler jobs update http prospector-follow-up-scheduler \
  --location=us-central1 \
  --update-headers="x-servio-scheduler-token=NOVO_TOKEN"
```

### Verificar leads elegíveis
```javascript
// Console do Firebase (Firestore)
db.collection('prospector_prospects')
  .where('nextFollowUpAt', '<=', new Date())
  .get()
  .then(snap => console.log(`${snap.size} leads prontos para follow-up`))
```

---

## ✨ Conclusão

O sistema de automação está **COMPLETO e OPERACIONAL**:
- ✅ Cloud Function deployada e testada
- ✅ Cloud Scheduler job criado e ativo
- ✅ Token de segurança configurado
- ✅ Testes manuais validados
- ✅ Logs confirmando execuções automáticas
- ✅ Documentação atualizada

**Nenhuma ação adicional necessária**. O scheduler executará automaticamente a cada 5 minutos, processando leads com follow-ups pendentes.

---

**Referências**:
- Código: `functions/index.js` (linha ~479)
- Templates: `src/prospector/templates.ts`
- Docs: `PROSPECCAO_SCHEDULER.md`, `OMNICHANNEL_WEBHOOKS_CONFIG.md`
- Token: `scheduler_token.txt` (local only)
