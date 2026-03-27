# 🔑 Firebase Token - Adicionar ao GitHub Secrets

## Token Gerado

```
1//0h-Zg_2HXzEFYCgYIARAAGBESNwF-L9Irx1XDfkSOdSJJmfpKCrLB_mu7B6Z1YHGcx-I3To5NzPMD
aRxYpyZeRn1NFGcq0wpipAA
```

## ✅ Próximas Etapas

### Passo 1: Copiar o Token

Copie o token acima (inteiro, sem quebras de linha).

### Passo 2: Acessar GitHub Settings

1. Vá para: https://github.com/agenciaclimb/Servio.AI
2. Click em **Settings** (no topo da página)
3. Na esquerda, click em **Secrets and variables** → **Actions**

### Passo 3: Adicionar Secret

1. Click no botão **New repository secret** (verde)
2. **Name**: `FIREBASE_TOKEN`
3. **Secret**: Cole o token acima
4. Click em **Add secret**

### Passo 4: Confirmar

GitHub vai exibir: ✅ `FIREBASE_TOKEN` has been added

## 🚀 Resultado

Agora, toda vez que você fizer push para `main`:

1. GitHub Actions roda CI job
2. Se passar, deploy job é acionado
3. Firebase Hosting é atualizado automaticamente ✨

## 🧪 Testar

```bash
git commit --allow-empty -m "test: trigger CI/CD deployment"
git push origin main
```

Verifique: https://github.com/agenciaclimb/Servio.AI/actions

---

## ⏱️ ETA de Atualização em Produção

1. **GitHub Actions CI**: ~3 min
2. **Deploy job**: ~2 min
3. **Firebase Hosting**: ~1 min
4. **Total**: ~6-10 minutos

Após isso, produção terá:

- ✅ "Meus Serviços" sem duplicação
- ✅ "+ Novo Serviço" botão só 1x
- ✅ Build com hash novo: `bnZuF0CB`

---

**Status**: ⏳ Aguardando token ser adicionado ao GitHub Secrets
