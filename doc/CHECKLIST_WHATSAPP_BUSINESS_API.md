# ✅ Checklist Integração WhatsApp Business API (Fase 1 → Fase 2)

> Objetivo: habilitar envio confiável de follow-ups (convite + lembrete) aos prestadores, mantendo conformidade, rastreabilidade e baixa fricção.

---

## 1. Pré-Requisitos de Conta

| Item                                          | Status | Ação                                                             |
| --------------------------------------------- | ------ | ---------------------------------------------------------------- |
| Conta Business verificada                     | ☐      | Concluir verificação no Business Manager (documentos legais)     |
| Número dedicado (não usado em WhatsApp comum) | ☐      | Registrar número e migrar para Business API                      |
| Escolha de Provedor (Cloud API Meta vs BSP)   | ☐      | Avaliar custos: volume inicial baixo favorece Cloud API          |
| Políticas de uso e consentimento              | ☐      | Definir mecanismo opt-in / opt-out claro (palavras: PARAR, SAIR) |
| Configuração de Webhook                       | ☐      | Endpoint /api/whatsapp/webhook pronto para receber status        |

---

## 2. Variáveis de Ambiente Necessárias

| Variável                        | Descrição                                      |
| ------------------------------- | ---------------------------------------------- |
| `WHATSAPP_API_BASE_URL`         | Normalmente `https://graph.facebook.com/v19.0` |
| `WHATSAPP_PHONE_ID`             | ID do número (ex: `123456789012345`)           |
| `WHATSAPP_BUSINESS_ACCOUNT_ID`  | Opcional, para métricas avançadas              |
| `WHATSAPP_ACCESS_TOKEN`         | Token de aplicação (renovar periodicamente)    |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token de verificação do webhook                |
| `WHATSAPP_TEMPLATE_NAMESPACE`   | Namespace de templates aprovados               |
| `WHATSAPP_RATE_LIMIT_PER_MIN`   | Ex: `30` (iniciar conservador)                 |
| `WHATSAPP_MAX_RETRIES`          | Ex: `3` para tentativas em falha transitória   |
| `WHATSAPP_RETRY_BACKOFF_MS`     | Ex: `2000` (exponencial: x2)                   |

Armazenar em Secret Manager (GCP) e injetar via Cloud Run.

---

## 3. Templates (Fluxos Iniciais)

| Nome Interno                 | Objetivo                                            | Estado                          |
| ---------------------------- | --------------------------------------------------- | ------------------------------- |
| `prospector_invite_v1`       | Primeiro convite (curto, valor + CTA)               | ☐ Criar e enviar para aprovação |
| `prospector_followup_48h_v1` | Lembrete amigável 48h                               | ☐ Criar e enviar para aprovação |
| `prospector_success_case_v1` | Prova social (uso restrito, somente após interação) | ☐ Criar                         |

### Exemplo Estrutura Template (Cloud API):

```
POST /{{PHONE_ID}}/messages
{
  "messaging_product": "whatsapp",
  "to": "+55XXXXXXXXXXX",
  "type": "template",
  "template": {
    "name": "prospector_invite_v1",
    "language": { "code": "pt_BR" },
    "components": [
      { "type": "BODY", "parameters": [ { "type": "TEXT", "text": "{{nome}}" } ] }
    ]
  }
}
```

### Boas Práticas:

- Textos neutros e sem excesso de promoções
- Personalização mínima (nome do prestador)
- CTA claro: "Responder para tirar dúvidas" ou link convite
- Evitar links encurtados para primeira etapa

---

## 4. Fluxo Operacional (Cadência Automatizada)

1. Prospector cria registro → envia e-mail inicial (já implementado)
2. Registro salvo em `prospector_outreach`
3. Scheduler verifica elegibilidade 48h → chama adapter WhatsApp
4. Adapter envia template `prospector_followup_48h_v1`
5. Webhook recebe status: `SENT`, `DELIVERED`, `READ`, `FAILED`
6. Atualiza registro: `whatsappSentAt`, `deliveryStatus`
7. Em caso de `FAILED_TRANSIENT` → retry com backoff (máx 3)
8. Em caso de `FAILED_PERMANENT` → marcar `errorHistory` e não tentar novamente

---

## 5. Classificação de Erros (Adapter)

| Código HTTP | Categoria                    | Ação                                  |
| ----------- | ---------------------------- | ------------------------------------- |
| 200         | Success                      | Registrar horário e status inicial    |
| 400         | Permanent (payload inválido) | Corrigir template ou parâmetros       |
| 401/403     | Permanent (auth)             | Rotacionar token / revisar permissões |
| 404         | Permanent (phone/template)   | Verificar ID / reaprovar template     |
| 429         | Transient                    | Retry com backoff exponencial         |
| 5xx         | Transient                    | Retry até limite                      |

Regra: Apenas transient gera tentativa adicional.

---

## 6. Estrutura do Adapter (versão inicial - pseudo)

Arquivo sugerido: `backend/src/whatsappAdapter.js`

