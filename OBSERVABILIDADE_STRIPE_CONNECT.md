# 📊 OBSERVABILIDADE STRIPE CONNECT - PLANO DE MONITORAMENTO DE RECEITA

**Versão**: 1.0.0  
**Data**: 2025-12-14  
**Status**: 🟡 PLANO APROVADO (Aguardando Implementação)  
**Executor**: COPILOT EXECUTOR (Protocolo Supremo v4.0)

---

## 🎯 OBJETIVO

Estabelecer um sistema de observabilidade completo para o fluxo Stripe Connect, garantindo que **nenhuma falha crítica que impacte receita passe despercebida em produção**.

### Metas de Negócio

- 🎯 **Taxa de sucesso de onboarding**: >90% (providers que iniciam completam)
- 🎯 **Tempo médio de onboarding**: <24 horas (criação → charges_enabled)
- 🎯 **SLA de detecção de falhas**: <15 minutos
- 🎯 **SLA de resposta a alertas críticos**: <1 hora

### Princípios de Observabilidade

1. **Rastreabilidade**: Todo evento crítico deve ser logado com timestamp, userId, accountId
2. **Acionabilidade**: Cada alerta deve ter ação clara associada
3. **Prevenção**: Detectar problemas antes que afetem múltiplos usuários
4. **Visibilidade**: Métricas acessíveis em tempo real

---

## 📡 EVENTOS STRIPE MONITORADOS

### Eventos Críticos de Receita

#### 1. `account.created`

**Descrição**: Nova conta Stripe Connect criada para provider

**Impacto em Receita**: BAIXO (início do funil)

**Dados Capturados**:

```json
{
  "event_type": "account.created",
  "account_id": "acct_xxxxx",
  "user_id": "provider@email.com",
  "timestamp": "2025-12-14T10:00:00Z",
  "country": "BR",
  "type": "express"
}
```

**Ação Esperada do Sistema**:

- ✅ Registrar em Firestore (`stripe_connect_accounts` collection)
- ✅ Log de info: "Stripe Connect account created for {userId}"
- ✅ Iniciar timer de 24h para onboarding

**Alertas**:

- ⚠️ Se >10 criações/hora: possível ataque ou bug (verificar IPs)

---

#### 2. `account.updated`

**Descrição**: Conta Connect atualizada (mudança de status, capabilities, informações)

**Impacto em Receita**: MÉDIO a ALTO

**Dados Capturados**:

```json
{
  "event_type": "account.updated",
  "account_id": "acct_xxxxx",
  "user_id": "provider@email.com",
  "timestamp": "2025-12-14T10:15:00Z",
  "changes": {
    "charges_enabled": true,
    "payouts_enabled": true,
    "requirements": { "currently_due": [] }
  }
}
```

**Ação Esperada do Sistema**:

- ✅ Atualizar status no Firestore
- ✅ Se `charges_enabled` mudou para `true`:
  - Log de sucesso: "Provider {userId} Stripe Connect ACTIVE"
  - Enviar notificação: "Sua conta de pagamentos está ativa!"
  - Marcar onboarding como concluído
- ✅ Se `charges_enabled` mudou para `false`:
  - ⚠️ ALERTA CRÍTICO: "Provider perdeu capacidade de receber pagamentos"
  - Investigar motivo imediatamente

**Alertas**:

- 🚨 **CRÍTICO**: `charges_enabled: false` após estar `true` (risco de churn)
- ⚠️ **ALTO**: `requirements.currently_due` não vazio após 48h (onboarding incompleto)

---

#### 3. `account.application.deauthorized`

**Descrição**: Provider desconectou sua conta Stripe Connect da plataforma

**Impacto em Receita**: CRÍTICO (perda de provider)

**Dados Capturados**:

```json
{
  "event_type": "account.application.deauthorized",
  "account_id": "acct_xxxxx",
  "user_id": "provider@email.com",
  "timestamp": "2025-12-14T10:30:00Z",
  "reason": "user_action"
}
```

**Ação Esperada do Sistema**:

- 🚨 ALERTA CRÍTICO: "Provider {userId} desconectou Stripe Connect"
- ✅ Atualizar status: `stripe_connected: false`
- ✅ Desabilitar propostas do provider até reconexão
- ✅ Enviar email de retenção: "Notamos que você desconectou sua conta..."

**Alertas**:

- 🚨 **CRÍTICO**: Qualquer ocorrência (taxa de churn de providers)
- 🔴 **URGENTE**: Se >3 deauthorizations/dia (investigar problema sistêmico)

---

#### 4. `account.external_account.created`

**Descrição**: Provider adicionou conta bancária para receber payouts

**Impacto em Receita**: MÉDIO (indicativo de progresso no onboarding)

**Dados Capturados**:

