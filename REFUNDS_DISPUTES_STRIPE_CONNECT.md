# 💼 REFUNDS, DISPUTES E CHARGEBACKS — PLANO DE GESTÃO (Stripe Connect)

**Versão**: 1.0.0  
**Data**: 2025-12-14  
**Status**: 🟡 Plano aprovado (aguardando implementação)  
**Executor**: COPILOT EXECUTOR (Protocolo Supremo v4.0)

---

## 🎯 1. Objetivo

Definir um plano completo para gestão de **refunds, disputes e chargebacks** no contexto **Stripe Connect (Express)**, protegendo:

- Receita da plataforma (GMV, comissões)
- Margem (taxas não reembolsáveis, custos operacionais)
- Relação com providers (justiça e transparência)
- Risco jurídico e operacional (compliance, políticas internas)

Princípios:

- Conservador, rastreável e acionável
- Sem decisões legais absolutas (sujeito a validação jurídica)
- Alinhado à arquitetura vigente (escrow + Stripe Connect onboarding implementados)

---

## 🔁 2. Tipos de Refund

### 2.1 Refund Automático

- **Quando**:
  - Cancelamento de job pelo cliente antes de iniciar execução (escrow ainda em hold)
  - Falha técnica evidente (cobrança duplicada detectada)
- **Autorização**: Plataforma (workflow automatizado com verificação mínima)
- **Impacto Financeiro**: Baixo–médio; taxas Stripe podem não ser reembolsáveis (avaliar política)
- **Prazo Máximo**: 24–48h após solicitação
- **Notas**: Priorizar reversão antes de liberação do escrow; registrar motivo categorizado.

### 2.2 Refund Manual

- **Quando**:
  - Solicitação via suporte (após início do job, sem conclusão)
  - Acordo entre cliente e provider (parte não executada)
- **Autorização**: Plataforma (análise + aprovação), com ciência do provider
- **Impacto Financeiro**: Médio; considerar taxas Stripe + custos internos
- **Prazo Máximo**: 3–5 dias úteis
- **Notas**: Decisão baseada em evidências; comunicação transparente às partes.

### 2.3 Refund Parcial

- **Quando**: Serviço parcialmente entregue ou aquém do escopo acordado
- **Autorização**: Plataforma, após mediação com provider
- **Impacto Financeiro**: Variável; recalcular comissões sobre valor remanescente
- **Prazo Máximo**: 3–5 dias úteis
- **Notas**: Documentar cálculo e acordo; registrar percentuais.

### 2.4 Refund Pós-Dispute (Perda de Dispute/Chargeback)

- **Quando**: Dispute encerrado contra a plataforma/provider, com devolução forçada
- **Autorização**: Stripe/Emissor (automático); plataforma registra e comunica
- **Impacto Financeiro**: Alto; inclui valor + possíveis taxas de dispute
- **Prazo Máximo**: Conforme encerramento Stripe (imediato na decisão)
- **Notas**: Atualizar métricas de chargeback; revisar política do caso.

---

## ⚖️ 3. Tipos de Dispute / Chargeback

### 3.1 Fraudulent (Cartão Roubado/Comprometido)

- **Responsável Primário**: Cliente final (emissor do cartão origina disputa)
- **Evidências**:
  - Comprovantes de execução (fotos, assinaturas, timestamps)
  - Logs de comunicação (chat, aceite de proposta)
  - Termos de serviço aceitos, geolocalização (se aplicável)
- **Prazo Stripe**: Até `due_by` informado no evento; **SLO interno**: enviar em até 48h
- **Risco Financeiro**: Alto (probabilidade de perda do valor e taxa de dispute)

### 3.2 Unrecognized (Cobrança Não Reconhecida)

- **Responsável Primário**: Cliente (contestação de reconhecimento)
- **Evidências**:
  - Fatura detalhada, identificadores da transação
  - Prova de vínculo com job (usuário autenticado, email/telefone)
- **Prazo Stripe**: Até `due_by`; **SLO interno**: 72h
- **Risco Financeiro**: Médio–alto

### 3.3 Service Not As Described / Not Provided

- **Responsável Primário**: Provider (entrega divergente ou não execução)
- **Evidências**:
  - Escopo contratado vs. entrega (mensagens, fotos)
  - Tentativas de resolução, cancelamentos, reembolsos parciais
- **Prazo Stripe**: Até `due_by`; **SLO interno**: 72h
- **Risco Financeiro**: Médio

### 3.4 Duplicate Charge (Cobrança Duplicada)

- **Responsável Primário**: Plataforma (processo de cobrança)
- **Evidências**:
  - Logs de checkout/escrow, idempotency keys
  - Registro de reembolso da duplicidade
- **Prazo Stripe**: Até `due_by`; **SLO interno**: 48h
- **Risco Financeiro**: Baixo–médio (refund esperado)

---

## 🧭 4. Matriz de Responsabilidade

