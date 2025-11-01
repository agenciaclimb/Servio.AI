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
