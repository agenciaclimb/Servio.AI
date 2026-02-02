# PLANO DE ROLLOUT MCP + RAG

## Model Context Protocol + Retrieval-Augmented Generation

**Versão**: 1.0.0  
**Data**: 02/02/2026  
**Status**: ESTRUTURA PRONTA - **NÃO ATIVADO**  
**Modelo Base**: HADA Shadow Mode Protocol

---

## ⚠️ AVISO CRÍTICO

> **MCP E RAG ESTÃO DESATIVADOS POR PADRÃO**
>
> Não ativar em produção sem:
>
> 1. Shadow mode completo (30 dias)
> 2. Canary interno validado
> 3. Kill switch testado
> 4. Aprovação de 2 humanos

---

## 🎯 OBJETIVO

Preparar infraestrutura segura para:

- **MCP (Model Context Protocol)**: Integração de contexto externo para LLMs
- **RAG (Retrieval-Augmented Generation)**: Geração aumentada por recuperação de dados

**Benefícios Esperados**:

- Respostas da IA com contexto específico do Servio.AI
- Redução de alucinações (IA responde com base em dados reais)
- Melhor matching entre clientes e prestadores
- Análise de sentimento em avaliações

---

## 🚫 REGRA DE ATIVAÇÃO

### Variáveis de Ambiente (DEFAULT = FALSE)

```bash
# Backend (.env)
MCP_ENABLED=false          # Model Context Protocol
RAG_ENABLED=false          # Retrieval-Augmented Generation
MCP_SHADOW_MODE=true       # Quando habilitado, apenas loga sem usar
RAG_SHADOW_MODE=true       # Quando habilitado, apenas loga sem usar

# Frontend (.env)
VITE_MCP_ENABLED=false
VITE_RAG_ENABLED=false
```

### Validação Obrigatória no Código

```typescript
// backend/src/config/features.ts
export const FEATURES = {
  MCP_ENABLED: process.env.MCP_ENABLED === 'true', // DEVE ser explícito
  RAG_ENABLED: process.env.RAG_ENABLED === 'true',
  MCP_SHADOW_MODE: process.env.MCP_SHADOW_MODE !== 'false', // Ativo por padrão
  RAG_SHADOW_MODE: process.env.RAG_SHADOW_MODE !== 'false',
};

// Validação no startup
if (FEATURES.MCP_ENABLED && !FEATURES.MCP_SHADOW_MODE) {
  console.warn('🚨 MCP ATIVO EM PRODUÇÃO - Verificar aprovação');
}
```

---

## 📐 ARQUITETURA SEGURA

### Fase 1: Shadow Mode (30 dias mínimo)

**Objetivo**: Coletar métricas sem impacto em produção

```
Cliente faz request
    ↓
Backend processa NORMAL (sem MCP/RAG)
    ↓
Responde ao cliente
    ↓
[ASYNC] Shadow worker executa MCP/RAG
    ↓
Loga resultado + métricas
    ↓
NÃO afeta usuário
```

**Métricas Coletadas**:

- Latência MCP/RAG vs resposta normal
- Taxa de erro
- Qualidade das respostas (comparação manual)
- Custo por request

**Critérios de Aprovação**:

- [ ] Latência MCP/RAG < 2s (p95)
- [ ] Taxa de erro < 1%
- [ ] 95% das respostas validadas como corretas
- [ ] Custo < $0.01 por request

### Fase 2: Canary Interno (7 dias)

**Objetivo**: Testar com usuários internos controlados

```
Request de usuário interno (flag no perfil)
    ↓
Backend usa MCP/RAG
    ↓
Responde com contexto aumentado
    ↓
[ASYNC] Loga feedback + métricas
```

**Usuários Canary**:

- Equipe de desenvolvimento (5 pessoas)
- QA testers (3 pessoas)
- 2 clientes beta (voluntários, não-produção)

**Critérios de Aprovação**:

- [ ] NPS canary ≥ 8/10
- [ ] Zero bugs críticos reportados
- [ ] Latência aceitável (< 3s p95)
- [ ] Rollback testado com sucesso

### Fase 3: Rollout Gradual (30 dias)

**Objetivo**: Ativar progressivamente para todos

```
Dia 1-7:   1% dos usuários reais
Dia 8-14:  5% dos usuários
Dia 15-21: 10% dos usuários
Dia 22-28: 25% dos usuários
Dia 29-30: 50% dos usuários
Dia 31+:   100% (se métricas OK)
```

**Monitoramento Contínuo**:

- Dashboard Grafana com métricas em tempo real
- Alertas automáticos (latência, erro, custo)
- Revisão diária de logs
- Rollback automático se taxa de erro > 5%

---

## 🛡️ KILL SWITCH

### Implementação Obrigatória

```typescript
// backend/src/middleware/killSwitch.ts
export const killSwitchMiddleware = async (req, res, next) => {
  // Verifica flag no Firestore (atualização em <1s)
  const killSwitch = await getKillSwitchStatus();

  if (killSwitch.MCP_DISABLED) {
    req.mcpEnabled = false;
  }

  if (killSwitch.RAG_DISABLED) {
    req.ragEnabled = false;
  }

  next();
};
```

### Ativação do Kill Switch