| Cenário                         | Quem Paga o Valor                         | Taxas (Stripe, Dispute)                | Responsável Jurídico (consulta) | Política de Absorção/Repasse                       |
| ------------------------------- | ----------------------------------------- | -------------------------------------- | ------------------------------- | -------------------------------------------------- |
| Fraudulent                      | Plataforma (geralmente perde)             | Plataforma absorve taxa de dispute     | Plataforma coordena resposta    | Revisão de risco + mitigação futura                |
| Unrecognized                    | Caso a caso (se evidência forte → defesa) | Se perder, plataforma absorve          | Plataforma coordena             | Melhorar descritivo de cobrança/recebos            |
| Not as described / Not provided | Provider (prioritário)                    | Provider pode arcar (política interna) | Provider + Plataforma           | Mediação; refund parcial/total conforme evidências |
| Duplicate charge                | Plataforma reembolsa                      | Taxas podem não ser reembolsadas       | Plataforma                      | Correção imediata; prevenção com idempotência      |
| Cancelamento pré-execução       | Plataforma via escrow                     | Mínimas                                | Plataforma                      | Automático; comunicação às partes                  |
| Pós-dispute (perda)             | Plataforma                                | Stripe disputa + valor                 | Plataforma                      | Registrar, ajustar política de risco               |

Notas:

- Esta matriz é **guideline** operacional, sujeita a **validação jurídica**.
- Em **escrow**, decisões antes da conclusão do job reduzem exposição a disputes.

---

## 🛰️ 5. Eventos Stripe Envolvidos

| Evento                   | Ação Operacional                  | Log                     | Alerta                        | Decisão Financeira                |
| ------------------------ | --------------------------------- | ----------------------- | ----------------------------- | --------------------------------- |
| `charge.refunded`        | Confirmar razão, comunicar partes | INFO: refund emitido    | 🟡 Médio se volume ↑          | Ajuste de saldo/comissão          |
| `charge.dispute.created` | Abrir caso, coletar evidências    | WARN: disputa aberta    | 🟠 Alto (SLA resposta 24–48h) | Definir narrativa de defesa       |
| `charge.dispute.updated` | Atualizar status e prazos         | INFO: status/prazos     | 🟡 Médio                      | Ajustar plano de evidências       |
| `charge.dispute.closed`  | Registrar resultado               | INFO/ERROR: ganho/perda | 🔵 Baixo                      | Atualizar métricas/lesson learned |
| `refund.failed`          | Investigar falha                  | ERROR: refund failed    | 🟠 Alto (SLA 24h)             | Reemitir refund/corrigir dados    |

Operacional:

- Todos os eventos → **log estruturado** com `userId`, `accountId`, `chargeId`, `jobId`, `timestamp`.
- Disputes → abrir **runbook** com checklist de evidências.

---

## ⏱️ 6. SLAs e Fluxos de Decisão

- **Resposta Inicial (dispute.created)**: 2 horas (abrir caso + atribuir responsável)
- **Envio de Evidências**: até 48–72 horas, respeitando `due_by` (buffer mínimo 24 horas)
- **Resolução Interna**: 7–30 dias (acompanhar até `closed`)
- **Refund Automático**: 24–48 horas
- **Refund Manual/Parcial**: 3–5 dias úteis
- **Escalação**:
  - 🔴 Crítico: Falhas recorrentes/volume alto → CTO/CEO
  - 🟠 Alto: Padrão de perda em disputes → Produto/Suporte
  - 🟡 Médio: Ajustes de processo → Operações

Decisão:

- **Evidência forte** → defender (reduz indícios de fraude)
- **Evidência fraca** → compor acordo/refund parcial
- **Padrões suspeitos** → bloquear usuário/provider temporariamente (após revisão)

---

## 🛡️ 7. Riscos e Mitigação

### 7.1 Excesso de Chargebacks

- **Risco**: Taxa alta pode afetar conta Stripe
- **Mitigação**: Escrow robusto, KYC reforçado, descrições claras de cobrança, recibos detalhados

### 7.2 Suspensão de Conta Stripe

- **Risco**: Violações/chargebacks recorrentes
- **Mitigação**: Monitoramento de `capability.updated`, documentalidade, auditorias internas

### 7.3 Abuso por Clientes

- **Risco**: Solicitações oportunistas de reembolso
- **Mitigação**: Evidências de execução, política clara de cancelamento, análise por perfil

### 7.4 Abuso por Providers

- **Risco**: Entrega insuficiente, não execução, fraude
- **Mitigação**: Mediação, penalidades progressivas, retenção de valores, bloqueio

### 7.5 Risco Jurídico

- **Risco**: Responsabilidade em casos complexos
- **Mitigação**: Validação jurídica, termos de serviço claros, consentimentos registráveis

---

## 🧭 8. Próximos Passos Técnicos (sem código)

1. **Runbook de Disputes**: Checklist de evidências (fotos, mensagens, cronologia, aceites) e narrativa padrão
2. **Templates**: Respostas a emissores (estrutura, links, anexos)
3. **Cadastro de Casos**: Registro único por disputa (estado, prazos, ações)
4. **Treinamento**: Suporte/Operações para coleta rápida de evidências
5. **Política Interna**: Definir claramente refund parcial, penalidades, bloqueios
6. **Métricas**: Painel de taxa de chargeback, tempo de resposta, taxa de sucesso em defesa
7. **Auditoria**: Revisão mensal de casos perdidos e causas raiz

---

## 📚 Referências

- Stripe Disputes: https://stripe.com/docs/disputes
- Stripe Refunds: https://stripe.com/docs/refunds
- Stripe Connect: https://stripe.com/docs/connect
- Evidence Guidelines: https://stripe.com/docs/disputes/categories

---

## ✍️ Aprovação e Versionamento

**Versão**: 1.0.0  
**Autor**: COPILOT EXECUTOR (Protocolo Supremo v4.0)  
**Revisão Jurídica**: Pendente  
**Status**: 🟡 Pronto para implementação operacional

Notas:

- Este plano é operacional e **não** altera contratos; serve de base para implementação e validação jurídica futura.
