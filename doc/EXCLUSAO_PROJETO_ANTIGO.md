# 🗑️ Plano de Exclusão Segura do Projeto Antigo

**Data:** 2025-11-06  
**Responsável:** Desenvolvedor  
**Status:** ⚠️ AGUARDANDO EXECUÇÃO

---

## 📊 Situação Atual

### ✅ Projeto CORRETO (MANTER)

- **Project ID:** `gen-lang-client-0737507616`
- **Display Name:** ServioAI
- **Project Number:** 1000250760228
- **Status:** 🟢 ATIVO E FUNCIONAL
- **Recursos:**
  - Firebase Hosting: https://gen-lang-client-0737507616.web.app
  - Cloud Run: servio-backend, servio-ai
  - Firestore Database (us-central1)
  - Cloud Storage
  - Firebase Auth (3 usuários de teste)

### ❌ Projeto ANTIGO (EXCLUIR)

- **Project ID:** `servioai`
- **Display Name:** Nao-utilizar
- **Project Number:** 540889654851
- **Status:** 🔴 DUPLICADO E NÃO USADO
- **Problema:** Causando deploys acidentais e confusão

---

## ⚠️ Verificação de Segurança (ANTES DE EXCLUIR)

### 1. Confirmar que NÃO há recursos críticos no projeto antigo

Execute estes comandos para verificar:

```bash
# Selecionar projeto antigo temporariamente
firebase use servioai

# Listar apps do projeto
firebase apps:list

# Verificar se há sites de hosting ativos
firebase hosting:sites:list

# Verificar se há Cloud Run services
gcloud run services list --project=servioai --region=us-west1

# Verificar se há banco Firestore
# Console: https://console.firebase.google.com/project/servioai/firestore
```

**Resultado Esperado:** Nenhum recurso crítico encontrado.

### 2. Confirmar que projeto CORRETO está sendo usado

```bash
# Ver projeto ativo
firebase projects:list

# Deve mostrar: gen-lang-client-0737507616 (current)
```

### 3. Verificar .firebaserc

```bash
# Ver conteúdo do arquivo
Get-Content .firebaserc
```

**Deve conter:**

```json
{
  "projects": {
    "default": "gen-lang-client-0737507616"
  }
}
```

---

## 🔒 Backup Preventivo (OBRIGATÓRIO)

Antes de excluir, fazer backup das configurações:

```bash
# 1. Backup das regras de segurança (se houver no projeto antigo)
firebase use servioai
firebase firestore:get rules > backup_old_project_firestore_rules.txt
firebase storage:get rules > backup_old_project_storage_rules.txt

# 2. Voltar para projeto correto
firebase use gen-lang-client-0737507616
```

---

## 🗑️ Procedimento de Exclusão (EXECUTAR COM CUIDADO)

### Opção A: Exclusão via Firebase Console (RECOMENDADO)

**Mais seguro porque mostra todos os recursos antes de excluir.**

1. **Acessar Console do Projeto Antigo:**

   ```
   https://console.firebase.google.com/project/servioai/settings/general
   ```

2. **Rolar até o final da página:**
   - Procurar seção "Encerrar este projeto"

3. **Ler TODOS os avisos cuidadosamente:**
   - Firebase mostrará TODOS os recursos que serão excluídos
   - Verifique que NÃO há nada crítico

4. **Confirmar exclusão:**
   - Digite o ID do projeto: `servioai`
   - Confirme: "Sim, eu entendo que isso excluirá permanentemente..."
   - Clique em "Excluir projeto"

5. **Aguardar conclusão:**
   - Processo pode levar até 30 dias para conclusão total
   - Projeto fica em "pending deletion" durante este período

### Opção B: Exclusão via CLI (AVANÇADO)

**Apenas se você tiver certeza absoluta:**

```bash
# ATENÇÃO: ESTE COMANDO É IRREVERSÍVEL

# 1. Selecionar projeto antigo
firebase use servioai

# 2. Verificar uma última vez
firebase projects:list

# 3. Excluir (requer confirmação)
gcloud projects delete servioai --quiet

# 4. Voltar para projeto correto IMEDIATAMENTE
firebase use gen-lang-client-0737507616
```

---

## ✅ Validação Pós-Exclusão

Após excluir o projeto antigo, validar que tudo funciona:

### 1. Verificar projeto ativo

```bash
firebase projects:list
# Deve mostrar apenas: gen-lang-client-0737507616
```

### 2. Verificar .firebaserc