```js
async function sendTemplateMessage({ to, templateName, languageCode = 'pt_BR', components }) {
  const baseUrl = process.env.WHATSAPP_API_BASE_URL;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!baseUrl || !phoneId || !token)
    return { success: false, error: 'missing_config', transient: false };

  const url = `${baseUrl}/${phoneId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: templateName, language: { code: languageCode }, components },
  };

  // Fazer chamada HTTP (fetch/axios futura). Aqui stub.
  try {
    // const resp = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    // Simulação de sucesso:
    return { success: true, id: 'msg_simulada', raw: payload };
  } catch (err) {
    return { success: false, error: 'network_error', transient: true };
  }
}
module.exports = { sendTemplateMessage };
```

---

## 7. Webhook de Status

Endpoint: `POST /api/whatsapp/webhook`

Verificação Inicial (GET):

```
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=XXXX&hub.verify_token=TOKEN_CONFIGURADO
```

Payload Exemplo (Simplificado):

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "statuses": [
              { "id": "wamid.HBgM...", "status": "delivered", "timestamp": "1732130000" }
            ]
          }
        }
      ]
    }
  ]
}
```

Processar cada `status` e atualizar registro por `message_id`.

---

## 8. Segurança & Compliance

| Área          | Item                                  | Ação                                      |
| ------------- | ------------------------------------- | ----------------------------------------- |
| Dados         | Armazenar somente telefone e e-mail   | PII mínima                                |
| Logs          | Mascarar último dígito do telefone    | `+55119999***`                            |
| Consentimento | Opt-out por palavra-chave             | Monitorar mensagens do usuário            |
| Retenção      | Apagar errorHistory após 90 dias      | Job de limpeza futuro                     |
| Auditoria     | Registrar envio + status + tentativas | Firestore subcollection `whatsapp_events` |

---

## 9. Monitoramento & Métricas (MVP)

| Métrica                                       | Fonte                                | Frequência |
| --------------------------------------------- | ------------------------------------ | ---------- |
| Total envios WhatsApp                         | Firestore count                      | diário     |
| Taxa falha transient                          | errorHistory analisada               | diário     |
| Taxa falha permanente                         | errorHistory                         | semanal    |
| % entregues                                   | webhook status                       | diário     |
| % lidos                                       | webhook status                       | diário     |
| Conversão pós-follow-up (cadastro completado) | join outreach + prestador cadastrado | semanal    |

---

## 10. Plano de Testes

| Caso                    | Objetivo                              |
| ----------------------- | ------------------------------------- |
| Envio sucesso           | Retorna 200 e registra whatsappSentAt |
| Token inválido          | Simular 401 → categorizado permanent  |
| Template inexistente    | Simular 404 → permanent               |
| Rate limit              | Simular 429 → transient + retry       |
| Erro interno            | Simular 500 → transient + retry       |
| Opt-out antes follow-up | Não envia WhatsApp                    |
| Webhook delivered       | Atualiza status → delivered           |
| Webhook read            | Atualiza status → read                |

---

## 11. Roadmap Evolução

| Etapa | Descrição                                                                                             |
| ----- | ----------------------------------------------------------------------------------------------------- |
| V1    | Stub + documentação (este checklist)                                                                  |
| V1.1  | Adapter real com fetch + webhook básico                                                               |
| V1.2  | Retry exponencial + métricas iniciais                                                                 |
| V1.3  | Detecção de resposta (iniciar análise simples)                                                        |
| V2    | Enriquecimento com IA Gemini para personalização dinâmica do follow-up (mantendo diretriz uso Google) |
| V2.5  | Segmentação por comportamento (tempo resposta, perfil)                                                |

---

## 12. Fallback Estratégico

| Cenário                              | Ação                                  |
| ------------------------------------ | ------------------------------------- |
| WhatsApp indisponível (5xx > limite) | Reagendar para +2h                    |
| Rate limit contínuo                  | Reduz batch e distribui por minuto    |
| Token expirado                       | Alerta ops + pausa envios             |
| Falha permanente template            | Notificar equipe produto para revisão |

---

## 13. Check Final Antes do Deploy

- [ ] Variáveis de ambiente presentes
- [ ] Templates aprovados e testados via Postman
- [ ] Webhook verificado (challenge OK)
- [ ] Logs mascarando telefone
- [ ] Política opt-out publicada no material do prospector
- [ ] Monitoramento mínimo (dashboard interno) pronto

---

## 14. Anexos Futuro (não implementado ainda)

| Arquivo                     | Objetivo                                      |
| --------------------------- | --------------------------------------------- |
| `whatsappAdapter.test.js`   | Testes unitários do adapter real              |
| `whatsappWebhookHandler.js` | Parsing e persistência dos statuses           |
| `whatsappMetrics.ts`        | Consolidação de métricas para dashboard admin |

---

**Status Atual:** Documentação pronta. Próximo passo: implementar adapter real + webhook.  
**IA Oficial do Projeto:** Google Gemini (manter consistência com diretriz do usuário).

---

**Versão:** 1.0  
**Atualizado:** 2025-11-20
