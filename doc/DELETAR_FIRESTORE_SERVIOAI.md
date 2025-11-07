# 🗑️ Como deletar o Firestore do projeto servioai (evitar cobrança)

**Motivo:** O projeto `servioai` (540889654851) NÃO está mais em uso. A decisão final (Opção A) consolidou tudo no projeto `gen-lang-client-0737507616`.

---

## Opção 1: Deletar apenas o Firestore Database (recomendado)

Isso mantém o projeto Firebase ativo mas remove o banco de dados que gera cobrança.

### Passos:

1. Abra o console do Firestore:

   ```
   https://console.firebase.google.com/project/servioai/firestore
   ```

2. Clique no ícone de **engrenagem (⚙️)** ao lado de "Firestore Database"

3. Selecione **"Configurações do banco de dados"**

4. Role até o final da página

5. Clique em **"Excluir banco de dados"**

6. Confirme digitando o ID do projeto: `servioai`

7. Clique em **"Excluir"**

**Resultado:** O Firestore será deletado. Outras configurações do projeto (Auth, Storage, etc.) continuam ativas mas sem custo se não estiverem em uso.

---

## Opção 2: Deletar o projeto Firebase inteiro

Se você não precisa mais do projeto `servioai` para nada:

### Passos:

1. Abra as configurações do projeto:

   ```
   https://console.firebase.google.com/project/servioai/settings/general
   ```

2. Role até a seção **"Encerrar este projeto"** (no final da página)

3. Clique em **"Encerrar"**

4. Digite o ID do projeto quando solicitado: `servioai`

5. Confirme a exclusão

**Resultado:** O projeto inteiro será agendado para exclusão em 30 dias. Durante esse período você pode reverter a decisão.

---

## Verificar se há cobranças ativas

Antes de deletar, confirme se há algum recurso gerando custo:

1. Abra o Cloud Console (GCP):

   ```
   https://console.cloud.google.com/home/dashboard?project=servioai
   ```

2. No menu lateral, vá em **"Faturamento" → "Relatórios"**

3. Filtre por projeto: `servioai`

4. Verifique se há cobranças recentes de:
   - Firestore (leituras/gravações/armazenamento)
   - Cloud Storage
   - Cloud Functions

Se houver cobranças, delete os recursos correspondentes antes de encerrar o projeto.

---

## Projeto ativo (não deletar)

**✅ MANTER:** `gen-lang-client-0737507616` (1000250760228)

- Backend Cloud Run ativo
- Firestore em us-central1
- Frontend configurado

Este é o projeto de registro definitivo (Opção A).