```json
{
  "event_type": "account.external_account.created",
  "account_id": "acct_xxxxx",
  "user_id": "provider@email.com",
  "timestamp": "2025-12-14T10:20:00Z",
  "bank_account": {
    "country": "BR",
    "currency": "brl",
    "last4": "1234"
  }
}
```

**Ação Esperada do Sistema**:

- ✅ Log de progresso: "Provider {userId} adicionou conta bancária"
- ✅ Atualizar funil: step "external_account_added" = true

**Alertas**:

- ℹ️ **INFO**: Taxa de conversão (account.created → external_account.created)

---

#### 5. `capability.updated`

**Descrição**: Capability da conta mudou (charges, transfers, card_payments, etc.)

**Impacto em Receita**: ALTO

**Dados Capturados**:

```json
{
  "event_type": "capability.updated",
  "account_id": "acct_xxxxx",
  "user_id": "provider@email.com",
  "timestamp": "2025-12-14T10:25:00Z",
  "capability": "card_payments",
  "status": "active"
}
```

**Ação Esperada do Sistema**:

- ✅ Log de capabilities: "Capability {capability} = {status}"
- ✅ Se `card_payments` = `active`: Provider pode receber cartões
- ✅ Se `transfers` = `active`: Provider pode receber transfers

**Alertas**:

- ⚠️ **ALTO**: Se capability = `inactive` ou `pending` após 72h (verificar requisitos)
- 🚨 **CRÍTICO**: Se capability = `disabled` (verificar violação de ToS)

---

#### 6. `payout.failed`

**Descrição**: Falha ao enviar payout para provider (conta bancária inválida, saldo insuficiente, etc.)

**Impacto em Receita**: CRÍTICO (provider não recebe, insatisfação)

**Dados Capturados**:

```json
{
  "event_type": "payout.failed",
  "account_id": "acct_xxxxx",
  "user_id": "provider@email.com",
  "timestamp": "2025-12-14T10:45:00Z",
  "amount": 15000,
  "currency": "brl",
  "failure_code": "account_closed",
  "failure_message": "Conta bancária foi encerrada"
}
```

**Ação Esperada do Sistema**:

- 🚨 ALERTA CRÍTICO: "Payout FAILED para {userId} - R$ {amount}"
- ✅ Notificar provider: "Não conseguimos enviar seu pagamento. Atualize sua conta."
- ✅ Log detalhado para análise

**Alertas**:

- 🚨 **CRÍTICO**: Qualquer falha de payout (SLA: 30 min de resposta)
- 🔴 **URGENTE**: Se >5% dos payouts falhando (investigar problema Stripe)

---

#### 7. `payout.paid` (Opcional - Métrica Positiva)

**Descrição**: Payout enviado com sucesso para provider

**Impacto em Receita**: POSITIVO (indicador de saúde)

**Dados Capturados**:

```json
{
  "event_type": "payout.paid",
  "account_id": "acct_xxxxx",
  "user_id": "provider@email.com",
  "timestamp": "2025-12-14T11:00:00Z",
  "amount": 15000,
  "currency": "brl"
}
```

**Ação Esperada do Sistema**:

- ✅ Log de sucesso: "Payout enviado para {userId} - R$ {amount}"
- ✅ Métrica: soma total de payouts processados (receita real dos providers)

**Alertas**:

- ℹ️ **INFO**: Dashboard com volume total de payouts/dia

---

### Eventos Secundários (Monitoramento Opcional)

| Evento                             | Impacto | Quando Monitorar                           |
| ---------------------------------- | ------- | ------------------------------------------ |
| `account.external_account.updated` | BAIXO   | Mudanças na conta bancária                 |
| `person.created`                   | BAIXO   | Beneficial owners adicionados              |
| `person.updated`                   | BAIXO   | KYC atualizado                             |
| `transfer.created`                 | MÉDIO   | Transferência para conta Connect           |
| `transfer.failed`                  | ALTO    | Falha de transferência (raro, mas crítico) |

---

## ⚠️ ESTADOS CRÍTICOS DE RECEITA

### Tabela de Estados de Risco

| Estado da Conta             | Charges Enabled | Payouts Enabled | Risco      | Impacto Financeiro                     | Ação Recomendada                     |
| --------------------------- | --------------- | --------------- | ---------- | -------------------------------------- | ------------------------------------ |
| **Ativo (Ideal)**           | ✅ true         | ✅ true         | 🟢 BAIXO   | Zero                                   | Monitorar normalmente                |
| **Onboarding Incompleto**   | ❌ false        | ❌ false        | 🟡 MÉDIO   | Provider não pode aceitar jobs pagos   | Enviar lembrete após 24h             |
| **Restricted**              | ⚠️ partial      | ⚠️ partial      | 🟠 ALTO    | Provider pode perder jobs em andamento | Investigar motivo, contatar provider |
| **Disabled**                | ❌ false        | ❌ false        | 🔴 CRÍTICO | Provider bloqueado, risco de churn     | Ação imediata: suporte + análise     |
| **Charges OK, Payouts NOK** | ✅ true         | ❌ false        | 🟠 ALTO    | Provider recebe mas não saca           | Verificar conta bancária             |
| **Charges NOK, Payouts OK** | ❌ false        | ✅ true         | 🔴 CRÍTICO | Provider não pode receber novos jobs   | Resolver requisitos Stripe           |