```bash
# Via CLI (emergência)
npm run killswitch:mcp:disable
npm run killswitch:rag:disable

# Via Firestore (imediato)
firebase firestore:set /config/killswitch --data '{"MCP_DISABLED": true, "RAG_DISABLED": true}'

# Via script
node scripts/emergency-disable-ai.mjs
```

**Tempo de Propagação**: < 5 segundos (cache invalidation)

---

## 📊 MÉTRICAS OBRIGATÓRIAS

### Logs Estruturados

```json
{
  "timestamp": "2026-02-02T10:30:00Z",
  "feature": "MCP",
  "mode": "shadow",
  "userId": "user-123",
  "requestId": "req-456",
  "input": "preciso de eletricista em SP",
  "output": {
    "mcp_context": ["prestadores em SP", "avaliações recentes"],
    "rag_docs": ["doc-1", "doc-2"],
    "response": "Encontramos 3 eletricistas..."
  },
  "latency_ms": 1234,
  "cost_usd": 0.0045,
  "error": null
}
```

### Dashboard Grafana

**Painéis Obrigatórios**:

1. Latência (p50, p95, p99)
2. Taxa de erro
3. Custo acumulado
4. Requests por feature (MCP/RAG)
5. Comparação shadow vs produção

---

## 🔒 CONTRATO DE SEGURANÇA

### Checklist Pré-Ativação

```markdown
## MCP/RAG PRÉ-ATIVAÇÃO

### Infraestrutura

- [ ] Shadow mode implementado
- [ ] Logs estruturados funcionando
- [ ] Kill switch testado (tempo de desligamento < 5s)
- [ ] Dashboard Grafana configurado
- [ ] Alertas configurados (PagerDuty/Slack)

### Testes

- [ ] 30 dias de shadow mode completos
- [ ] 7 dias de canary interno completos
- [ ] Zero bugs críticos pendentes
- [ ] Rollback testado 3x com sucesso

### Aprovações

- [ ] Aprovação de 2 desenvolvedores seniores
- [ ] Aprovação do product owner
- [ ] Budget aprovado (custo esperado < $X/mês)

### Documentação

- [ ] Runbook de incidente criado
- [ ] Procedimento de rollback documentado
- [ ] Equipe treinada no kill switch
```

---

## 🚨 RUNBOOK DE INCIDENTE

### Cenário 1: Latência Alta (> 5s)

1. **Identificação**: Alerta Grafana disparado
2. **Ação Imediata**: Ativar kill switch
   ```bash
   npm run killswitch:mcp:disable
   ```
3. **Investigação**: Verificar logs de latência
4. **Resolução**: Otimizar query RAG ou reduzir context MCP
5. **Validação**: Reativar em shadow mode

### Cenário 2: Taxa de Erro Alta (> 5%)

1. **Identificação**: Alerta automático
2. **Ação Imediata**: Rollback automático acionado
3. **Investigação**: Analisar stack traces
4. **Resolução**: Fix + deploy + shadow mode
5. **Validação**: Canary interno antes de produção

### Cenário 3: Custo Inesperado

1. **Identificação**: Budget alert AWS/GCP
2. **Ação Imediata**: Kill switch + review de custos
3. **Investigação**: Verificar requests excessivos
4. **Resolução**: Implementar rate limiting
5. **Validação**: Monitorar custos 7 dias

---

## 📅 CRONOGRAMA ESPERADO

| Fase           | Duração | Objetivo                 | Status         |
| -------------- | ------- | ------------------------ | -------------- |
| Estrutura      | 1 dia   | Criar docs + configs     | ✅ READY       |
| Shadow Mode    | 30 dias | Coletar métricas         | ⏳ NOT STARTED |
| Canary Interno | 7 dias  | Validar com equipe       | ⏳ NOT STARTED |
| Rollout 1%     | 7 dias  | Primeiros usuários reais | ⏳ NOT STARTED |
| Rollout 5%     | 7 dias  | Validar escalabilidade   | ⏳ NOT STARTED |
| Rollout 10%    | 7 dias  | Confirmar estabilidade   | ⏳ NOT STARTED |
| Rollout 50%    | 7 dias  | Preparar 100%            | ⏳ NOT STARTED |
| Rollout 100%   | -       | Todos os usuários        | ⏳ NOT STARTED |

**Total Estimado**: 65+ dias (2+ meses)

---

## 🔗 REFERÊNCIAS

- Documento Mestre: `DOCUMENTO_MESTRE_SERVIO_AI.md`
- Contrato de Resposta: `docs/mcp-rag/CONTRATO_DE_RESPOSTA.md`
- Protocolo Supremo: `docs/PROTOCOLO_SERVIO_UNIFICADO.md`
- Kill Switch: `scripts/emergency-disable-ai.mjs` (a criar)
- Configuração: `backend/src/config/features.ts` (a criar)

---

**ÚLTIMA ATUALIZAÇÃO**: 02/02/2026  
**PRÓXIMA REVISÃO**: Antes de ativar Shadow Mode  
**RESPONSÁVEL**: Equipe Servio.AI  
**STATUS ATUAL**: ⚠️ **ESTRUTURA PRONTA - NÃO ATIVADO EM PRODUÇÃO**
