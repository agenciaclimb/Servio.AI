# Backend Service - SERVIO.AI (Firestore API)

[![CI](https://github.com/agenciaclimb/Servio.AI/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agenciaclimb/Servio.AI/actions/workflows/ci.yml)

Este diretório contém o serviço de backend principal da plataforma SERVIO.AI, responsável por toda a lógica de negócios, interações com o banco de dados Firestore e integrações com serviços externos como Stripe e Google Cloud Storage.

## 🚀 Arquitetura

- **Framework:** Express.js
- **Banco de Dados:** Google Firestore (via `firebase-admin`)
- **Pagamentos:** Stripe (para criação de sessões de checkout e webhooks)
- **Armazenamento de Arquivos:** Google Cloud Storage (para gerar URLs de upload assinadas)
- **Linguagem:** JavaScript (Node.js)
- **Ambiente de Testes:** Vitest + Supertest

O servidor é projetado com **Injeção de Dependência (DI)**. A função `createApp` em `src/index.js` permite injetar instâncias de `db`, `storage` e `stripe`, facilitando a criação de mocks para os testes e desacoplando a lógica das implementações concretas.

## ⚙️ Setup do Ambiente Local

1.  **Instale as dependências:**

    ```bash
    npm install
    ```

2.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` neste diretório (`backend/.env`) ou configure as variáveis globais. As chaves necessárias são:
    - `STRIPE_SECRET_KEY`: Sua chave secreta do Stripe (ex: `sk_test_...`).
    - `GCP_STORAGE_BUCKET`: O nome do seu bucket no Google Cloud Storage (ex: `meu-projeto.appspot.com`).
    - `FRONTEND_URL`: A URL do seu frontend (ex: `http://localhost:5173`) para os redirecionamentos do Stripe.
    - `GOOGLE_APPLICATION_CREDENTIALS`: O caminho para o arquivo JSON da sua Service Account do GCP (necessário para rodar localmente e autenticar com o Firestore/Storage).

3.  **Inicie o servidor:**
    ```bash
    npm start
    ```
    O servidor estará rodando em `http://localhost:8081` (ou na porta definida pela variável `PORT`).

## ✅ Testes

Os testes são escritos com Vitest e Supertest para simular requisições HTTP e validar as respostas da API. O banco de dados é mockado para garantir que os testes sejam rápidos e não dependam de uma conexão real com o Firestore.

Para rodar todos os testes do backend, execute:

```bash
npm test
```

## 🌐 Endpoints Principais

O serviço expõe uma API RESTful para gerenciar as principais entidades da plataforma:

- `GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`
- `GET /jobs`, `POST /jobs`, `PUT /jobs/:id`
- `POST /create-checkout-session`
- `POST /jobs/:jobId/release-payment`
- `POST /generate-upload-url`
- E muitos outros. Consulte `src/index.js` para a lista completa.

## 🚢 Deploy (Cloud Run)

Há um workflow dedicado para deploy em Cloud Run: `Deploy to Cloud Run`.

Como medida de segurança e estabilidade, o deploy foi configurado para executar apenas manualmente ("Run workflow") ou quando você publica uma tag `v*` no repositório. Isso evita falhas automáticas em pushes enquanto a configuração do GCP é estabilizada.

Pré‑requisitos no GCP (uma vez por projeto):

- APIs habilitadas: `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`, `iamcredentials.googleapis.com`.
- Uma Service Account de deploy com os papéis:
  - Cloud Run Admin
  - Service Account User
  - Artifact Registry Writer
  - Cloud Build Editor
- Um repositório do Artifact Registry (por exemplo, `us-docker.pkg.dev/<PROJECT_ID>/servio-ai`).
- O agente do Cloud Run (serverless-robot) e do Cloud Build devem existir automaticamente ao habilitar as APIs; se houver erros de “service account does not exist”, reabra o console do GCP e confirme a habilitação das APIs. Em casos raros, crie as identidades de serviço com:
  - `gcloud beta services identity create --service=run.googleapis.com`
  - `gcloud beta services identity create --service=cloudbuild.googleapis.com`

Segredos exigidos no GitHub (Settings → Secrets and variables → Actions):

- `GCP_PROJECT_ID` – ID do projeto.
- `GCP_REGION` – Região (ex.: `us-central1`).
- `GCP_SERVICE` – Nome do serviço Cloud Run.
- `GCP_SA_KEY` – JSON da Service Account (temporário; recomendável migrar para Workload Identity Federation).

Variáveis de ambiente exigidas no Cloud Run:

Configure estas variáveis no serviço Cloud Run (Console GCP → Cloud Run → seu-serviço → Edit & Deploy New Revision → Variables & Secrets):

- `API_KEY` – Chave da API do Google Gemini (Vertex AI ou AI Studio)
- `STRIPE_SECRET_KEY` – Chave secreta do Stripe (ex.: `sk_live_...` ou `sk_test_...`)
- `GCP_STORAGE_BUCKET` – Nome do bucket do Cloud Storage (ex.: `seu-projeto.appspot.com`)
- `FRONTEND_URL` – URL do frontend hospedado (ex.: `https://servio-ai.web.app`)
- `PORT` – Porta do servidor (geralmente `8080`; definida automaticamente pelo Cloud Run)

Como executar o deploy:

1. Na aba Actions do GitHub, escolha "Deploy to Cloud Run" e clique em "Run workflow".
2. A execução usa `gcloud run deploy --source .` (constrói a imagem via Cloud Build e faz o deploy).
3. **Após o primeiro deploy**, configure as variáveis de ambiente no Console do GCP.

Notas de estabilidade:

- Adicionamos um controle de concorrência no workflow para evitar erros de "concurrent policy changes" no IAM/Cloud Build.
- Se ainda ocorrerem erros relacionados a criação de contas de serviço, aguarde alguns minutos e reexecute: é comum em primeiras ativações de APIs.
- **Erro "A comunicação com o servidor falhou"**: Verifique se as variáveis de ambiente (especialmente `API_KEY`) estão configuradas no Cloud Run.
- Próximo passo recomendado: migrar a autenticação para Workload Identity Federation (sem chave estática).
