# Backend Service - SERVIO.AI (Firestore API)

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

## 🗂️ Estrutura de Pastas

```
backend/
├── src/
│   └── index.js          # Aplicação Express principal
├── tests/
│   ├── smoke.test.ts     # Teste básico de sanidade
│   ├── index.test.js     # Testes dos endpoints principais
│   └── jobs.test.js      # Testes dos endpoints de jobs
├── package.json
└── README.md
```

## 🌐 Endpoints Principais

O serviço expõe uma API RESTful para gerenciar as principais entidades da plataforma:

### Usuários

- `GET /users` - Lista todos os usuários
- `GET /users/:id` - Busca usuário por ID
- `POST /users` - Cria novo usuário
- `PUT /users/:id` - Atualiza usuário

### Jobs

- `GET /jobs` - Lista todos os jobs (filtros: `providerId`, `status`)
- `POST /jobs` - Cria novo job
- `PUT /jobs/:id` - Atualiza job
- `POST /jobs/:jobId/set-on-the-way` - Marca job como "a caminho"

### Pagamentos (Stripe)

- `POST /create-checkout-session` - Cria sessão de checkout
- `POST /jobs/:jobId/release-payment` - Libera pagamento do escrow

### Armazenamento

- `GET /generate-upload-url` - Gera URL assinada para upload no GCS

### Disputas

- `POST /disputes/:disputeId/resolve` - Resolve uma disputa

Consulte `src/index.js` para a lista completa de endpoints.

## 🔒 Segurança

- Todos os endpoints sensíveis requerem autenticação via Firebase ID token
- Pagamentos processados através de Stripe Checkout com modo seguro
- URLs de upload assinadas com expiração de 15 minutos
- Validação de dados em todos os endpoints

## 🧪 Desenvolvimento

Para adicionar novos testes, crie arquivos `.test.js` em `tests/` seguindo o padrão de injeção de dependência:

```javascript
import { createApp } from '../src/index.js';

const mockDb = {
  /* mock do Firestore */
};
const app = createApp({ db: mockDb });
```

Isso permite testar endpoints sem depender de serviços externos.
