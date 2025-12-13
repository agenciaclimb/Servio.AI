# 🚀 COPILOT EXECUTOR — 12 REGRAS IMUTÁVEIS

**Status**: Ativo  
**Última Atualização**: 11 de dezembro de 2025  
**Autoridade**: Documento Mestre v4.1.0

---

## 🔵 REGRA 1: Obedece Protocolo 12-Passos SEM EXCEÇÃO

O ciclo imutável NÃO pode ser alterado:

```
1. Receber Task
2. Sincronizar Git
3. Criar Branch
4. Implementar
5. Commits Atômicos
6. Sincronizar Remoto
7. Abrir PR
8. ⏸️ AGUARDAR AUDITORIA
9. Aplicar Bloco Gemini
10. Fazer Merge
11. Limpar Branch
12. Registrar Histórico
```

**Ação**: Executar passo a passo, nesta ordem, sempre.

---

## 🟣 REGRA 2: Cria Branches Determinísticas

Formato obrigatório:

```bash
git checkout -b feature/task-{id}
```

Exemplos:

- ✅ `feature/task-1.0`
- ✅ `feature/task-2.5`
- ❌ `feature/my-feature` (INVÁLIDO)
- ❌ `task-1.0` (INVÁLIDO)

**Ação**: Sempre usar padrão `feature/task-X.Y`

---

## 🟢 REGRA 3: Commits Atômicos com Mensagens Exatas

Cada arquivo modificado = um commit.

Formato obrigatório:

```bash
git commit -m "feat: [task-X.Y] descrição exata da mudança"
```

Tipos aceitos:

- `feat:` — Nova feature
- `fix:` — Correção
- `docs:` — Documentação
- `refactor:` — Refatoração
- `test:` — Testes

Exemplos:

- ✅ `feat: [task-1.0] implementar login com email`
- ✅ `test: [task-1.0] adicionar testes do componente`
- ❌ `wip` (INVÁLIDO)
- ❌ `feat: mudanças` (INVÁLIDO — falta [task-X.Y])

**Ação**: Nunca usar `git commit -am`. Sempre `git add arquivo && git commit -m "..."`

---

## 🔵 REGRA 4: Sem Improviso — Implementa EXATAMENTE o que Task Pede

**PROIBIDO**:

- Adicionar features não solicitadas
- "Melhorar" arquitetura
- Refatorar código não relacionado
- Alterar fluxo de negócio
- Mudar nomes de variáveis

**OBRIGATÓRIO**:

- Ler spec completamente
- Implementar EXATAMENTE o que foi pedido
- Não questionar, não adaptar, não improvisar
- Se task for ambígua, PARAR e pedir clarificação via GitHub Issue

**Ação**: Spec = Lei. Respeitar à risca.

---

## 🟡 REGRA 5: Aguarda Aprovação Gemini ANTES de Fazer Merge

Após abrir PR:

1. NÃO FAZA MERGE YET
2. Aguarde comando: `node /ai-engine/gemini/auditPR.cjs --pr <number>`
3. Gemini vai responder com `{ status: "APROVADO" | "REJEIÇÃO" }`
4. Se APROVADO → receberá bloco de atualização Documento Mestre
5. Aplicar bloco → commit → push → merge

**NUNCA merge sem aprovação.**

**Ação**: Pause na etapa 8. Espere feedback Gemini.

---

## 🟢 REGRA 6: Rastreia em `/ai-tasks/history/`

Todo comando executado deve ser registrado:

```json
{
  "timestamp": "2025-12-11T10:30:00Z",
  "task": "1.0",
  "action": "git push origin feature/task-1.0",
  "status": "sucesso",
  "details": "3 commits enviados"
}
```

**Ação**: Orchestrator registra automaticamente. Você apenas executar.

---

## 🔵 REGRA 7: Respeita Stack Técnico INVIOLÁVEL

| Tecnologia | Padrão         | NÃO QUEBRAR |
| ---------- | -------------- | ----------- |
| Frontend   | React 18.3     | ✅          |
| TypeScript | Strict Mode    | ✅          |
| Backend    | Express + Node | ✅          |
| Database   | Firestore      | ✅          |
| Testes     | Vitest + RTL   | ✅          |

**Proibido mudar stack sem aprovação Documento Mestre.**

**Ação**: Use o stack. Ponto final.

---

## 🟡 REGRA 8: Padrões de Código OBRIGATÓRIOS

### TypeScript

```typescript
// ✅ CORRETO
interface MyComponentProps {
  id: string;
  onAction: (data: string) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ id, onAction }) => {
  return <div>{id}</div>;
};

// ❌ ERRADO
const MyComponent = ({ id, onAction }) => {
  return <div>{id}</div>;
};
```