---

### Detalhamento de Estados

#### 🟢 **Estado: Ativo (Ideal)**

```json
{
  "charges_enabled": true,
  "payouts_enabled": true,
  "requirements": {
    "currently_due": [],
    "eventually_due": [],
    "past_due": []
  }
}
```

**Risco**: BAIXO  
**Impacto Financeiro**: Zero (provider operando normalmente)  
**Ação**: Nenhuma (monitoramento passivo)

---

#### 🟡 **Estado: Onboarding Incompleto**

```json
{
  "charges_enabled": false,
  "payouts_enabled": false,
  "requirements": {
    "currently_due": ["individual.dob", "individual.address"],
    "eventually_due": ["business.tax_id"],
    "past_due": []
  }
}
```

**Risco**: MÉDIO  
**Impacto Financeiro**: Provider não pode aceitar jobs pagos (perda de GMV)  
**Ação**:

- ⏰ **Após 24h**: Enviar e-mail "Complete seu cadastro para receber pagamentos"
- ⏰ **Após 48h**: Notificação push + WhatsApp
- ⏰ **Após 72h**: Alerta manual para equipe de growth (possível abandono)

---

#### 🟠 **Estado: Restricted**

```json
{
  "charges_enabled": false,
  "payouts_enabled": false,
  "requirements": {
    "currently_due": ["verification.document"],
    "past_due": ["individual.ssn_last_4"]
  }
}
```

**Risco**: ALTO  
**Impacto Financeiro**: Provider pode perder jobs em andamento + novos jobs  
**Ação**:

- 🚨 **IMEDIATO**: Alerta para equipe de suporte
- ✅ Identificar requisito pendente
- ✅ Contatar provider por e-mail + telefone
- ✅ Oferecer suporte para regularização

---

#### 🔴 **Estado: Disabled**

```json
{
  "charges_enabled": false,
  "payouts_enabled": false,
  "disabled_reason": "rejected.fraud"
}
```

**Risco**: CRÍTICO  
**Impacto Financeiro**: Provider completamente bloqueado, risco de churn 100%  
**Ação**:

- 🚨 **URGENTE**: Escalar para CEO/CTO (possível violação de ToS)
- ✅ Investigar motivo do bloqueio Stripe
- ✅ Se legítimo: contatar provider e oferecer alternativas
- ✅ Se fraude: banir provider da plataforma

---

#### 🟠 **Estado: Charges OK, Payouts NOK**

```json
{
  "charges_enabled": true,
  "payouts_enabled": false,
  "external_accounts": { "total_count": 0 }
}
```

**Risco**: ALTO  
**Impacto Financeiro**: Provider acumula saldo mas não consegue sacar  
**Ação**:

- ⏰ **Após 7 dias com saldo >R$100**: Alerta "Adicione sua conta bancária"
- ⏰ **Após 14 dias**: Contato manual (provider pode estar frustrado)

---

#### 🔴 **Estado: Charges NOK, Payouts OK**

```json
{
  "charges_enabled": false,
  "payouts_enabled": true,
  "requirements": {
    "currently_due": ["business.name"]
  }
}
```

**Risco**: CRÍTICO  
**Impacto Financeiro**: Provider não pode aceitar novos jobs (perda de GMV)  
**Ação**:

- 🚨 **IMEDIATO**: Resolver requisito pendente
- ✅ Gerar novo account link se necessário
- ✅ Enviar notificação "Seu cadastro precisa de atualização"

---

## 📊 LOGS E MÉTRICAS

### Logs Obrigatórios

#### Log 1: Falhas de Criação de Conta

**Trigger**: Erro ao chamar `/api/stripe/create-connect-account`

**Formato**:

```json
{
  "timestamp": "2025-12-14T10:00:00Z",
  "level": "ERROR",
  "service": "stripe-connect",
  "action": "create_account",
  "user_id": "provider@email.com",
  "error_code": "invalid_request_error",
  "error_message": "Country not supported",
  "metadata": {
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0"
  }
}
```

**Retenção**: 90 dias  
**Alerta**: Se >10 erros/hora (possível problema de config)

---

#### Log 2: Falhas de Geração de Account Link

**Trigger**: Erro ao chamar `/api/stripe/create-account-link`

**Formato**:

```json
{
  "timestamp": "2025-12-14T10:05:00Z",
  "level": "ERROR",
  "service": "stripe-connect",
  "action": "create_account_link",
  "user_id": "provider@email.com",
  "account_id": "acct_xxxxx",
  "error_code": "account_invalid",
  "error_message": "Account is already completed",
  "metadata": {
    "return_url": "https://servio.ai/dashboard",
    "refresh_url": "https://servio.ai/onboarding"
  }
}
```

