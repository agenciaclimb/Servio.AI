# 🚀 SERVIO.AI - Plataforma de Serviços

[![CI](https://github.com/agenciaclimb/Servio.AI/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/agenciaclimb/Servio.AI/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=agenciaclimb_Servio.AI&metric=alert_status)](https://sonarcloud.io/project/overview?id=agenciaclimb_Servio.AI)
[![Tests](https://img.shields.io/badge/tests-261%2F261-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-48.36%25-brightgreen)]()

## ✅ Status: PRONTO PARA PRODUÇÃO

**Última validação**: 13/11/2025

```
✅ 261/261 testes unitários passando
✅ 10/10 smoke tests E2E passando
✅ 48.36% cobertura de código
✅ 0 vulnerabilidades
✅ 0 bugs críticos
✅ 954ms carregamento
✅ 0.69MB bundle
```

📖 **Ver**:

- [SISTEMA_PRONTO_PRODUCAO.md](./SISTEMA_PRONTO_PRODUCAO.md) - Relatório completo
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Procedimentos de deploy
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) - Métricas detalhadas
- [SMOKE_TESTS_REPORT.md](./SMOKE_TESTS_REPORT.md) - Resultados dos testes

---

## 📋 Sobre o Projeto

A **SERVIO.AI** é uma plataforma completa que conecta clientes a prestadores de serviços qualificados. Este repositório contém o serviço de backend e frontend, responsável por toda a lógica de negócios, interações com o banco de dados Firestore e integrações com serviços externos como Stripe e Google Cloud Storage.

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