```bash
Get-Content .firebaserc
# Deve conter apenas o projeto correto
```

### 3. Fazer deploy de teste

```bash
npm run build
firebase deploy --only hosting
```

**URL Esperada:** https://gen-lang-client-0737507616.web.app

### 4. Testar aplicação

- Acessar URL de produção
- Fazer login com cliente@servio.ai
- Verificar dashboard funcional
- Criar um job de teste

---

## 🚨 Plano de Rollback (Se algo der errado)

**IMPORTANTE:** Exclusão de projeto Firebase é irreversível após 30 dias.

Durante o período de "pending deletion" (30 dias):

1. Projeto pode ser restaurado via Console
2. Acessar: https://console.firebase.google.com/project/servioai
3. Se aparecer banner "This project is scheduled for deletion"
4. Clicar em "Restore project"

**Após 30 dias:** Não há como recuperar.

---

## 📝 Checklist de Execução

Executar NESTA ORDEM:

- [ ] **PASSO 1:** Verificar que projeto correto está ativo

  ```bash
  firebase projects:list
  ```

- [ ] **PASSO 2:** Verificar .firebaserc

  ```bash
  Get-Content .firebaserc
  ```

- [ ] **PASSO 3:** Fazer backup preventivo (se houver algo)

  ```bash
  firebase use servioai
  firebase firestore:get rules > backup_old_firestore.txt
  firebase storage:get rules > backup_old_storage.txt
  firebase use gen-lang-client-0737507616
  ```

- [ ] **PASSO 4:** Excluir projeto via Console (Opção A - RECOMENDADA)
  - Acessar: https://console.firebase.google.com/project/servioai/settings/general
  - Rolar até "Encerrar este projeto"
  - Ler TODOS os avisos
  - Digitar `servioai` para confirmar
  - Confirmar exclusão

- [ ] **PASSO 5:** Validar que apenas projeto correto aparece

  ```bash
  firebase projects:list
  ```

- [ ] **PASSO 6:** Fazer deploy de teste

  ```bash
  npm run build
  firebase deploy --only hosting
  ```

- [ ] **PASSO 7:** Testar aplicação em produção
  - https://gen-lang-client-0737507616.web.app
  - Login + Dashboard + Criar job

- [ ] **PASSO 8:** Documentar conclusão
  - Atualizar DOCUMENTO_MESTRE_SERVIO_AI.md
  - Registrar data e responsável

---

## ⏰ Tempo Estimado

- Verificações: 5 minutos
- Backup: 2 minutos
- Exclusão: 2 minutos
- Validação: 5 minutos
- **Total:** ~15 minutos

---

## ✅ Benefícios da Exclusão

1. **Elimina confusão:** Apenas 1 projeto para gerenciar
2. **Evita deploys errados:** Não mais deploys acidentais no projeto antigo
3. **Reduz custos:** Projeto antigo não gera cobranças desnecessárias
4. **Melhora segurança:** Menos superfície de ataque
5. **Simplifica CI/CD:** Apenas 1 projeto nos secrets do GitHub

---

## 🎯 Resultado Esperado

**ANTES:**

```
┌──────────────────────┬──────────────────────────────────────┐
│ Project Display Name │ Project ID                           │
├──────────────────────┼──────────────────────────────────────┤
│ ServioAI             │ gen-lang-client-0737507616 (current) │
├──────────────────────┼──────────────────────────────────────┤
│ Nao-utilizar         │ servioai                             │ ❌ EXCLUIR
└──────────────────────┴──────────────────────────────────────┘
```

**DEPOIS:**

```
┌──────────────────────┬──────────────────────────────────────┐
│ Project Display Name │ Project ID                           │
├──────────────────────┼──────────────────────────────────────┤
│ ServioAI             │ gen-lang-client-0737507616 (current) │ ✅ ÚNICO
└──────────────────────┴──────────────────────────────────────┘
```

---

## 📞 Suporte

Se tiver dúvidas durante o processo:

1. **NÃO prossiga** se algo parecer errado
2. Consulte a documentação: https://firebase.google.com/docs/projects/learn-more#delete-project
3. Verifique novamente qual projeto está sendo excluído

---

**IMPORTANTE: Este documento foi criado para orientar a exclusão segura. Siga TODOS os passos e não pule verificações.**

**Responsável pela execução:** **\*\*\*\***\_**\*\*\*\***  
**Data de execução:** **\*\*\*\***\_**\*\*\*\***  
**Confirmação final:** [ ] Sim, entendo os riscos e verifiquei tudo
