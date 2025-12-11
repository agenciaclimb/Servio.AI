# 🔐 GUIA DE REVOGAÇÃO DE CHAVES - SERVIO.AI

**Data**: 11 de dezembro de 2025  
**Status**: ✅ Histórico Git limpo | ⚠️ Chaves precisam ser revogadas

---

## ✅ CONCLUÍDO (Automatizado)

### 1. Limpeza do Histórico Git

- ✅ BFG Repo-Cleaner executado com sucesso
- ✅ **714 commits** reescritos
- ✅ **3 chaves API** removidas de todo o histórico:
  - `AIzaSyAP6gJyy_oTE6P7-DLYLHXsS54CkTPcdBs` (Google Places API)
  - `AIzaSyCC-HKRTbdshJo4xwj5g2UkZB54WCasmAE` (Firebase servioai)
  - `AIzaSyBQT9x-6Rf4IiC_iMIBCLw8JjUqE0Ic-Z0` (Firebase production)
- ✅ Force push para GitHub concluído (`main` branch)
- ✅ Backup criado em: `C:\Users\JE\servio-ai-backup.git`

### 2. Arquivos Modificados

- `doc/DOCUMENTO_MESTRE_SERVIO_AI.md` - 6 ocorrências removidas
- `doc/MIGRACAO_PROJETO_SERVIOAI.md` - 1 ocorrência removida
- `doc/PROGRESSO_PROSPECCAO_FASE1.md` - 2 ocorrências removidas
- `doc/README_PRODUCAO.md` - 2 ocorrências removidas
- `.env.example` - 1 ocorrência removida
- `.env.production.example` - 3 ocorrências removidas

---

## ⚠️ AÇÕES CRÍTICAS PENDENTES (Executar AGORA)

### 1. REVOGAR CHAVES NO GOOGLE CLOUD CONSOLE

#### 🔴 Chave 1: Google Places API Key

1. Abra [Google Cloud Console](https://console.cloud.google.com/)
2. Navegue para: **APIs & Services** → **Credentials**
3. Procure pela chave: `AIzaSyAP6gJyy_oTE6P7-DLYLHXsS54CkTPcdBs`
4. Clique nos **3 pontos** → **Delete API Key**
5. Confirme a exclusão

#### 🔴 Chave 2: Firebase API Key (servioai)

1. Abra [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto: **servioai**
3. Configurações do Projeto → **Chaves da Web API**
4. Procure pela chave: `AIzaSyCC-HKRTbdshJo4xwj5g2UkZB54WCasmAE`
5. **Revogue** ou **Restrinja** com Application Restrictions

#### 🔴 Chave 3: Firebase API Key (gen-lang-client-0737507616)

1. Abra [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto: **gen-lang-client-0737507616**
3. Configurações do Projeto → **Chaves da Web API**
4. Procure pela chave: `AIzaSyBQT9x-6Rf4IiC_iMIBCLw8JjUqE0Ic-Z0`
5. **Revogue** ou **Restrinja** com HTTP referrers

---

### 2. GERAR NOVAS CHAVES RESTRITAS

#### Google Places API Key (nova)

```bash
# Google Cloud Console → APIs & Services → Credentials → Create Credentials → API Key
# Configurar restrições:
- Application Restrictions: IP addresses (adicionar IPs do Cloud Run)
- API Restrictions: Places API, Geocoding API
```

#### Firebase API Keys (novas)

**NOTA**: Firebase Web API Keys são públicas por design, mas devem ter restrições:

1. **servioai** (desenvolvimento):
   - Firebase Console → Project Settings → Web API Key
   - Add → HTTP referrers: `localhost:*`, `127.0.0.1:*`
2. **gen-lang-client-0737507616** (produção):
   - Firebase Console → Project Settings → Web API Key
   - Add → HTTP referrers: `gen-lang-client-0737507616.web.app`, `*.firebaseapp.com`

---

### 3. ADICIONAR NOVAS CHAVES AO SECRET MANAGER

```bash
# Google Places API Key
gcloud secrets create GOOGLE_PLACES_API_KEY \
  --data-file=- <<< "NOVA_CHAVE_AQUI" \
  --project=gen-lang-client-0737507616

# Ou via Console:
# Cloud Console → Secret Manager → Create Secret
# Name: GOOGLE_PLACES_API_KEY
# Secret value: [cole a nova chave]
```

**NUNCA commite as novas chaves ao Git!**

---

### 4. ATUALIZAR BACKEND PARA USAR SECRET MANAGER

Verificar se o backend já está configurado para Secret Manager:

```javascript
// backend/src/index.js (exemplo)
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function accessSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: `projects/gen-lang-client-0737507616/secrets/${secretName}/versions/latest`,
  });
  return version.payload.data.toString();
}

const PLACES_API_KEY = await accessSecret('GOOGLE_PLACES_API_KEY');
```

---

### 5. VERIFICAR RESOLUÇÃO DOS ALERTAS

#### GitGuardian

1. Acesse [GitGuardian Dashboard](https://dashboard.gitguardian.com/)
2. Verifique se os alertas foram marcados como **Resolved**
3. Se ainda aparecerem, marque manualmente como "Fixed - History rewritten"

#### GitHub Secret Scanning

1. Acesse: https://github.com/agenciaclimb/Servio.AI/security/secret-scanning
2. Confirme que não há alertas ativos
3. Se houver, clique em **Dismiss** → "Revoked"

---

## 📊 RESUMO EXECUTIVO

| Ação                              | Status          | Responsável                      |
| --------------------------------- | --------------- | -------------------------------- |
| Limpeza histórico Git             | ✅ Concluído    | Automatizado (BFG)               |
| Force push GitHub                 | ✅ Concluído    | Automatizado                     |
| Backup repositório                | ✅ Criado       | C:\Users\JE\servio-ai-backup.git |
| Revogar chave Places API          | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |
| Revogar chave Firebase servioai   | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |
| Revogar chave Firebase production | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |
| Gerar novas chaves restritas      | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |
| Adicionar ao Secret Manager       | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |
| Verificar GitGuardian             | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |

---

## 🚨 TIMELINE CRÍTICA

- **Agora (17:30 UTC)**: Histórico Git limpo ✅
- **Próximas 2 horas**: Revogar as 3 chaves no GCP Console ⚠️
- **Próximas 24 horas**: Gerar novas chaves + Secret Manager ⚠️
- **48 horas**: Verificar alertas resolvidos ⚠️

---

## 📞 SUPORTE

Se houver problemas:

1. Backup disponível em: `C:\Users\JE\servio-ai-backup.git`
2. Relatório BFG em: `C:\Users\JE\servio.ai.bfg-report\2025-12-11\17-26-50\`
3. Commits limpos: 714 commits reescritos
4. Objetos modificados: 1222 object IDs alterados

---

**⏰ PRÓXIMA AÇÃO IMEDIATA**: Abra o Google Cloud Console e revogue as 3 chaves listadas acima.