**Retenção**: 90 dias  
**Alerta**: Se >5 erros/hora (verificar fluxo de onboarding)

---

#### Log 3: Progresso de Onboarding

**Trigger**: Provider atinge novo milestone no onboarding

**Formato**:

```json
{
  "timestamp": "2025-12-14T10:10:00Z",
  "level": "INFO",
  "service": "stripe-connect",
  "action": "onboarding_milestone",
  "user_id": "provider@email.com",
  "account_id": "acct_xxxxx",
  "milestone": "account_link_generated",
  "metadata": {
    "time_since_creation": "600s"
  }
}
```

**Milestones**:

1. `account_created`
2. `account_link_generated`
3. `onboarding_started` (provider clicou no link)
4. `external_account_added`
5. `charges_enabled`
6. `onboarding_completed`

**Retenção**: 180 dias (análise de funil)

---

### Métricas Críticas

#### Métrica 1: Tempo Médio de Onboarding

**Definição**: Tempo entre `account.created` e `charges_enabled: true`

**Fórmula**:

```
tempo_onboarding = timestamp(charges_enabled) - timestamp(account_created)
```

**Target**: <24 horas  
**Alerta**: Se média semanal >48 horas (fricção no processo)

**Visualização**:

```
P50: 8 horas
P75: 16 horas
P90: 36 horas
P99: 72 horas
```

---

#### Métrica 2: Taxa de Abandono de Onboarding

**Definição**: % de providers que criam conta mas não completam onboarding

**Fórmula**:

```
taxa_abandono = (contas_criadas - contas_ativadas) / contas_criadas * 100
```

**Target**: <10%  
**Alerta**: Se >20% em período de 7 dias

**Segmentação**:

- Por país
- Por fonte de aquisição
- Por dia da semana

---

#### Métrica 3: Taxa de Sucesso de Criação de Conta

**Definição**: % de chamadas `/api/stripe/create-connect-account` que retornam 200

**Fórmula**:

```
taxa_sucesso = (requests_200 / total_requests) * 100
```

**Target**: >98%  
**Alerta**: Se <90% em período de 1 hora

---

#### Métrica 4: Contas com Charges Enabled

**Definição**: Número total de providers com `charges_enabled: true`

**Fórmula**:

```
contas_ativas = COUNT(accounts WHERE charges_enabled = true)
```

**Target**: Crescimento constante (min +10/semana)  
**Alerta**: Se decréscimo absoluto em 7 dias (churn)

---

#### Métrica 5: Volume Total de Payouts Processados

**Definição**: Soma de todos os payouts enviados com sucesso

**Fórmula**:

```
volume_payouts = SUM(payout.paid.amount) em período
```

**Target**: Crescimento MoM >15%  
**Visualização**: Dashboard com série temporal

---

#### Métrica 6: Taxa de Falha de Payouts

**Definição**: % de payouts que falharam

**Fórmula**:

```
taxa_falha_payout = (payout.failed / total_payouts) * 100
```

**Target**: <2%  
**Alerta**: Se >5% em período de 24 horas

---

### Métricas Operacionais (Dashboard)

| Métrica                        | Descrição                            | Período | Target    |
| ------------------------------ | ------------------------------------ | ------- | --------- |
| **Onboarding Starts/Day**      | Novos providers iniciando onboarding | Diário  | >5        |
| **Onboarding Completions/Day** | Providers ativados                   | Diário  | >4        |
| **Conversion Rate**            | Onboarding completions / starts      | Semanal | >80%      |
| **Avg. Time to Active**        | Tempo médio onboarding               | Semanal | <24h      |
| **Accounts Restricted**        | Contas com status restricted         | Diário  | 0         |
| **Accounts Disabled**          | Contas com status disabled           | Diário  | 0         |
| **Failed Payouts**             | Payouts que falharam                 | Diário  | 0         |
| **Total GMV (via Stripe)**     | Volume transacionado                 | Mensal  | Crescente |

---

## 🚨 ALERTAS OPERACIONAIS E SLAs

### Classificação de Severidade

| Severidade     | Impacto                   | SLA Resposta | SLA Resolução | Canal                |
| -------------- | ------------------------- | ------------ | ------------- | -------------------- |
| 🔴 **CRÍTICO** | Bloqueio total de receita | 15 min       | 1 hora        | SMS + Slack + E-mail |
| 🟠 **ALTO**    | Degradação de receita     | 1 hora       | 4 horas       | Slack + E-mail       |
| 🟡 **MÉDIO**   | Risco potencial           | 4 horas      | 24 horas      | E-mail               |
| 🔵 **BAIXO**   | Informativo               | 24 horas     | 7 dias        | Dashboard            |

---

### Alertas Críticos (🔴 CRÍTICO)

