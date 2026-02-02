# PROTOCOLO SERVIO UNIFICADO

## Governança de Execução e Anti-Alucinação

**Versão**: 1.0.0  
**Data**: 02/02/2026  
**Modelo Base**: HADA Production Protocol  
**Status**: ATIVO

---

## 🎯 PRINCÍPIO FUNDAMENTAL

> **"SEM EVIDÊNCIA EXECUTÁVEL, NÃO EXISTE PRONTO"**

Toda afirmação de conclusão, prontidão ou sucesso DEVE ser acompanhada de:

- Comandos executados
- Outputs reais
- Arquivos alterados
- Logs ou prints (quando aplicável)

**Consequência da violação**: Rejeição automática do status.

---

## ⚠️ ANTI-ALUCINAÇÃO OPERACIONAL

### PALAVRAS PROIBIDAS (Status Sem Evidência)

As seguintes expressões estão **PROIBIDAS** sem evidência executável:

❌ "pronto"  
❌ "finalizado"  
❌ "100%"  
❌ "ok"  
❌ "resolvido"  
❌ "completo"  
❌ "funcionando"  
❌ "implementado com sucesso"  
❌ "testado"  
❌ "validado"

### RESPOSTA PADRÃO OBRIGATÓRIA

Se não houver evidência executável, responda EXATAMENTE:

```
STATUS: NOT READY
MOTIVO: NÃO POSSO CONFIRMAR. EVIDÊNCIA AUSENTE.
AÇÃO NECESSÁRIA: [descrever o que precisa ser executado]
```

---

## 📊 FORMATO OBRIGATÓRIO DE STATUS

Todo reporte de progresso DEVE seguir este formato:

```markdown
STATUS: <READY | NOT READY | READY WITH RISK | BLOCKED>

EVIDÊNCIAS:

- Comando: [comando executado]
  Output: [saída real ou resumo]
- Arquivo: [caminho]
  Alteração: [o que mudou]
- Teste: [qual teste]
  Resultado: [passou/falhou com output]

RISCOS IDENTIFICADOS:

- [risco 1 com severidade]
- [risco 2 com severidade]

PRÓXIMO PASSO RECOMENDADO:

- [objetivo mensurável]
```

### Definição de Status

| Status              | Significado                         | Requer                  |
| ------------------- | ----------------------------------- | ----------------------- |
| **NOT READY**       | Não pode ser usado em produção      | Bloqueio de deploy      |
| **READY WITH RISK** | Funcional mas com riscos conhecidos | Aprovação humana        |
| **READY**           | Pronto para produção sem ressalvas  | Evidências completas    |
| **BLOCKED**         | Não pode prosseguir sem intervenção | Ação externa necessária |

---

## 🛡️ MATRIZ DE RISCO

### Classificação de Severidade

| Nível      | Critério                              | Exemplos                                     | Ação Obrigatória                   |
| ---------- | ------------------------------------- | -------------------------------------------- | ---------------------------------- |
| **HIGH**   | Quebra produção ou vazamento de dados | Auth bypass, SQL injection, secrets expostos | BLOQUEIO IMEDIATO + Revisão humana |
| **MEDIUM** | Degrada experiência ou performance    | Cache incorreto, timeout alto, UX ruim       | Aprovação humana antes de merge    |
| **LOW**    | Melhoria futura ou risco teórico      | Log excessivo, código duplicado              | Pode prosseguir com documentação   |

### Regra de Aprovação Humana

**MEDIUM ou HIGH** → Deploy bloqueado até:

1. Aprovação explícita de 1 humano (MEDIUM)
2. Aprovação explícita de 2 humanos (HIGH)

**Registro obrigatório**:

```markdown
APROVAÇÃO HUMANA:

- Responsável: [nome]
- Data: [YYYY-MM-DD HH:mm]
- Justificativa: [por que aprovar mesmo com risco]
```

---

## ✅ CHECKLIST DE VALIDAÇÃO (Copiável)

Antes de declarar STATUS = READY:

