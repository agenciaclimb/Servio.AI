# 🚨 RUNBOOK DE DISPUTAS — OPERAÇÃO DE SUPORTE

**Data**: 2025-12-14  
**Versão**: 1.0.0  
**Objetivo**: Padronizar a resposta operacional a refunds, disputes e chargebacks, garantindo SLA, evidências corretas e comunicação clara.

---

## 9.1 Papéis e Responsabilidades

| Papel                     | Responsabilidades                                                  | SLA                                  |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| **Suporte N1**            | Abertura do ticket, triagem inicial, coleta de informações básicas | Até 2h                               |
| **Suporte N2**            | Validação de evidências, submissão ao Stripe, acompanhamento       | Até 72h (antes de `evidence_due_by`) |
| **Operações Financeiras** | Decisão de absorção/repasse, ajuste de saldos, comissões           | Até 5 dias úteis                     |
| **Plataforma (Tech)**     | Coordenação de logs, webhooks, integrações; auditoria              | Contínuo                             |

---

## 9.2 Fluxo Operacional Passo a Passo

### **Etapa 1: Abertura do Ticket**

- **Fonte**: webhook `charge.dispute.created`, alerta automático, ou solicitação manual do cliente
- **Ação**:
  - Registrar: `dispute_id`, `charge_id`, `amount`, `reason`, `evidence_due_by`, `userId`, `jobId`
  - Criar ticket único no sistema de suporte com ID rastreável
  - Assinalar para Suporte N1
- **Prazo**: Imediato

### **Etapa 2: Triagem e Classificação**

- **Ação**:
  - Classificar tipo: `fraudulent`, `unrecognized`, `service_not_as_described`, `duplicate_charge`
  - Definir severidade: 🔴 CRÍTICA (padrão, volume alto), 🟠 ALTA (> R$ 5k), 🟡 MÉDIA (< R$ 5k)
  - Aplicar SLA conforme tipo
  - Atualizar ticket com classificação
- **Prazo**: Até 1h da abertura

### **Etapa 3: Coleta de Evidências**

- **Suporte N1**:
  - Contato imediato com cliente/provider para solicitar evidências
  - Checklist por tipo (ver seção 9.3)
  - Tempo máximo: até 48h (respeitando `evidence_due_by` com buffer de 24h)
- **Suporte N2**:
  - Validar completude das evidências
  - Organizar em pasta digital com nomeação padrão
  - Preparar narrativa de defesa (redação clara e concisa)
- **Prazo**: Até 72h da abertura

### **Etapa 4: Comunicação com Partes**

- **Com o Cliente**:
  - Template: "Recebemos sua reclamação. Investigaremos em até [SLA] dias. Acompanhamento em [data]."
  - Atualizar a cada mudança de status
  - Tom: profissional, empático, transparente
- **Com o Provider** (se aplicável):
  - Solicitar evidências de execução (fotos, mensagens, recibos)
  - Informar possível impacto (retenção, penalidade)
  - Definir prazo para resposta: 24–48h
- **Registro**: Todas as comunicações em ticket para rastreabilidade
- **Prazo**: Inicial até 2h; atualizações contínuas

### **Etapa 5: Análise e Decisão Interna**

- **Critério**:
  - **Evidência forte** (fotos, mensagens, aceites): Defender a disputa
  - **Evidência fraca**: Propor acordo ou refund parcial
  - **Sem evidência**: Preparar para perda; registrar motivo
- **Decisão Financeira** (Operações):
  - Aplicar matriz de responsabilidade
  - Decidir absorção ou repasse ao provider
  - Registrar justificativa
- **Prazo**: Até 5 dias úteis

### **Etapa 6: Submissão ao Stripe**

- **Ação**:
  - Suporte N2 envia evidências via Stripe Dashboard → Disputes → Submit Evidence
  - Confirmar recebimento e status (`under_review`)
  - Registrar timestamp de submissão
- **Validação**:
  - Verificar formato (imagens claras, docs legíveis, descrição textual completa)
  - Priorizar formato recomendado: PDF + imagens correlatas
- **Prazo**: Antes de `evidence_due_by` (buffer 24h mínimo)

### **Etapa 7: Acompanhamento (Stripe Side)**

- **Ação**:
  - Monitorar evento `charge.dispute.updated` (webhook)
  - Status esperado: `evidence_submitted` → `won` ou `lost`
  - Atualizar ticket automaticamente
  - Tempo de decisão do Stripe: 10–20 dias úteis (pode variar)
- **Escalação**:
  - Se não há atualizações em 25 dias → contatar Stripe Merchant Support

### **Etapa 8: Resolução e Encerramento**

- **Se Ganho (won)**:
  - Registrar vitória; comunicar cliente e provider
  - Atualizar métricas (taxa de sucesso +1)
  - Arquivo: lesson learned (por que ganhou?)