#### Alerta 1: Provider Perdeu Capacidade de Receber Pagamentos

**Trigger**: `account.updated` com `charges_enabled` mudando de `true` → `false`

**Severidade**: 🔴 CRÍTICO  
**SLA Resposta**: 15 minutos  
**SLA Resolução**: 1 hora  
**Canal**: SMS + Slack #alerts-critical + E-mail CEO/CTO

**Ação**:

1. Verificar motivo no dashboard Stripe
2. Contatar provider imediatamente
3. Resolver requisitos pendentes
4. Gerar novo account link se necessário
5. Reportar incidente em post-mortem

---

#### Alerta 2: Taxa de Falha de Payouts >5%

**Trigger**: Mais de 5% dos payouts falhando em período de 24h

**Severidade**: 🔴 CRÍTICO  
**SLA Resposta**: 15 minutos  
**SLA Resolução**: 2 horas  
**Canal**: SMS + Slack #alerts-critical + E-mail

**Ação**:

1. Verificar status Stripe API (possível outage)
2. Analisar logs de erros (códigos de falha)
3. Se problema sistêmico: pausar processamento de payouts
4. Comunicar providers afetados
5. Reportar incidente

---

#### Alerta 3: Account Deauthorized (Provider Desconectou)

**Trigger**: `account.application.deauthorized`

**Severidade**: 🔴 CRÍTICO  
**SLA Resposta**: 30 minutos  
**SLA Resolução**: 4 horas  
**Canal**: Slack #alerts-churn + E-mail Growth Team

**Ação**:

1. Investigar histórico do provider (jobs recentes, disputes)
2. Enviar e-mail de retenção: "Notamos que você desconectou..."
3. Oferecer suporte para reconexão
4. Analisar padrão (se >3/dia, investigar bug)

---

### Alertas de Alto Risco (🟠 ALTO)

#### Alerta 4: Conta Restricted

**Trigger**: `account.updated` com status `restricted`

**Severidade**: 🟠 ALTO  
**SLA Resposta**: 1 hora  
**SLA Resolução**: 4 horas  
**Canal**: Slack #alerts-high + E-mail Suporte

**Ação**:

1. Identificar requisitos pendentes
2. Contatar provider por e-mail + WhatsApp
3. Oferecer assistência para regularização
4. Monitorar resolução

---

#### Alerta 5: Taxa de Abandono de Onboarding >20%

**Trigger**: Mais de 20% dos onboardings não completados em 7 dias

**Severidade**: 🟠 ALTO  
**SLA Resposta**: 1 hora  
**SLA Resolução**: 24 horas  
**Canal**: Slack #alerts-growth + E-mail Product

**Ação**:

1. Analisar funil (onde há drop-off)
2. Revisar UX do onboarding
3. Testar account links (quebrados?)
4. A/B test de mensagens de lembrete

---

#### Alerta 6: Spike de Erros Stripe (>10 erros/hora)

**Trigger**: Mais de 10 erros ao criar contas ou account links

**Severidade**: 🟠 ALTO  
**SLA Resposta**: 1 hora  
**SLA Resolução**: 4 horas  
**Canal**: Slack #alerts-engineering + E-mail DevOps

**Ação**:

1. Verificar logs de erro (códigos)
2. Testar endpoint manualmente
3. Verificar status Stripe API
4. Se config issue: rollback ou fix urgente

---

### Alertas de Risco Médio (🟡 MÉDIO)

#### Alerta 7: Onboarding Não Completado em 48h

**Trigger**: Provider criou conta mas não tem `charges_enabled` após 48h

**Severidade**: 🟡 MÉDIO  
**SLA Resposta**: 4 horas  
**SLA Resolução**: 24 horas  
**Canal**: E-mail Growth Ops

**Ação**:

1. Enviar e-mail de follow-up
2. Oferecer suporte (chat ao vivo, FAQ)
3. Gerar novo account link (caso expirado)

---

#### Alerta 8: Queda Abrupta na Conversão

**Trigger**: Conversão onboarding <60% em período de 7 dias (normal: >80%)

**Severidade**: 🟡 MÉDIO  
**SLA Resposta**: 4 horas  
**SLA Resolução**: 48 horas  
**Canal**: E-mail Product + Growth

**Ação**:

1. Analisar mudanças recentes (deploy, UX)
2. Segmentar por fonte de aquisição
3. Testar fluxo end-to-end
4. Ajustar messaging ou UX

---

### Alertas Informativos (🔵 BAIXO)

#### Alerta 9: Novo Milestone de Onboarding

**Trigger**: Provider completa milestone (ex: external_account_added)

**Severidade**: 🔵 BAIXO  
**Canal**: Dashboard

**Ação**: Nenhuma (tracking de funil)

---

#### Alerta 10: Payout Enviado com Sucesso

**Trigger**: `payout.paid`