```markdown
## CHECKLIST PRÉ-DEPLOY

### Código

- [ ] Sem TODO/FIXME em código crítico (auth, payments, data access)
- [ ] Sem console.log/debugger em produção (exceto logs estruturados)
- [ ] Sem mocks ativos (USE_MOCK=false validado)
- [ ] Sem bypass de autenticação
- [ ] Sem secrets hardcoded

### Testes

- [ ] `npm run typecheck` - PASSOU
- [ ] `npm run lint` - PASSOU (ou warnings < 1000)
- [ ] `npm test` - PASSOU (coverage ≥ 45%)
- [ ] `npm run build` - PASSOU (sem erros)

### Segurança

- [ ] Truth-Gate executado - PASSOU
- [ ] Secrets validados (nenhum leak detectado)
- [ ] Dependências auditadas (`npm audit` - zero critical/high)

### Integração

- [ ] Backend respondendo (health check OK)
- [ ] Firebase conectado (auth + firestore OK)
- [ ] Stripe configurado (test/live key correto)

### Deploy

- [ ] Build gerado em `dist/`
- [ ] Firebase Hosting deployado
- [ ] URL produção acessível
- [ ] Smoke test manual executado

### Evidências

- [ ] Comandos documentados
- [ ] Outputs capturados
- [ ] Screenshots (se aplicável)
```

---

## 🚨 GATILHOS DE BLOQUEIO AUTOMÁTICO

O sistema DEVE bloquear deploy se detectar:

### Crítico (Bloqueio Imediato)

- `process.env` com valores hardcoded (não em `.env`)
- `TODO: SECURITY`, `FIXME: AUTH` em código ativo
- `USE_MOCK = true` em ambiente de produção
- `auth.skip()`, `bypassAuth()` em rotas protegidas
- Endpoint com `/fake`, `/mock`, `/test` em produção
- `DROP TABLE`, `DELETE FROM` sem `WHERE` em migrations

### Alto (Bloqueio com Revisão)

- Coverage < 45%
- Lint warnings > 1000
- Build warnings críticos do Vite
- Dependências com vulnerabilidades HIGH/CRITICAL

### Médio (Aviso + Documentação)

- TODO/FIXME em código não-crítico
- Funções > 100 linhas
- Arquivos > 500 linhas
- Duplicação de código > 20%

---

## 🔒 COMANDOS DE VALIDAÇÃO OBRIGATÓRIOS

Antes de qualquer deploy para produção, executar sequencialmente:

```bash
# 1. Validação de código
npm run typecheck
npm run lint:ci

# 2. Testes
npm test

# 3. Truth-Gate (detecção de anti-padrões)
npm run truth-gate

# 4. Build
npm run build

# 5. Secrets audit
npm run guardrails:audit
```

**Se qualquer comando falhar** → STATUS = NOT READY

---

## 📐 PADRÃO DE COMMIT

Formato obrigatório:

```
<tipo>: [escopo] descrição breve (sem ponto final)

Evidências:
- Comando executado: <comando>
- Resultado: <passou/falhou>
- Arquivos alterados: <lista>

Status: <READY | READY WITH RISK>
Risco: <LOW | MEDIUM | HIGH>
```

**Tipos permitidos**:

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração sem mudança de comportamento
- `test`: Adição/modificação de testes
- `docs`: Apenas documentação
- `chore`: Manutenção (deps, config, etc.)

---

## 🎯 OBJETIVO FINAL

Este protocolo garante que:

1. **Não há regressões silenciosas** (evidências obrigatórias)
2. **Não há alucinação operacional** (status controlado)
3. **Não há deploy inseguro** (truth-gate + checklist)
4. **Não há ambiguidade** (formato padronizado)

---

## 📚 REFERÊNCIAS

- Documento Mestre: `DOCUMENTO_MESTRE_SERVIO_AI.md`
- Truth-Gate: `scripts/truth-gate.mjs`
- Checklist Deploy: `DEPLOY_CHECKLIST.md`
- CI Workflow: `.github/workflows/ci.yml`

---

**ÚLTIMA ATUALIZAÇÃO**: 02/02/2026  
**PRÓXIMA REVISÃO**: 02/03/2026  
**RESPONSÁVEL**: Equipe Servio.AI
