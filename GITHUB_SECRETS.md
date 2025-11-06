# Configuração de Secrets para Deploy no GitHub Actions

## Secrets Necessários no GitHub

Configure os seguintes secrets em **Settings → Secrets and variables → Actions** do repositório:

### Secrets do GCP (Infraestrutura)

1. **GCP_PROJECT_ID**
   - Descrição: ID do projeto no Google Cloud
   - Exemplo: `gen-lang-client-0737507616`
   - Onde encontrar: Console GCP → Dashboard → Project Info

2. **GCP_REGION**
   - Descrição: Região do Cloud Run
   - Exemplo: `us-west1`
   - Recomendado: `us-west1`, `us-central1`, ou `southamerica-east1` (São Paulo)

3. **GCP_SERVICE**
   - Descrição: Nome do serviço no Cloud Run
   - Exemplo: `servio-ai`
   - Onde encontrar: Cloud Run → [nome do serviço]

4. **GCP_SA_KEY**
   - Descrição: JSON completo da Service Account com permissões
   - Permissões necessárias (mínimo para Artifact Registry):
     - `Cloud Run Admin`
     - `Cloud Build Editor`
     - `Artifact Registry Writer`
     - `Service Account User`
     - `Logs Writer (Cloud Logging)`
   - Observação: se for usar Container Registry (gcr.io), em vez de Artifact Registry,
     substitua `Artifact Registry Writer` por `Storage Admin`.
   - Como gerar:
     1. Console GCP → IAM & Admin → Service Accounts
     2. Criar nova SA ou usar existente
     3. "Keys" → "Add Key" → "Create new key" → JSON
     4. Copiar TODO o conteúdo do arquivo JSON

### Secrets da Aplicação (Runtime)

5. **GEMINI_API_KEY**
   - Descrição: Chave da API do Google Gemini (já rotacionada)
   - Onde encontrar: Google AI Studio → API Keys
   - Formato: `AIzaSy...` (43 caracteres)

6. **FRONTEND_URL**
   - Descrição: URL do frontend hospedado
   - Exemplo: `https://servio-ai.web.app` ou `https://seu-dominio.com`
   - Usado para configuração de CORS

7. **GCP_STORAGE_BUCKET**
   - Descrição: Nome do bucket do Cloud Storage
   - Exemplo: `servio-ai-uploads`
   - Onde encontrar: Cloud Storage → Buckets

8. **STRIPE_SECRET_KEY**
   - Descrição: Chave secreta do Stripe para pagamentos
   - Onde encontrar: Stripe Dashboard → Developers → API Keys
   - Formato: `sk_test_...` (test) ou `sk_live_...` (produção)
   - ⚠️ NUNCA exponha esta chave em logs ou código

## Como Adicionar Secrets no GitHub

```bash
# Via GitHub CLI (gh)
gh secret set GCP_PROJECT_ID --body "gen-lang-client-0737507616"
gh secret set GCP_REGION --body "us-west1"
gh secret set GCP_SERVICE --body "servio-ai"
gh secret set GCP_SA_KEY < service-account-key.json
gh secret set GEMINI_API_KEY --body "AIzaSy..."
gh secret set FRONTEND_URL --body "https://servio-ai.web.app"
gh secret set GCP_STORAGE_BUCKET --body "servio-ai-uploads"
gh secret set STRIPE_SECRET_KEY --body "sk_test_..."
```

Ou manualmente:

1. Vá para o repositório no GitHub
2. Settings → Secrets and variables → Actions
3. "New repository secret"
4. Adicione cada secret com o nome exato acima

## Validação

Após adicionar todos os secrets, você pode validar executando o workflow:

1. Actions → Validate GCP SA Key → Run workflow (preferível: valida apenas autenticação, leitura de AR e Cloud Run)
   - Saída esperada: "✅ GCP_SA_KEY válido e com acesso esperado para o projeto gen-lang-client-0737507616"
   - O job também imprime o e-mail da Service Account; verifique se termina com `@gen-lang-client-0737507616.iam.gserviceaccount.com`.
2. (Opcional) Actions → Deploy to Cloud Run → Run workflow
   - Se a validação passar, você pode rodar um deploy. O passo "Auth to Google Cloud" deve passar; um "Sanity push" no Artifact Registry confirmará permissão de escrita.

## Troubleshooting

- **Erro "secret not found"**: Verifique o nome exato do secret (case-sensitive)
- **Erro de permissão no GCP**: Revise as roles da Service Account
- **Container não inicia**: Verifique logs do Cloud Run para variáveis faltando

## Boas práticas para chaves (Service Account Keys)

- Evite acumular várias chaves ativas para a mesma SA. Mantenha apenas 1 (no máximo 2 durante rotação).
- Se existirem chaves antigas que não são mais usadas no GitHub, apague-as em: IAM & Admin → Service Accounts → [sua SA] → Keys.
- Sempre que rotacionar a chave:
  1.  Gere a nova chave JSON; atualize o secret `GCP_SA_KEY` no GitHub.
  2.  Confirme com o workflow "Validate GCP SA Key".
  3.  Delete a chave anterior.
