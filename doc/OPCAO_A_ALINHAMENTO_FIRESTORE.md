# Opção A — Alinhar Firestore ao projeto do Backend (gen-lang-client-0737507616)

Decisão: o backend está implantado no projeto GCP `gen-lang-client-0737507616` (Cloud Run us-west1). Para encerrar os erros 500 em `/users` e `/jobs`, o Firestore e o frontend devem apontar para o mesmo projeto.

Resumo do que você fará:

- Ativar/criar o Firestore no projeto `gen-lang-client-0737507616` (se ainda não existir)
- Aplicar as regras de segurança a partir do arquivo `firestore.rules`
- Atualizar o `.env.local` do frontend com as chaves do app Web deste projeto
- Validar com scripts de diagnóstico
- (Opcional) Executar seed mínimo do Firestore

---

## 1) Criar/Ativar Firestore no projeto correto

1. Abra: https://console.firebase.google.com/project/gen-lang-client-0737507616
2. No menu Firestore Database, clique em Criar banco de dados (se ainda não existir)
3. Escolha o local/região. Sugestão: `us-west1` para ficar próximo ao Cloud Run atual.
   - Observação: a região do Firestore não pode ser alterada depois.
4. Concluir a criação.

Se o Firestore já existir em outra região, prossiga mesmo assim para eliminar o erro 500 — o essencial é o projeto ser o mesmo do backend.

## 2) Aplicar Security Rules do repositório

1. Abra: https://console.firebase.google.com/project/gen-lang-client-0737507616/firestore/rules
2. Abra o arquivo `firestore.rules` deste repositório e copie seu conteúdo integral
3. Cole no editor de regras do console e publique

Arquivo no repo: `firestore.rules`

## 3) Atualizar as chaves do frontend (.env.local)

1. Vá para: https://console.firebase.google.com/project/gen-lang-client-0737507616/settings/general
2. Em “Seus apps”, selecione o app Web (</>) ou crie um se não existir
3. Copie os valores de:
   - apiKey → VITE_FIREBASE_API_KEY
   - authDomain → VITE_FIREBASE_AUTH_DOMAIN
   - projectId → VITE_FIREBASE_PROJECT_ID (deve ser gen-lang-client-0737507616)
   - storageBucket → VITE_FIREBASE_STORAGE_BUCKET
   - messagingSenderId → VITE_FIREBASE_MESSAGING_SENDER_ID
   - appId → VITE_FIREBASE_APP_ID
   - measurementId → VITE_FIREBASE_MEASUREMENT_ID (se houver)
4. Cole em um arquivo `.env.local` na raiz do projeto (baseado em `.env.example`)

Dica: execute

- npm run check:firebase

Ele mostra se falta alguma variável e alerta caso o Project ID não seja o esperado.

## 4) Validar o backend após o alinhamento

Execute:

- npm run diagnose:backend

Resultados esperados após o ajuste:

- GET / → 200 OK
- GET /users → 200 (lista vazia [] ou documentos, mas sem 500)
- GET /jobs → 200 (lista vazia [] ou documentos, mas sem 500)
- POST /generate-upload-url → 200 OK

Se ainda aparecer 500 em /users e /jobs:

- Verifique logs do Cloud Run: https://console.cloud.google.com/run/detail/us-west1/servio-backend/logs?project=gen-lang-client-0737507616
- Confirme que a Service Account do serviço Cloud Run possui a role `roles/datastore.user` (Firestore)

## 5) (Opcional) Seed inicial do Firestore

Se quiser criar documentos mínimos automaticamente:

Pré-requisito (local):

- Instale o gcloud e execute: `gcloud auth application-default login`

Então rode:

- node scripts/firestore_seed.mjs

O script garante `_meta/schema` e coleções básicas como `users` e `jobs`.

---

## Guardrails adicionados

- Script `npm run check:firebase` alerta quando `VITE_FIREBASE_PROJECT_ID` diverge de `gen-lang-client-0737507616`
- `.env.example` já vem com `VITE_FIREBASE_PROJECT_ID=gen-lang-client-0737507616`

## Fonte da verdade

- Projeto de registro (Option A): `gen-lang-client-0737507616`
- Backend Cloud Run: us-west1 (servio-backend)
- Firestore: no mesmo projeto acima
