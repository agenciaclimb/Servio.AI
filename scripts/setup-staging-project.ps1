# ====================================================================
# Script de Configuração Automatizada do Projeto Staging
# Servio.AI - Setup Staging Project
# ====================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1"
)

Write-Host "`n🚀 Configurando projeto staging: $ProjectId" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Passo 1: Atualizar .firebaserc
Write-Host "📝 [1/6] Atualizando .firebaserc..." -ForegroundColor Yellow

$firebaserc = @"
{
  "projects": {
    "default": "gen-lang-client-0737507616",
    "production": "gen-lang-client-0737507616",
    "staging": "$ProjectId"
  }
}
"@

$firebaserc | Out-File -FilePath ".firebaserc" -Encoding UTF8
Write-Host "   ✅ .firebaserc atualizado com projeto staging`n" -ForegroundColor Green

# Passo 2: Criar .env.staging
Write-Host "📝 [2/6] Criando .env.staging..." -ForegroundColor Yellow

$envStaging = @"
# ===================================================================
# Ambiente STAGING - Servio.AI
# Criado em: $(Get-Date -Format "dd/MM/yyyy HH:mm")
# Projeto Firebase: $ProjectId
# ===================================================================

# --- Chaves do Firebase (Frontend) ---
# ⚠️ PREENCHER com as credenciais do projeto staging
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN="${ProjectId}.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="$ProjectId"
VITE_FIREBASE_STORAGE_BUCKET="${ProjectId}.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_MEASUREMENT_ID=""

# --- Chaves do Stripe (TEST MODE) ---
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_"
STRIPE_SECRET_KEY="sk_test_"
STRIPE_WEBHOOK_SECRET="whsec_"

# --- Chave da Google AI (Gemini) ---
GEMINI_API_KEY=""

# --- Backend API URL ---
VITE_BACKEND_API_URL="https://${Region}-${ProjectId}.cloudfunctions.net"

# --- Google Cloud ---
GCP_STORAGE_BUCKET="${ProjectId}.appspot.com"
GOOGLE_APPLICATION_CREDENTIALS="./service-account-staging.json"

# --- Gmail (Opcional para staging) ---
GMAIL_USER=""
GMAIL_PASS=""

# --- WhatsApp (Opcional para staging) ---
WHATSAPP_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""

# --- Twilio (Desabilitado por padrão) ---
TWILIO_ENABLED=false
"@

$envStaging | Out-File -FilePath ".env.staging" -Encoding UTF8
Write-Host "   ✅ .env.staging criado (PREENCHER as chaves!)`n" -ForegroundColor Green

# Passo 3: Usar projeto staging
Write-Host "📝 [3/6] Selecionando projeto staging..." -ForegroundColor Yellow
npx firebase-tools use staging
Write-Host ""

# Passo 4: Verificar serviços disponíveis
Write-Host "📝 [4/6] Verificando projeto..." -ForegroundColor Yellow
npx firebase-tools projects:list | Select-String $ProjectId
Write-Host ""

# Passo 5: Criar checklist de configuração
Write-Host "📝 [5/6] Gerando checklist de próximos passos..." -ForegroundColor Yellow

$checklist = @"
# 📋 Checklist de Configuração - Projeto Staging
**Projeto:** $ProjectId  
**Data:** $(Get-Date -Format "dd/MM/yyyy HH:mm")

## ✅ Concluído Automaticamente
- [x] .firebaserc atualizado com alias staging
- [x] .env.staging criado
- [x] Projeto selecionado no Firebase CLI

## 🔧 Configuração Manual Necessária

### 1. Firebase Console - Serviços
Acesse: https://console.firebase.google.com/project/$ProjectId

- [ ] **Authentication**
  - Habilitar Email/Password
  - Habilitar Google Sign-in
  - Adicionar domínios autorizados

- [ ] **Firestore Database**
  - Criar banco em modo produção
  - Região: $Region (mesma do prod)
  - Copiar rules de: firestore.rules

- [ ] **Storage**
  - Habilitar Cloud Storage
  - Copiar rules de: storage.rules

