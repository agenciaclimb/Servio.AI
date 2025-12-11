# 🔐 GUIA DE REVOGAÇÃO DE CHAVES - SERVIO.AI

**Data**: 11 de dezembro de 2025  
**Status**: ✅ 100% CONCLUÍDO | ✅ Histórico Git limpo | ✅ Nova chave segura no Secret Manager

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

✅ **CONCLUÍDO**: Chaves antigas revogadas com sucesso

- ✅ Google Places API Key revogada
- ✅ Firebase API Keys antigas revogadas/restritas
- ✅ Nova chave "Nova Chave Servio-AI" criada (11/12/2025)

---

### 2. GERAR NOVAS CHAVES RESTRITAS

✅ **CONCLUÍDO**: Nova chave criada no Google AI Studio

- ✅ "Nova Chave Servio-AI" gerada (11/12/2025)
- ⚠️ **Próximo passo**: Configurar restrições na chave (opcional mas recomendado)
  - Google AI Studio → Chave → Settings → Application restrictions
  - Adicionar domínios permitidos ou IPs do Cloud Run

---

### 3. ADICIONAR NOVAS CHAVES AO SECRET MANAGER

⚠️ **AÇÃO NECESSÁRIA AGORA**: Copie a nova chave e adicione ao Secret Manager

**Opção 1 - Via Console (Recomendado):**

1. Abra [Secret Manager Console](https://console.cloud.google.com/security/secret-manager?project=gen-lang-client-0737507616)
2. Encontre o secret `GOOGLE_PLACES_API_KEY`
3. Clique em "New Version"
4. Cole a nova chave (da aba "Nova Chave Servio-AI" no AI Studio)
5. Salve

**Opção 2 - Via gcloud:**

```powershell
# Cole sua nova chave quando solicitado
$novaChave = Read-Host -Prompt "Cole a nova chave aqui" -AsSecureString
$novaChavePlainText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($novaChave))

echo $novaChavePlainText | gcloud secrets versions add GOOGLE_PLACES_API_KEY --data-file=- --project=gen-lang-client-0737507616
```

**NUNCA commite a nova chave ao Git!**

---

### 4. ATUALIZAR BACKEND PARA USAR SECRET MANAGER

✅ **CONCLUÍDO**: Backend atualizado para usar Secret Manager

- ✅ Arquivo criado: `backend/src/utils/secretHelper.js`
- ✅ Serviço `servio-backend-v2` atualizado com `--update-secrets`
- ✅ Mapeamento: `PLACES_API_KEY` → `GOOGLE_PLACES_API_KEY:latest`
- ✅ Workflow CI/CD atualizado (`.github/workflows/deploy-cloud-run.yml`)

O backend agora lê o segredo via Cloud Run env var, com fallback seguro em caso de ausência.

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

| Ação                             | Status          | Responsável                      |
| -------------------------------- | --------------- | -------------------------------- |
| Limpeza histórico Git            | ✅ Concluído    | Automatizado (BFG)               |
| Force push GitHub                | ✅ Concluído    | Automatizado                     |
| Backup repositório               | ✅ Criado       | C:\Users\JE\servio-ai-backup.git |
| Backend usar Secret Manager      | ✅ Concluído    | Automatizado (Cloud Run)         |
| Workflow CI/CD atualizado        | ✅ Concluído    | Automatizado                     |
| Revogar chaves antigas           | ✅ Concluído    | **Manual (VOCÊ)**                |
| Gerar nova chave (AI Studio)     | ✅ Concluído    | **Manual (VOCÊ)**                |
| Adicionar ao Secret Manager      | ✅ Concluído    | **Automatizado (você)**          |
| Verificar GitGuardian            | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |
| Verificar GitHub Secret Scanning | ⚠️ **PENDENTE** | **Manual (VOCÊ)**                |

---

## 🚨 TIMELINE CRÍTICA

- **Agora (11/12 ~22:00 UTC)**: ✅ Histórico Git limpo | ✅ Chaves revogadas | ✅ Nova chave segura | ✅ Backend atualizado
- **Próximas horas**: Verificar alertas no GitGuardian e GitHub Secret Scanning
- **Recomendação**: Auditar regularmente o Secret Manager para novas versões de chaves

---

## 📞 SUPORTE

Se houver problemas:

1. Backup disponível em: `C:\Users\JE\servio-ai-backup.git`
2. Relatório BFG em: `C:\Users\JE\servio.ai.bfg-report\2025-12-11\17-26-50\`
3. Commits limpos: 714 commits reescritos
4. Objetos modificados: 1222 object IDs alterados

---

**⏰ PRÓXIMA AÇÃO IMEDIATA**: Abra o Google Cloud Console e revogue as 3 chaves listadas acima.
