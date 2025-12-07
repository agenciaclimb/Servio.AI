# 🔧 Configuração do Domínio Customizado no Firebase Hosting

## Status Atual

✅ DNS configurado no Cloud DNS (api.servio-ai.com e ai.servio-ai.com apontam para Cloud Run)
✅ Backend respondendo em api.servio-ai.com (200 OK)
✅ Build deployado com URLs corretas
❌ **PROBLEMA:** Firebase Hosting ainda não reconhece servio-ai.com

## Solução: Adicionar Domínio Customizado ao Firebase Hosting

### Passo 1: Acessar Console do Firebase

1. Abra: https://console.firebase.google.com/project/gen-lang-client-0737507616/hosting/main
2. Clique na aba **"Hosting"** no menu lateral

### Passo 2: Adicionar Domínio Customizado

1. Na página de Hosting, clique em **"Add custom domain"** ou **"Adicionar domínio personalizado"**
2. Digite: `servio-ai.com`
3. Clique em **"Continue"** ou **"Continuar"**

### Passo 3: Verificar Propriedade do Domínio

O Firebase irá solicitar verificação. Como você já tem o domínio no Cloud DNS, escolha:

**Opção A: Verificação via TXT Record**

- Firebase mostrará um registro TXT como: `firebase=xxxxxxxxxxxxx`
- Adicione este registro TXT na sua zona DNS `servio-ai-com` no Cloud DNS
- Nome: `@` ou `servio-ai.com`
- Tipo: TXT
- Valor: o código fornecido pelo Firebase
- Aguarde 5-10 minutos para propagação

**Opção B: Verificação via Search Console** (mais rápido se já verificado)

- Se já verificou o domínio no Google Search Console, apenas confirme

### Passo 4: Configurar Registros DNS

Após verificação, Firebase mostrará os registros necessários:

```
Tipo: A
Nome: @ (apex)
Valor: 151.101.1.195, 151.101.65.195

Tipo: A
Nome: www
Valor: 151.101.1.195, 151.101.65.195
```

**ATENÇÃO:** No Cloud DNS, você já tem outros registros. Ajuste conforme necessário:

- Se o apex (@) já aponta para Firebase Hosting, mantenha
- Mantenha os CNAMEs para api e ai subdomínios (não altere!)

### Passo 5: Adicionar www.servio-ai.com (Opcional)

Se quiser que www também funcione:

1. Repita o processo para `www.servio-ai.com`
2. Ou configure redirecionamento no Firebase Hosting

### Passo 6: Aguardar Provisionamento SSL

- Firebase irá provisionar certificado SSL automaticamente
- Pode levar 1-24 horas
- Você receberá email quando estiver pronto

## Registros DNS Finais no Cloud DNS

Após completar, sua zona `servio-ai-com` deve ter:

```
Nome                Tipo    Valor
@                   A       151.101.1.195
@                   A       151.101.65.195
www                 CNAME   gen-lang-client-0737507616.web.app.
api                 CNAME   ghs.googlehosted.com.
ai                  CNAME   ghs.googlehosted.com.
```

## Comandos de Verificação

```powershell
# Verificar apex
nslookup servio-ai.com

# Verificar www
nslookup www.servio-ai.com

# Verificar subdomínios
nslookup api.servio-ai.com
nslookup ai.servio-ai.com

# Testar HTTPS (quando SSL estiver pronto)
curl -I https://servio-ai.com
curl -I https://www.servio-ai.com
```

## Atualização nas Configurações Firebase Auth

Depois que o domínio estiver ativo, adicione aos domínios autorizados:

1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0737507616/authentication/settings
2. Na seção **"Authorized domains"**, adicione:
   - `servio-ai.com`
   - `www.servio-ai.com` (se configurou)

## Timeline Esperado

- ⏱️ Adicionar domínio: 2 minutos
- ⏱️ Verificação via TXT: 5-15 minutos
- ⏱️ Provisionamento SSL: 1-24 horas
- ⏱️ Propagação DNS completa: até 48 horas (geralmente 1-2 horas)

## Troubleshooting

### "Domain verification failed"

- Aguarde mais 5-10 minutos após adicionar o TXT record
- Verifique se o TXT está correto: `nslookup -type=TXT servio-ai.com`

### "SSL provisioning in progress"

- Aguarde pacientemente (pode levar até 24h)
- Verifique status no console Firebase Hosting

### "ERR_NAME_NOT_RESOLVED"

- DNS ainda propagando
- Use ferramenta: https://www.whatsmydns.net/ para verificar propagação global

## Referências

- Guia oficial Firebase: https://firebase.google.com/docs/hosting/custom-domain
- Cloud DNS Console: https://console.cloud.google.com/net-services/dns/zones/servio-ai-com