- [ ] **Hosting**
  - Deploy inicial: ``npm run deploy:staging:hosting``

### 2. Configurar Credenciais (.env.staging)

- [ ] Obter Firebase config:
  ```
  Project Settings > General > Your apps > Web app
  ```
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
  - VITE_FIREBASE_MEASUREMENT_ID (opcional)

- [ ] Stripe TEST keys:
  ```
  https://dashboard.stripe.com/test/apikeys
  ```
  - VITE_STRIPE_PUBLISHABLE_KEY (pk_test_...)
  - STRIPE_SECRET_KEY (sk_test_...)

- [ ] Gemini API:
  ```
  https://aistudio.google.com/app/apikey
  ```
  - GEMINI_API_KEY

### 3. Service Account (Cloud Functions)

- [ ] Baixar service account key:
  ```
  IAM & Admin > Service Accounts > Create Key (JSON)
  ```
  - Salvar como: ``C:\secrets\service-account-staging.json``
  - Atualizar GOOGLE_APPLICATION_CREDENTIALS no .env.staging

### 4. Firestore Rules

- [ ] Deploy rules:
  ```powershell
  npx firebase-tools use staging
  npx firebase-tools deploy --only firestore:rules,storage:rules
  ```

### 5. Primeiro Deploy

- [ ] Build do projeto:
  ```powershell
  npm run build
  ```

- [ ] Deploy completo:
  ```powershell
  npm run deploy:staging
  ```

- [ ] Testar URL de staging:
  ```
  https://${ProjectId}.web.app
  ```

### 6. Testes Críticos

- [ ] Login funcional
- [ ] Criar job de teste
- [ ] Upload de arquivo (Storage)
- [ ] Integração Stripe (modo test)
- [ ] Cloud Functions respondendo

## 📞 URLs Úteis

- **Console:** https://console.firebase.google.com/project/$ProjectId
- **Hosting:** https://${ProjectId}.web.app
- **Functions:** https://${Region}-${ProjectId}.cloudfunctions.net
- **Firestore:** https://console.firebase.google.com/project/$ProjectId/firestore

## 🆘 Troubleshooting

**Erro de permissões:**
``````powershell
npx firebase-tools login --reauth
``````

**Ver logs:**
``````powershell
npm run gcp:logs
``````

**Reset configuração:**
``````powershell
npx firebase-tools use production  # volta para prod
``````
"@

$checklist | Out-File -FilePath "STAGING_CHECKLIST_${ProjectId}.md" -Encoding UTF8
Write-Host "   ✅ Checklist criado: STAGING_CHECKLIST_${ProjectId}.md`n" -ForegroundColor Green

# Passo 6: Resumo final
Write-Host "📝 [6/6] Configuração inicial concluída!" -ForegroundColor Yellow
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n✅ SETUP AUTOMÁTICO CONCLUÍDO!`n" -ForegroundColor Green

Write-Host "📋 Arquivos criados/atualizados:" -ForegroundColor Cyan
Write-Host "   • .firebaserc" -ForegroundColor White
Write-Host "   • .env.staging" -ForegroundColor White
Write-Host "   • STAGING_CHECKLIST_${ProjectId}.md" -ForegroundColor White

Write-Host "`n🎯 PRÓXIMOS PASSOS:`n" -ForegroundColor Cyan

Write-Host "1. Abra o Firebase Console:" -ForegroundColor Yellow
Write-Host "   https://console.firebase.google.com/project/$ProjectId" -ForegroundColor White

Write-Host "`n2. Habilite os serviços (Authentication, Firestore, Storage)" -ForegroundColor Yellow

Write-Host "`n3. Preencha as credenciais no .env.staging" -ForegroundColor Yellow

Write-Host "`n4. Faça o primeiro deploy:" -ForegroundColor Yellow
Write-Host "   npm run deploy:staging" -ForegroundColor White

Write-Host "`n📖 Siga o checklist completo em:" -ForegroundColor Cyan
Write-Host "   STAGING_CHECKLIST_${ProjectId}.md`n" -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