**Severidade**: 🔵 BAIXO  
**Canal**: Dashboard

**Ação**: Atualizar métrica de volume total de payouts

---

## 📈 FUNIL DE CONVERSÃO STRIPE CONNECT

### Visão Geral do Funil

```
┌─────────────────────────────────────────────┐
│ 1. PROVIDER CRIADO (Registro no Servio.AI) │ 100%
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 2. CONTA STRIPE CRIADA (account.created)   │ ~95% (target)
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 3. ONBOARDING INICIADO (link clicado)      │ ~90% (target)
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 4. CONTA BANCÁRIA ADICIONADA               │ ~85% (target)
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 5. ONBOARDING COMPLETO (charges_enabled)   │ ~80% (target)
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│ 6. CONTA ATIVA (primeiro job pago)         │ ~70% (target)
└─────────────────────────────────────────────┘
```

---

### Métricas por Etapa do Funil

#### Etapa 1: Provider Criado

**Definição**: Usuário completa registro como prestador no Servio.AI

**Métrica**:

```sql
SELECT COUNT(*) FROM users WHERE type = 'prestador'
```

**Target**: Baseline (100%)  
**Ação**: Nenhuma (início do funil)

---

#### Etapa 2: Conta Stripe Criada

**Definição**: Chamada bem-sucedida a `/api/stripe/create-connect-account`

**Métrica**:

```sql
SELECT COUNT(*) FROM stripe_connect_accounts
```

**Conversão Esperada**: 95% (de providers criados)  
**Drop-off Reasons**:

- Provider não iniciou onboarding
- Erro na criação da conta (país não suportado, etc.)

**Ação se <90%**:

- Verificar logs de erro
- Melhorar UX de call-to-action
- Testar endpoint Stripe

---

#### Etapa 3: Onboarding Iniciado

**Definição**: Provider clicou no account link gerado

**Métrica**:

```sql
SELECT COUNT(*)
FROM onboarding_events
WHERE event = 'account_link_clicked'
```

**Conversão Esperada**: 90% (de contas criadas)  
**Drop-off Reasons**:

- Account link expirou (7 dias)
- Provider não viu notificação
- Provider abandonou (cold feet)

**Ação se <80%**:

- Enviar lembretes mais frequentes (24h, 48h)
- Melhorar copy do e-mail/notificação
- Oferecer suporte via chat

---

#### Etapa 4: Conta Bancária Adicionada

**Definição**: Provider adicionou external_account (conta bancária)

**Métrica**:

```sql
SELECT COUNT(*)
FROM stripe_connect_accounts
WHERE external_accounts.total_count > 0
```

**Conversão Esperada**: 85% (de onboardings iniciados)  
**Drop-off Reasons**:

- Provider não tem conta bancária
- Dúvidas sobre segurança
- UX confusa na tela Stripe

**Ação se <75%**:

- Adicionar FAQ sobre segurança
- Oferecer suporte telefônico
- Simplificar instruções

---

#### Etapa 5: Onboarding Completo

**Definição**: Provider tem `charges_enabled: true`

**Métrica**:

```sql
SELECT COUNT(*)
FROM stripe_connect_accounts
WHERE charges_enabled = true
```

**Conversão Esperada**: 80% (de contas com bancária)  
**Drop-off Reasons**:

- Requisitos KYC pendentes
- Documentação rejeitada
- Provider desistiu

**Ação se <70%**:

- Enviar assistente de KYC
- Revisar documentos com provider
- Oferecer call de suporte

---

#### Etapa 6: Conta Ativa (Primeiro Job Pago)

**Definição**: Provider recebeu pelo menos 1 pagamento via Stripe

**Métrica**:

```sql
SELECT COUNT(DISTINCT provider_id)
FROM jobs
WHERE status = 'concluido'
AND payment_method = 'stripe'
```

**Conversão Esperada**: 70% (de onboardings completos)  
**Drop-off Reasons**:

- Provider não recebeu jobs
- Provider preferiu pagamento offline
- Provider inativo

**Ação se <60%**:

- Melhorar matching de jobs
- Incentivar clientes a usar Stripe
- Gamificação (badges para primeiro job pago)

---

### Dashboard de Funil (Visualização Recomendada)

```
┌──────────────────────────────────────────────────┐
│ FUNIL STRIPE CONNECT - ÚLTIMA SEMANA            │
├──────────────────────────────────────────────────┤
│                                                  │
│ Providers Criados          100  ████████████████ │
│ Contas Stripe Criadas       95  ███████████████  │
│ Onboarding Iniciado         86  ██████████████   │
│ Conta Bancária Adicionada   73  ████████████     │
│ Onboarding Completo         68  ███████████      │
│ Conta Ativa (1º Job)        48  █████████        │
│                                                  │
│ Conversão Global: 48%                            │
│ Target: 70%                                      │
│ Status: 🟡 ATENÇÃO (abaixo do target)           │
└──────────────────────────────────────────────────┘
```