- **Se Perdido (lost)**:
  - Registrar perda; processar reembolso (conforme decisão de Operações)
  - Comunicar partes; explicar motivo (transparência)
  - Atualizar métricas (taxa de chargeback +1)
  - Arquivo: root cause (por que perdeu? Como mitigar?)
  - Se padrão detectado → escalação para Produto/CTO
- **Encerramento de Ticket**:
  - Data: conforme `charge.dispute.closed`
  - Status: "RESOLVIDO" ou "ESCALADO"

---

## 9.3 Checklists de Evidências por Tipo

### **Fraudulent (Cartão Roubado)**

- [ ] Contato com cliente: "Você fez essa compra?"
- [ ] Se NÃO → refund esperado (não enviar muita evidência)
- [ ] Se SIM → coletar:
  - [ ] Comprovantes de execução (fotos, datas, assinaturas)
  - [ ] Chat/mensagens com provider confirmando serviço
  - [ ] Aceite de proposta (screenshot)
  - [ ] Localização/IP de acesso ao app (se disponível)
  - [ ] Recibo detalhado com descrição do serviço

### **Unrecognized (Não Reconhecido)**

- [ ] Fatura detalhada com identificadores
- [ ] Prova de vínculo: email/telefone do cadastro
- [ ] Histórico de acesso à conta no período da compra
- [ ] Se houver, comprovante de execução (reduz contestação)

### **Service Not As Described / Not Provided**

- [ ] Escopo contratado (mensagem de aceite da proposta)
- [ ] Entrega efetiva (fotos, data/hora, localização)
- [ ] Divergências documentadas (o que faltou? Por quê?)
- [ ] Tentativas de resolução (mensagens do suporte)
- [ ] Evidências do provider (se cooperativo)

### **Duplicate Charge**

- [ ] Logs de transação (timestamps, idempotency keys)
- [ ] Confirmação de reembolso já emitido
- [ ] Correção técnica implementada (para evitar recorrência)

---

## 9.4 Templates de Comunicação

### **Template 1: Aviso Inicial ao Cliente**

```
Assunto: Sua reclamação foi recebida — Referência: [DISPUTE_ID]

Olá [Cliente],

Recebemos sua reclamação referente à compra de R$ [AMOUNT] em [DATA].
Vamos investigar dentro de [SLA] dias úteis e entrar em contato com uma resposta.

Referência: [DISPUTE_ID] | Acompanhamento: [LINK de acompanhamento]

Obrigado pela paciência.
Equipe Servio.AI
```

### **Template 2: Solicitação de Evidências ao Provider**

```
Assunto: Solicitação de Evidências — Job [JOB_ID] — [CLIENTE_NOME]

Olá [Provider],

Recebemos uma reclamação sobre o job concluído em [DATA].
Para defendermos ambos, precisamos de evidências do trabalho realizado:

- Fotos do serviço realizado
- Datas/horários de execução
- Qualquer comunicação com o cliente

Prazo: até [DATA_LIMITE]

Impacto: sem evidências, a reclamação pode resultar em reembolso.

Envie para: suporte@servio.ai
```

### **Template 3: Notificação de Resolução (Ganho)**

```
Assunto: Sua reclamação foi resolvida — Referência: [DISPUTE_ID]

Olá [Cliente],

Analisamos sua reclamação e conseguimos resolver em seu favor.
O valor de R$ [AMOUNT] será creditado em sua conta em até 5–7 dias úteis.

Obrigado por usar Servio.AI.
```

### **Template 4: Notificação de Resolução (Perdido)**

```
Assunto: Resolução de sua reclamação — Referência: [DISPUTE_ID]

Olá [Cliente],

Analisamos sua reclamação com cuidado. Infelizmente, a documentação disponível
não sustentou uma defesa bem-sucedida junto ao nosso processador de pagamentos.
Seu reembolso foi processado e chegará em [PRAZO].

Gostaríamos de melhorar. Fale conosco em suporte@servio.ai.
```

---

## 9.5 Auditoria e Métricas

### **Painel (atualizar mensalmente)**

- Taxa de chargeback = (Total de chargebacks / Total de transações) × 100
- Tempo médio de resolução = média de (fecha_data - abre_data)
- Taxa de sucesso em defesa = (Disputes won / Disputes lost + won) × 100
- Impacto financeiro mensal = Σ(refunds + dispute fees)

### **Relatório Mensal** (Operações)

- Volume de disputes por tipo
- Principais razões de perda
- Padrões por provider/cliente (risco)
- Recomendações (política, bloqueios, melhorias)

### **Escalação Automática**

- Se taxa de chargeback > 1%: revisar política de KYC
- Se padrão de perda em `service_not_as_described`: comunicar Produto
- Se provider com > 3 disputes perdidos: revisar/bloquear

---

## 📌 Referência

Este **Runbook operacional** complementa o plano de governança financeira em `REFUNDS_DISPUTES_STRIPE_CONNECT.md`.  
Próximo passo: Implementação técnica de webhooks + alertas conforme `OBSERVABILIDADE_STRIPE_CONNECT.md`.
