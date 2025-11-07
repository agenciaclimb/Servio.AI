# 🗑️ Exclusão Segura do Projeto Firebase Antigo

## ⚠️ ATENÇÃO: Leia tudo antes de executar!

Este guia orienta a exclusão do projeto Firebase antigo (`gen-lang-client-0737507616`) agora que a migração para `servioai` está completa.

---

## ✅ PRÉ-REQUISITOS (Confirme antes de prosseguir)

- [x] Frontend usando projeto `servioai` (validado em `.env.local`)
- [x] Backend deployado no projeto `servioai` (validado no Cloud Run)
- [x] GitHub Secrets atualizados para `servioai`
- [x] Deploy bem-sucedido via GitHub Actions
- [x] Aplicação funcionando corretamente com o novo projeto

**⚠️ NÃO DELETE O PROJETO ANTIGO ATÉ VALIDAR QUE TUDO ESTÁ FUNCIONANDO NO NOVO!**

---

## 📊 O QUE SERÁ DELETADO

### Projeto: `gen-lang-client-0737507616`

- **Firebase Auth**: Usuários cadastrados no projeto antigo (se houver)
- **Firestore**: Todos os documentos e coleções (se houver)
- **Cloud Storage**: Arquivos e fotos uploadados (se houver)
- **Cloud Run**: Serviços `servio-ai` e `servio-backend` antigos
- **Artifact Registry**: Imagens Docker antigas
- **Service Account**: `servio-ci-cd@gen-lang-client-0737507616.iam.gserviceaccount.com`

---

## 🔍 PASSO 1: Backup de Dados (Se necessário)

### 1.1 Verificar se há dados no Firestore antigo

```powershell
# Configurar gcloud para o projeto antigo
gcloud config set project gen-lang-client-0737507616

# Listar coleções do Firestore
gcloud firestore databases list --project=gen-lang-client-0737507616
```

### 1.2 Exportar Firestore (se houver dados importantes)

```powershell
# Criar bucket temporário para backup
gsutil mb -p gen-lang-client-0737507616 -l us-west1 gs://backup-servio-old-$(date +%Y%m%d)

# Exportar Firestore
gcloud firestore export gs://backup-servio-old-$(date +%Y%m%d)/firestore-export \
  --project=gen-lang-client-0737507616
```

### 1.3 Verificar usuários Firebase Auth

Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/users

Se houver usuários cadastrados e você quiser mantê-los, anote ou exporte antes de deletar.

---

## 🗑️ PASSO 2: Exclusão do Projeto

### Opção A: Via Console do Firebase (Recomendado)

1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/settings/general

2. Role até o final da página

3. Clique em "**Excluir projeto**" (Delete project)

4. Digite o ID do projeto: `gen-lang-client-0737507616`

5. Confirme a exclusão

### Opção B: Via gcloud CLI

```powershell
# Desabilitar APIs primeiro (opcional, mas recomendado)
gcloud services disable run.googleapis.com --project=gen-lang-client-0737507616 --force
gcloud services disable cloudbuild.googleapis.com --project=gen-lang-client-0737507616 --force
gcloud services disable artifactregistry.googleapis.com --project=gen-lang-client-0737507616 --force

# Deletar o projeto (IRREVERSÍVEL!)
gcloud projects delete gen-lang-client-0737507616
```

Você receberá um aviso:

```
Your project will be deleted.

Do you want to continue (Y/n)?
```

Digite `Y` apenas se tiver certeza.

---

## 🔄 PASSO 3: Limpar Referências Locais

### 3.1 Remover configuração gcloud local

```powershell
# Definir projeto padrão como servioai
gcloud config set project servioai

# Verificar configuração atual
gcloud config list
```

### 3.2 Limpar arquivos locais (se houver)

```powershell
# Procurar por referências ao projeto antigo
Get-ChildItem -Recurse -File | Select-String -Pattern "gen-lang-client-0737507616" | Select-Object Path, LineNumber
```

Se encontrar arquivos, atualize-os para usar `servioai`.

---

## ✅ VALIDAÇÃO PÓS-EXCLUSÃO

Após deletar o projeto antigo, valide que tudo continua funcionando:

1. **Frontend**: Acesse http://localhost:3000 e teste login
2. **Backend**: Verifique se as APIs respondem
3. **Cloud Run**: Confirme que os serviços estão rodando no projeto novo
   ```powershell
   gcloud run services list --project=servioai --region=us-west1
   ```
4. **Firestore**: Valide que dados são salvos/lidos corretamente
5. **GitHub Actions**: Próximo deploy deve usar o projeto `servioai`

---

## 🚨 TROUBLESHOOTING

### "Project not found" ou "Permission denied"

✅ **Isso é esperado!** Significa que o projeto foi deletado com sucesso e você não tem mais acesso a ele.

### Backend retornando 500 errors

❌ **Problema:** Backend ainda configurado para o projeto antigo

✅ **Solução:**

1. Verifique variáveis de ambiente no Cloud Run:
   ```powershell
   gcloud run services describe servio-backend --region=us-west1 --project=servioai --format="value(spec.template.spec.containers[0].env)"
   ```
2. Se necessário, atualize com `gcloud run services update`

### Login com Google falhando

❌ **Problema:** Domínios autorizados não configurados no projeto novo

✅ **Solução:**

- Firebase Console → Authentication → Settings → Authorized domains
- Adicione: `localhost`, `127.0.0.1`, `servio.ai` (ou seu domínio)

---

## 📝 CHECKLIST FINAL

Antes de deletar o projeto antigo, confirme:

- [ ] Aplicação rodando 100% no projeto `servioai`
- [ ] Login funcionando (Google + Email/Senha)
- [ ] Backend respondendo corretamente
- [ ] Upload de arquivos funcionando
- [ ] Firestore salvando/lendo dados
- [ ] Deploy automático via GitHub Actions testado
- [ ] Backup de dados importantes realizado (se aplicável)
- [ ] Nenhuma referência ao projeto antigo no código

**Só delete o projeto antigo depois que todos os itens acima estiverem ✅**

---

## 🎯 TIMELINE RECOMENDADA

| Ação                          | Quando                          |
| ----------------------------- | ------------------------------- |
| Validar app no projeto novo   | **HOJE** (antes de deletar)     |
| Monitorar erros por 2-3 dias  | Próximos dias                   |
| Fazer backup Firestore antigo | Se houver dados importantes     |
| Deletar projeto antigo        | **Após 7 dias de estabilidade** |

**Recomendação:** Mantenha o projeto antigo por mais 7 dias. Se tudo rodar perfeitamente, delete com segurança.

---

## 📞 SUPORTE

Se algo der errado após a exclusão:

1. Verifique logs do Cloud Run:

   ```powershell
   gcloud run services logs read servio-backend --project=servioai --region=us-west1 --limit=50
   ```

2. Verifique GitHub Actions logs: https://github.com/agenciaclimb/Servio.AI/actions

3. Consulte este documento de migração: `MIGRACAO_PROJETO_FIREBASE.md`

---

## ✅ CONCLUSÃO

A exclusão do projeto antigo é **opcional** e pode ser feita quando você estiver 100% confiante que tudo está funcionando no projeto novo `servioai`.

**Não há pressa!** Manter o projeto antigo ativo não gera custos significativos se não houver tráfego.