---

### Métricas de Velocidade do Funil

| Etapa                                  | Tempo Médio | Target   | Alerta se > |
| -------------------------------------- | ----------- | -------- | ----------- |
| Criação de Conta → Onboarding Iniciado | 2 horas     | <4 horas | 24 horas    |
| Onboarding Iniciado → Conta Bancária   | 15 minutos  | <30 min  | 2 horas     |
| Conta Bancária → Onboarding Completo   | 5 minutos   | <10 min  | 1 hora      |
| Onboarding Completo → Primeiro Job     | 3 dias      | <7 dias  | 14 dias     |

---

## 🔧 PRÓXIMOS PASSOS TÉCNICOS (SEM CÓDIGO)

### Fase 1: Configuração de Webhooks Stripe (Prioridade: ALTA)

**Objetivo**: Receber eventos Stripe em tempo real

**Ações**:

1. Acessar Dashboard Stripe → Webhooks
2. Criar endpoint: `https://api.servio.ai/webhooks/stripe`
3. Selecionar eventos:
   - `account.created`
   - `account.updated`
   - `account.application.deauthorized`
   - `account.external_account.created`
   - `capability.updated`
   - `payout.failed`
   - `payout.paid`
4. Configurar signing secret no backend
5. Validar webhook signature em produção
6. Testar com Stripe CLI: `stripe listen --forward-to localhost:8081/webhooks/stripe`

**Responsável**: Backend Engineer  
**Prazo**: Sprint 2  
**Dependências**: Endpoint webhook já existe? (verificar backend)

---

### Fase 2: Logging Estruturado (Prioridade: ALTA)

**Objetivo**: Garantir que todos os eventos críticos sejam logados

**Ações**:

1. Implementar logger estruturado (Winston ou Pino)
2. Definir schema de logs (JSON format)
3. Adicionar logs em:
   - `/api/stripe/create-connect-account`
   - `/api/stripe/create-account-link`
   - Webhook handler `/webhooks/stripe`
4. Enviar logs para Cloud Logging (GCP) ou similar
5. Configurar retenção de 90 dias

**Responsável**: Backend Engineer  
**Prazo**: Sprint 2  
**Dependências**: Cloud Logging configurado

---

### Fase 3: Firestore Collection para Tracking (Prioridade: MÉDIA)

**Objetivo**: Armazenar estado de onboarding para métricas

**Ações**:

1. Criar collection `stripe_connect_accounts`:
   ```javascript
   {
     userId: "provider@email.com",
     accountId: "acct_xxxxx",
     status: "active",
     chargesEnabled: true,
     payoutsEnabled: true,
     requirements: { currentlyDue: [] },
     createdAt: Timestamp,
     updatedAt: Timestamp,
     milestones: {
       accountCreated: Timestamp,
       accountLinkGenerated: Timestamp,
       onboardingStarted: Timestamp,
       externalAccountAdded: Timestamp,
       chargesEnabled: Timestamp,
       firstJobPaid: Timestamp
     }
   }
   ```
2. Atualizar via webhooks Stripe
3. Query para métricas de funil

**Responsável**: Backend Engineer  
**Prazo**: Sprint 3  
**Dependências**: Webhooks ativos

---

### Fase 4: Dashboard de Métricas (Prioridade: MÉDIA)

**Objetivo**: Visualizar funil e alertas em tempo real

**Ações**:

1. Escolher ferramenta:
   - Opção A: Metabase (open-source, self-hosted)
   - Opção B: Looker Studio (Google, free)
   - Opção C: Custom dashboard (React + Chart.js)
2. Conectar a Firestore
3. Criar queries para métricas do funil
4. Criar gráficos:
   - Funil de conversão (etapas)
   - Taxa de sucesso de criação de conta (série temporal)
   - Tempo médio de onboarding (P50, P90)
   - Volume de payouts processados
5. Adicionar filtros: período, país, fonte de aquisição

**Responsável**: Data Analyst / Frontend Engineer  
**Prazo**: Sprint 4  
**Dependências**: Dados em Firestore

---

### Fase 5: Sistema de Alertas (Prioridade: ALTA)

**Objetivo**: Notificar equipe sobre eventos críticos

**Ações**:

1. Configurar integração Slack:
   - Canal `#alerts-critical`
   - Canal `#alerts-high`
   - Canal `#alerts-growth`
2. Criar regras de alerta (Cloud Functions ou backend):
   - Se `charges_enabled` muda para `false` → Slack + SMS
   - Se taxa de falha de payout >5% → Slack
   - Se provider deauthorize → Slack
3. Configurar e-mails de alerta (SendGrid)
4. Definir on-call rotation (PagerDuty ou similar)

**Responsável**: DevOps / Backend Engineer  
**Prazo**: Sprint 2  
**Dependências**: Webhooks + Logging ativos

---

