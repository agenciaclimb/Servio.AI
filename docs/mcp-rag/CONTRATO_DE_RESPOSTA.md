# CONTRATO DE RESPOSTA - MCP/RAG

## Protocolo de Resposta Segura com IA

**Versão**: 1.0.0  
**Data**: 02/02/2026  
**Princípio**: "IA só responde com evidência recuperada"

---

## 🎯 OBJETIVO

Garantir que toda resposta gerada por MCP/RAG seja:

1. **Baseada em contexto recuperado** (não inventada)
2. **Rastreável** (source attribution)
3. **Validável** (humano pode verificar)
4. **Segura** (sem vazamento de dados sensíveis)

---

## ⚠️ ANTI-ALUCINAÇÃO: REGRAS OBRIGATÓRIAS

### REGRA 1: Sem Inferência Não-Baseada em Dados

❌ **PROIBIDO**:

```
Usuário: "Qual o melhor eletricista de SP?"
IA: "João Silva é o melhor eletricista de SP" (sem contexto recuperado)
```

✅ **PERMITIDO**:

```
Usuário: "Qual o melhor eletricista de SP?"
IA: "Com base nas 47 avaliações recuperadas, João Silva tem a maior média (4.9/5).
     Fontes: [avaliação-1, avaliação-2, ...avaliação-47]"
```

### REGRA 2: Resposta "Não Sei" é Obrigatória

Se o RAG não encontrar contexto relevante:

```typescript
if (retrievedDocs.length === 0) {
  return {
    response:
      'Não tenho informações suficientes para responder. Gostaria de fazer uma busca mais ampla?',
    confidence: 0,
    sources: [],
  };
}
```

❌ **NUNCA** inventar resposta quando não há contexto  
✅ **SEMPRE** ser honesto sobre limitações

### REGRA 3: Confiança Mínima (Threshold)

```typescript
const MIN_CONFIDENCE = 0.7; // 70%

if (response.confidence < MIN_CONFIDENCE) {
  return {
    response:
      'Encontrei informações parciais, mas não tenho certeza suficiente. Quer que eu mostre o que encontrei?',
    confidence: response.confidence,
    sources: response.sources,
    warning: 'LOW_CONFIDENCE',
  };
}
```

### REGRA 4: Source Attribution Obrigatória

Toda resposta DEVE incluir:

```json
{
  "response": "João Silva é eletricista há 10 anos e tem 4.9 de média.",
  "sources": [
    {
      "id": "profile-user-123",
      "type": "user_profile",
      "excerpt": "Experiência: 10 anos",
      "relevance": 0.92
    },
    {
      "id": "review-456",
      "type": "review",
      "excerpt": "Avaliação: 5 estrelas",
      "relevance": 0.88
    }
  ],
  "confidence": 0.85
}
```

---

## 📋 FORMATO DE RESPOSTA PADRONIZADO

### Response Object (Backend)

```typescript
interface RAGResponse {
  // Resposta principal
  response: string;

  // Metadados obrigatórios
  confidence: number; // 0.0 - 1.0
  sources: Source[]; // Mínimo 1 fonte

  // Rastreabilidade
  requestId: string;
  timestamp: string;
  model: string; // "gemini-2.0-flash-exp"

  // Flags de segurança
  warning?: 'LOW_CONFIDENCE' | 'PARTIAL_CONTEXT' | 'FILTERED';
  filtered?: boolean; // True se conteúdo sensível foi removido

  // Debug (apenas em dev/staging)
  debug?: {
    retrievalTime: number; // ms
    generationTime: number; // ms
    tokensUsed: number;
    cost: number; // USD
  };
}

interface Source {
  id: string; // ID do documento original
  type: 'user_profile' | 'review' | 'job' | 'service' | 'faq';
  excerpt: string; // Trecho relevante (max 200 chars)
  relevance: number; // 0.0 - 1.0 (score de similaridade)
  url?: string; // Link para fonte (se aplicável)
}
```

### Exemplo Completo

```json
{
  "response": "Encontrei 3 eletricistas disponíveis em São Paulo:\n\n1. **João Silva** (4.9★) - 10 anos de experiência\n2. **Maria Santos** (4.7★) - 5 anos de experiência\n3. **Pedro Oliveira** (4.5★) - 3 anos de experiência\n\nTodos estão disponíveis para atendimento imediato.",

  "confidence": 0.92,

  "sources": [
    {
      "id": "user-123",
      "type": "user_profile",
      "excerpt": "João Silva - Eletricista - SP - 4.9 estrelas",
      "relevance": 0.95,
      "url": "/profile/user-123"
    },
    {
      "id": "user-456",
      "type": "user_profile",
      "excerpt": "Maria Santos - Eletricista - SP - 4.7 estrelas",
      "relevance": 0.89,
      "url": "/profile/user-456"
    },
    {
      "id": "user-789",
      "type": "user_profile",
      "excerpt": "Pedro Oliveira - Eletricista - SP - 4.5 estrelas",
      "relevance": 0.82,
      "url": "/profile/user-789"
    }
  ],

  "requestId": "req-abc123",
  "timestamp": "2026-02-02T10:30:00Z",
  "model": "gemini-2.0-flash-exp",

  "warning": null,
  "filtered": false,

  "debug": {
    "retrievalTime": 234,
    "generationTime": 567,
    "tokensUsed": 1234,
    "cost": 0.0045
  }
}
```

---

## 🛡️ FILTRAGEM DE DADOS SENSÍVEIS

### Dados Proibidos na Resposta

❌ **NUNCA incluir**:

- CPF completo (apenas `***.***.***-12`)
- Senha ou hash de senha
- Token de autenticação
- Número de cartão de crédito
- Endereço completo (apenas bairro/cidade)
- Telefone completo (apenas `(11) ****-1234`)
- Email completo (apenas `j***@***.com`)

### Implementação

```typescript
function sanitizeResponse(response: string): string {
  // CPF
  response = response.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-XX');

  // Telefone
  response = response.replace(/\(\d{2}\)\s?\d{4,5}-\d{4}/g, '(XX) ****-XXXX');

  // Email
  response = response.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '***@***.***');

  // Cartão
  response = response.replace(/\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/g, '**** **** **** XXXX');

  return response;
}
```

---

## 📊 VALIDAÇÃO DE QUALIDADE

### Checklist Pré-Produção

```markdown
## RAG RESPONSE QUALITY CHECK

### Conteúdo

- [ ] Resposta baseada 100% em contexto recuperado
- [ ] Sem alucinações detectadas (verificação manual)
- [ ] Sources attribution presente em todas as respostas
- [ ] Confidence score > 0.7 em 95% das respostas

### Segurança

- [ ] Dados sensíveis filtrados corretamente
- [ ] Sem vazamento de informações privadas
- [ ] Rate limiting implementado (max 10 req/min por usuário)
- [ ] Validação de input contra prompt injection

### Performance

- [ ] Latência p95 < 2s
- [ ] Taxa de erro < 1%
- [ ] Custo por request < $0.01
- [ ] Cache de respostas similares ativo

### Rastreabilidade

- [ ] RequestId único em todas as respostas
- [ ] Logs estruturados salvos no Firestore
- [ ] Audit trail de todas as queries
- [ ] Retention policy configurada (90 dias)
```

---

## 🚨 CASOS DE EMERGÊNCIA

### Cenário 1: IA Alucinou (Resposta Falsa)

1. **Detecção**: Usuário reporta ou validação automática
2. **Ação Imediata**:
   ```bash
   npm run killswitch:rag:disable
   ```
3. **Investigação**:
   - Revisar requestId nos logs
   - Verificar fontes utilizadas
   - Identificar falha no retrieval ou generation
4. **Correção**:
   - Ajustar prompt para ser mais conservador
   - Aumentar threshold de confiança
   - Melhorar retrieval (embeddings, chunking)
5. **Validação**: Testar 100 queries similares

### Cenário 2: Vazamento de Dados Sensíveis

1. **Detecção**: Log ou report de usuário
2. **Ação Imediata**:
   ```bash
   npm run killswitch:mcp:disable
   npm run killswitch:rag:disable
   ```
3. **Contenção**:
   - Invalidar todas as respostas em cache
   - Notificar usuários afetados (LGPD)
4. **Correção**:
   - Reforçar filtros de sanitização
   - Adicionar validação extra em sources
5. **Auditoria**: Revisar todos os logs (30 dias)

### Cenário 3: Performance Degradada

1. **Detecção**: Latência > 5s
2. **Ação**: Ativar fallback (resposta sem RAG)
3. **Investigação**:
   - Verificar tamanho do contexto
   - Analisar query complexity
4. **Correção**:
   - Implementar cache agressivo
   - Reduzir número de documentos recuperados
   - Otimizar embeddings

---

## 📐 EXEMPLO DE IMPLEMENTAÇÃO

### Backend Route

```typescript
// backend/src/routes/rag.ts
router.post('/api/rag/query', requireAuth, async (req, res) => {
  const { query, userId } = req.body;
  const requestId = uuidv4();

  try {
    // 1. Validar input
    if (!query || query.length > 500) {
      return res.status(400).json({ error: 'Query inválida' });
    }

    // 2. Check kill switch
    if (await isRAGDisabled()) {
      return res.json({
        response: 'Funcionalidade temporariamente indisponível',
        confidence: 0,
        sources: [],
        warning: 'FEATURE_DISABLED',
      });
    }

    // 3. Retrieve context
    const docs = await retrieveRelevantDocs(query, userId);

    if (docs.length === 0) {
      return res.json({
        response: 'Não encontrei informações relevantes. Tente reformular sua pergunta.',
        confidence: 0,
        sources: [],
        warning: 'NO_CONTEXT',
      });
    }

    // 4. Generate response
    const ragResponse = await generateRAGResponse(query, docs);

    // 5. Validate confidence
    if (ragResponse.confidence < MIN_CONFIDENCE) {
      ragResponse.warning = 'LOW_CONFIDENCE';
    }

    // 6. Sanitize
    ragResponse.response = sanitizeResponse(ragResponse.response);

    // 7. Log
    await logRAGRequest(requestId, query, ragResponse);

    // 8. Return
    res.json({ ...ragResponse, requestId });
  } catch (error) {
    console.error('[RAG ERROR]', error);
    res.status(500).json({
      response: 'Erro ao processar sua pergunta. Tente novamente.',
      confidence: 0,
      sources: [],
      warning: 'INTERNAL_ERROR',
    });
  }
});
```

---

## 🔗 REFERÊNCIAS

- Plano Rollout: `docs/mcp-rag/PLANO_ROLLOUT_MCP_RAG.md`
- Protocolo Supremo: `docs/PROTOCOLO_SERVIO_UNIFICADO.md`
- Documento Mestre: `DOCUMENTO_MESTRE_SERVIO_AI.md`

---

**ÚLTIMA ATUALIZAÇÃO**: 02/02/2026  
**PRÓXIMA REVISÃO**: Antes de ativar RAG  
**RESPONSÁVEL**: Equipe Servio.AI  
**STATUS**: ⚠️ **CONTRATO DEFINIDO - NÃO ATIVADO EM PRODUÇÃO**
