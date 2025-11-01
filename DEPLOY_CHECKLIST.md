# Guia Passo a Passo: Configurar Secrets e Fazer Deploy

## ✅ O que já foi feito

- ✅ Criado `Dockerfile` para empacotar o servidor de IA
- ✅ Criado `.dockerignore` para otimizar a imagem
- ✅ Atualizado `cloudbuild.yaml` para build correto da imagem Docker
- ✅ Atualizado workflow de deploy para injetar variáveis de ambiente
- ✅ Commit e push para o repositório

## 📋 Próximos Passos (VOCÊ FAZ AGORA)

### Passo 1: Configurar Secrets no GitHub (5 minutos)

1. **Abra o repositório no GitHub**
   - URL: https://github.com/agenciaclimb/Servio.AI

2. **Vá para Settings → Secrets and variables → Actions**
   - Clique em "Settings" (canto superior direito)
   - No menu lateral esquerdo, clique em "Secrets and variables"
   - Clique em "Actions"

3. **Adicione cada secret clicando em "New repository secret"**

   **Secrets de Infraestrutura GCP:**

   | Nome             | Valor                                     | Onde Encontrar                |
   | ---------------- | ----------------------------------------- | ----------------------------- |
   | `GCP_PROJECT_ID` | `gen-lang-client-0737507616`              | Console GCP → Dashboard       |
   | `GCP_REGION`     | `us-west1`                                | Região do Cloud Run atual     |
   | `GCP_SERVICE`    | `servio-ai`                               | Nome do serviço no Cloud Run  |
   | `GCP_SA_KEY`     | Conteúdo JSON completo da Service Account | IAM → Service Accounts → Keys |

   **Secrets da Aplicação:**

   | Nome                 | Valor                                             | Onde Encontrar              |
   | -------------------- | ------------------------------------------------- | --------------------------- |
   | `GEMINI_API_KEY`     | Sua chave AIzaSy... (já rotacionada)              | Google AI Studio → API Keys |
   | `FRONTEND_URL`       | URL do frontend (ex: `https://servio-ai.web.app`) | Firebase Hosting ou domínio |
   | `GCP_STORAGE_BUCKET` | Nome do bucket (ex: `servio-ai-uploads`)          | Cloud Storage → Buckets     |
   | `STRIPE_SECRET_KEY`  | Chave secreta Stripe (sk*test*... ou sk*live*...) | Stripe Dashboard → API Keys |

4. **Verificar que todos os 8 secrets foram adicionados**
   - Deve aparecer uma lista com todos os nomes acima
   - ⚠️ Os valores ficam ocultos (normal do GitHub)

### Passo 2: Executar o Deploy via GitHub Actions (2 minutos)

1. **Vá para a aba "Actions" do repositório**
   - https://github.com/agenciaclimb/Servio.AI/actions

2. **No menu lateral esquerdo, clique em "Deploy to Cloud Run"**

3. **Clique no botão "Run workflow" (canto direito)**
   - Branch: `feature/full-implementation`
   - Clique em "Run workflow" (verde)

4. **Aguarde o build completar (3-5 minutos)**
   - Você verá o progresso em tempo real
   - Aguarde até aparecer ✅ verde

### Passo 3: Validar o Deploy (2 minutos)

1. **Abra o Cloud Run no Console GCP**
   - https://console.cloud.google.com/run
   - Clique no serviço `servio-ai`

2. **Veja a nova revisão (deve estar verde/rodando)**

3. **Clique na URL do serviço e adicione `/health` no final**
   - Exemplo: `https://servio-ai-xxxxx.run.app/health`
   - Deve retornar: `{"ok": true}`

4. **Verifique os logs (aba "Logs")**
   - Procure por:
     ```
     [Server] PORT: 8080
     [Server] API_KEY present: true
     [Server] Node version: v18.x.x
     AI Server listening on port 8080
     ```

## 🚨 Troubleshooting

### Se o workflow falhar:

1. **Erro "secret not found"**
   - Verifique se o nome do secret está EXATAMENTE como listado (case-sensitive)
   - Exemplo: `GEMINI_API_KEY` (não `gemini_api_key`)

2. **Erro de permissão no GCP**
   - Abra IAM & Admin → Service Accounts
   - Certifique-se que a SA tem as roles:
     - Cloud Run Admin
     - Cloud Build Editor
     - Artifact Registry Writer
     - Service Account User
     - Logs Writer (Cloud Logging) — obrigatório para o gatilho do Cloud Build escrever logs

3. **Erro ao fazer push no Artifact Registry: `name unknown: Repository 'servio.ai' not found`**
   - Causa: variável de substituição `_REPO` configurada como `servio.ai` (com ponto) no gatilho do Cloud Build.
   - Correção: edite o gatilho e defina `_REPO` como `servio-ai` (com hífen), na mesma região do repositório criado (`us-west1`).
   - Confirme que o repositório existe em Artifact Registry: `Artifact Registry → Repositories → servio-ai (Docker) → Region: us-west1`.

4. **Build timeout ou erro de Docker**
   - Vá em Cloud Build → Settings
   - Ative a API "Cloud Build API" se ainda não estiver
   - Verifique que "Docker" builder está disponível

5. **Container não inicia (PORT error)**
   - Verifique que NÃO há variável PORT no Cloud Run
   - O Cloud Run injeta PORT automaticamente
   - Container port deve estar 8080

### Se o /health não responder:

1. **Verifique os logs da revisão**
   - Cloud Run → servio-ai → Logs
   - Procure por erros no boot

2. **Verifique as variáveis de ambiente**
   - Cloud Run → servio-ai → Edit & Deploy New Revision
   - Variables & Secrets → deve ter API_KEY, FRONTEND_URL, etc.
   - Se faltar alguma, adicione manualmente

3. **Teste local primeiro**

   ```powershell
   $env:API_KEY="sua-chave-gemini"
   $env:PORT="8080"
   node server.cjs
   ```

   - Deve iniciar sem erros
   - Acesse http://localhost:8080/health

## 📞 Se Precisar de Ajuda

Me envie:

1. Screenshot do erro do workflow (se houver)
2. Logs do Cloud Run (últimas 20 linhas)
3. Lista de secrets configurados (apenas os nomes, não os valores!)

## ✨ Após o Deploy Funcionar

Próximos passos:

1. Reativar Firebase Admin e autenticação no `server.cjs`
2. Fazer novo deploy
3. Testar assistente IA no frontend