### Fase 6: Automação de Follow-ups (Prioridade: BAIXA)

**Objetivo**: Reduzir abandono de onboarding

**Ações**:

1. Criar Cloud Function triggered por Firestore
2. Se `accountCreated` > 24h e `!chargesEnabled`:
   - Enviar e-mail de lembrete
   - Registrar evento de follow-up
3. Se `accountCreated` > 48h e `!chargesEnabled`:
   - Enviar notificação push + WhatsApp
   - Registrar evento
4. Se `accountCreated` > 72h e `!chargesEnabled`:
   - Alerta manual para Growth Team

**Responsável**: Backend Engineer  
**Prazo**: Sprint 5  
**Dependências**: Firestore collection ativa

---

### Fase 7: Monitoramento de SLA (Prioridade: BAIXA)

**Objetivo**: Garantir que alertas sejam respondidos no prazo

**Ações**:

1. Criar collection `alerts_history`:
   ```javascript
   {
     alertId: "alert_001",
     timestamp: Timestamp,
     severity: "CRITICAL",
     message: "Provider acct_xxxxx charges_enabled = false",
     acknowledged: false,
     acknowledgedBy: null,
     acknowledgedAt: null,
     resolved: false,
     resolvedBy: null,
     resolvedAt: null,
     sla: {
       response: "15 min",
       resolution: "1 hour"
     }
   }
   ```
2. Dashboard de SLA compliance
3. Relatório mensal de tempo de resposta

**Responsável**: Data Analyst  
**Prazo**: Sprint 6  
**Dependências**: Sistema de alertas ativo

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Sprint 2 (Curto Prazo)

- [ ] Configurar webhooks Stripe (account._, capability._, payout.\*)
- [ ] Implementar logging estruturado (JSON format)
- [ ] Enviar logs para Cloud Logging
- [ ] Configurar Slack channels (#alerts-critical, #alerts-high)
- [ ] Criar regras de alerta básicas (charges_enabled = false)
- [ ] Testar webhooks com Stripe CLI

### Sprint 3 (Médio Prazo)

- [ ] Criar Firestore collection `stripe_connect_accounts`
- [ ] Atualizar collection via webhooks
- [ ] Implementar tracking de milestones
- [ ] Criar queries para métricas de funil
- [ ] Configurar alertas para onboarding >48h

### Sprint 4 (Longo Prazo)

- [ ] Configurar dashboard de métricas (Metabase/Looker)
- [ ] Conectar dashboard a Firestore
- [ ] Criar visualizações de funil
- [ ] Adicionar gráficos de série temporal
- [ ] Configurar refresh automático (5 min)

### Sprint 5+ (Futuro)

- [ ] Automação de follow-ups (e-mail, push, WhatsApp)
- [ ] Monitoramento de SLA de alertas
- [ ] Relatórios mensais de performance
- [ ] A/B testing de mensagens de onboarding
- [ ] Análise preditiva de churn

---

## 🎓 GLOSSÁRIO

| Termo                             | Definição                                                         |
| --------------------------------- | ----------------------------------------------------------------- |
| **Charges Enabled**               | Capacidade da conta Connect de receber pagamentos                 |
| **Payouts Enabled**               | Capacidade da conta Connect de receber transfers/payouts          |
| **Account Link**                  | URL temporária (7 dias) para provider completar onboarding Stripe |
| **External Account**              | Conta bancária do provider para receber payouts                   |
| **Capability**                    | Permissão específica da conta (card_payments, transfers, etc.)    |
| **GMV (Gross Merchandise Value)** | Volume bruto transacionado via Stripe                             |
| **Restricted**                    | Conta com limitações (requisitos pendentes)                       |
| **Disabled**                      | Conta bloqueada pelo Stripe (violação de ToS, fraude, etc.)       |
| **Onboarding**                    | Processo de configuração da conta Stripe Connect                  |
| **Webhook**                       | Notificação HTTP do Stripe sobre evento ocorrido                  |

---

## 🔗 REFERÊNCIAS

- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Account Object**: https://stripe.com/docs/api/accounts
- **Capability Object**: https://stripe.com/docs/api/capabilities
- **Payout Object**: https://stripe.com/docs/api/payouts
- **Connect Onboarding**: https://stripe.com/docs/connect/connect-onboarding

---

## ✍️ APROVAÇÃO E VERSIONAMENTO

**Versão**: 1.0.0  
**Data**: 2025-12-14  
**Autor**: COPILOT EXECUTOR (Protocolo Supremo v4.0)  
**Revisores**: Pendente (CEO, CTO, Head of Engineering)  
**Status**: 🟡 APROVADO PARA IMPLEMENTAÇÃO

**Histórico de Versões**:

- v1.0.0 (2025-12-14): Versão inicial completa

**Próxima Revisão**: Após Sprint 2 (implementação de webhooks)

---

_Observabilidade é prevenção. Monitorar é proteger a receita._