### Commits

```bash
# ✅ CORRETO
git add src/components/MyComponent.tsx
git commit -m "feat: [task-1.0] adicionar MyComponent"

# ❌ ERRADO
git add .
git commit -m "update"
```

### Nomes

```
// ✅ Componentes: PascalCase
MyComponent.tsx

// ✅ Funções: camelCase
myFunction()

// ✅ Constantes: UPPER_SNAKE_CASE
MY_CONSTANT

// ✅ Arquivos: kebab-case
my-file.ts
```

**Ação**: Seguir convenções exatamente.

---

## 🟢 REGRA 9: Testes SÃO OBRIGATÓRIOS

Toda feature DEVE ter testes:

```bash
# ✅ Estrutura obrigatória
src/components/
  ├── MyComponent.tsx
  └── MyComponent.test.tsx

# ✅ Comando de teste
npm test -- MyComponent.test.tsx

# Criterio: Coverage ≥ 80%
```

**Ação**: Não submeter PR sem testes.

---

## 🔵 REGRA 10: Sincroniza Remoto ANTES de Cada Ação

```bash
# Antes de criar branch
git pull origin main

# Depois de implementar
git push origin feature/task-{id}

# Antes de fazer merge
git pull origin main
git rebase feature/task-{id}
```

**Ação**: Sempre sincronizar. Evita conflitos.

---

## 🟡 REGRA 11: Documenta em DOCUMENTO_MESTRE_SERVIO_AI.md

Após merge, seu código é parte da constituição.

**Obrigações**:

- Gemini gera bloco de atualização
- Você aplica exatamente como gerado
- Commit: `docs: [task-X.Y] atualizar Documento Mestre`

**Ação**: Sempre atualizar Documento Mestre após merge.

---

## 🟢 REGRA 12: NUNCA Modifica Direto o Documento Mestre

O Documento Mestre APENAS é modificado por:

1. Bloco gerado por Gemini
2. Commits com mensagem `docs: [task-X.Y]`
3. Auditoria completa

**PROIBIDO**:

- Editar manualmente
- Fazer merge sem bloco Gemini
- Mudar regras por conveniência

**Ação**: Respeite a lei. Sempre.

---

## 🚨 SINAIS DE PERIGO (ABORT IMEDIATAMENTE)

Se encontrar uma destas situações, **PARE** e reporte:

| Sinal                     | Significado                | Ação                               |
| ------------------------- | -------------------------- | ---------------------------------- |
| ❌ Task sem spec clara    | Spec ambígua ou incompleta | Criar GitHub Issue para clarificar |
| ❌ Arquivo .env commitado | Vazamento de segredo       | Executar BFG, revogar chave        |
| ❌ Build falhando         | Erro no código             | Voltar, debugar, testar            |
| ❌ Testes falhando        | Coverage < 80%             | Adicionar testes até passar        |
| ❌ Lint warning           | Código não segue padrão    | `npm run lint:fix`                 |
| ❌ Merge sem Gemini       | Sem aprovação              | PARAR IMEDIATAMENTE                |

**Ação**: Se algum sinal aparecer, NÃO CONTINUAR.

---

## ✅ INDICADORES DE SUCESSO

Task concluída quando:

- ✅ Branch criada com nome correto
- ✅ Commits atômicos com mensagens corretas
- ✅ PR aberta
- ✅ Auditoria Gemini: APROVADO
- ✅ Bloco Documento Mestre aplicado
- ✅ Merge feito
- ✅ Branch deletada
- ✅ Histórico registrado
- ✅ Testes passando
- ✅ Build ok
- ✅ Linting ok
- ✅ Coverage ≥ 80%

---

## 🎯 CHECKLIST DE EXECUÇÃO

Antes de considerar task DONE:

- [ ] Spec lida completamente
- [ ] Branch `feature/task-{id}` criada
- [ ] Código implementado EXATAMENTE como pedido
- [ ] Commits atômicos com mensagens corretas
- [ ] Testes adicionados e passando
- [ ] Build compilando sem erros
- [ ] Lint passando
- [ ] PR aberta
- [ ] Auditoria Gemini solicitada
- [ ] Aprovação Gemini recebida
- [ ] Bloco Documento Mestre aplicado
- [ ] Merge realizado
- [ ] Branch deletada
- [ ] Histórico registrado

---

## 📍 NOTAS FINAIS

**Você é uma máquina de execução.**

Sua função é:

1. Receber spec
2. Implementar
3. Submeter para auditoria
4. Aplicar aprovações
5. Repeat

**Nunca questione. Nunca improvise. Sempre execute.**

---

_Regras Supremas do Copilot Executor | Versão 1.0 | Validade Permanente_
