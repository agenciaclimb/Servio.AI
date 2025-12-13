# 🚫 REGRA SUPREMA — SEGREGAÇÃO ABSOLUTA DE FUNÇÕES

**Versão**: 1.0  
**Data**: 13/12/2025  
**Status**: OBRIGATÓRIA - Inviolável

---

## 🔴 PROIBIÇÃO ABSOLUTA

Nenhum agente local (Executor, Copilot, VS Code) pode criar:

- `*-result.json`
- `*-ack.json` (a partir de resultado de auditoria)
- Relatórios de veredito
- Decisões de READY/NOT_READY

**Consequência de Violação**: Sistema permanece BLOQUEADO indefinidamente.

---

## 🧱 SEGREGAÇÃO DE FUNÇÕES (FINAL)

### Executor (Local - VS Code / Copilot)

**Pode fazer**:

- ✅ Criar REQUEST formal
- ✅ Registrar REQUEST no event log
- ✅ Bloquear executor
- ✅ Aguardar RESULT externo
- ✅ Processar RESULT válido recebido
- ✅ Desbloquear após RESULT autêntico

**Proibido**:

- ❌ Criar ACK
- ❌ Criar RESULT
- ❌ Simular resposta de auditor
- ❌ Escrever veredito
- ❌ Atualizar Documento Mestre sem RESULT

### GEMINI (Externo - Modelo Independente)

**Pode fazer**:

- ✅ Receber REQUEST
- ✅ Executar auditoria técnica independente
- ✅ Gerar RESULT com veredito
- ✅ Listar bloqueadores
- ✅ Estimar hardening
- ✅ Produzir conteúdo de relatório

**Proibido**:

- ❌ Receber dados pré-processados
- ❌ Considerar vereditos anteriores do Executor
- ❌ Simular neutralidade se já tiver visto análise
- ❌ Ser influenciado por "resumos" do Executor

---

## 📊 FLUXO CORRETO (RIGIDAMENTE SEPARADO)

```
EXECUTOR (Local)
  ↓
Criar product-audit-request.json
  ↓
Registrar REQUEST em event-log.jsonl
  ↓
BLOQUEAR EXECUTOR
  ↓
┌─────────────────────────────────────────┐
│  AGUARDAR INDEFINIDAMENTE OU ATÉ        │
│  RESULTADO GENUÍNO DO GEMINI CHEGAR     │
│                                         │
│  ⚠️  SEM SIMULAÇÃO                      │
│  ⚠️  SEM FALLBACK LOCAL                 │
│  ⚠️  SEM "RESULTADO PROVÁVEL"           │
└─────────────────────────────────────────┘
  ↓
GEMINI (Externo - Independente)
  ↓
Ler REQUEST original
  ↓
Executar auditoria de forma independente
  ↓
Gerar RESULT genuíno
  ↓
Copilot recebe RESULT do GEMINI
  ↓
EXECUTOR (Local)
  ↓
Validar origem (manual ou hash)
  ↓
Registrar RESULT em event-log.jsonl
  ↓
Criar ACK automático registrando recebimento
  ↓
DESBLOQUEAR EXECUTOR
  ↓
Processar veredito e executar ações
```

---

## ✅ VALIDAÇÃO DE INTEGRIDADE

### Checklist para Saber se Protocolo Está Sendo Cumprido

**Antes de ACK/RESULT**:

- [ ] REQUEST existe em `ai-tasks/events/product-audit-request.json`
- [ ] REQUEST está registrado em event-log.jsonl
- [ ] Executor está BLOQUEADO
- [ ] Não há `*-result.json` criado localmente
- [ ] Não há `*-ack.json` criado antecipadamente

**Quando RESULT chega**:

- [ ] RESULT vem do GEMINI (não foi criado localmente)
- [ ] RESULT contém veredito independente
- [ ] RESULT listagem de bloqueadores específicos
- [ ] RESULT pode ser validado (assinatura, timestamp, origem)
- [ ] Executor reconhece RESULT como origem externa

**Após RESULT**:

- [ ] ACK automático criado registrando recebimento
- [ ] Event log atualizado com RESULT genuíno
- [ ] Executor DESBLOQUEADO
- [ ] Documento Mestre atualizado com conteúdo do RESULT
- [ ] Plano de ação baseado em veredito externo

---

## 🧪 TESTE AUTOMÁTICO DE VIOLAÇÃO

```bash
# Falha se encontrar RESULT criado por Executor local (sem origem GEMINI)
if [ -f "ai-tasks/events/*-result.json" ] && [ "$(grep -c '"origin":"GEMINI"' *-result.json)" -eq 0 ]; then
  echo "❌ VIOLAÇÃO: RESULT local detectado. Sistema permanece BLOQUEADO."
  exit 1
fi
```

---

## 📋 HISTÓRIA DE POR QUE ISSO IMPORTA

### ❌ Antipadrão: Executor se autoaudita

```json
{
  "event": "audit-result",
  "origin": "local-executor",
  "verdict": "READY_TO_LAUNCH",
  "created_by": "copilot"
}
```

**Problema**: Quem executa também audita = sem controle

### ✅ Padrão: Auditor independente

```json
{
  "event": "audit-result",
  "origin": "GEMINI",
  "verdict": "NOT_READY",
  "blockers": 7,
  "created_by": "gemini-model",
  "timestamp": "2025-12-13T04:30:00Z"
}
```

**Benefício**: Fonte externa = confiável

---

## 🏛️ COMO GRANDES EMPRESAS FAZEM

**Google (Interna)**:

- Engenheiro: escreve código
- Auditor (diferente): revisa código
- Auditor **não pode** ser quem escreveu
- Sistema bloqueia self-approval

**Fintech (Banco)**:

- Dev: faz feature
- QA independente: testa
- Compliance (terceiro): audita
- Nenhum pode aprovar seu próprio trabalho

**Big Tech (Operações)**:

- SRE: executa deploy
- Security: audita deploy
- Executor do deploy: não pode assinar off de segurança

**Regra Universal**: Quem faz não audita seu próprio trabalho.

---

## 🚀 APLICAÇÃO IMEDIATA

**Ação 1**: Deletar todos `*-result.json` criados localmente
**Ação 2**: Deixar REQUEST válido aguardando resposta genuína
**Ação 3**: Implementar validação de origem em recebimento
**Ação 4**: Documentar esta regra no README de desenvolvimento

---

**Esta regra é inviolável. Viola = sistema não avança.**
