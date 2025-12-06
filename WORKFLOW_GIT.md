# 🔄 Workflow Git - Servio.AI

## Guia Rápido: IDX ↔ Local ↔ GitHub

Este documento explica como manter o código sincronizado entre **Google IDX**, **Local (VS Code)** e **GitHub**.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Script de Automação](#script-de-automação)
3. [Workflows por Cenário](#workflows-por-cenário)
4. [Resolução de Conflitos](#resolução-de-conflitos)
5. [Best Practices](#best-practices)
6. [FAQ](#faq)

---

## 🎯 Visão Geral

### Ferramentas e Capacidades

| Ferramenta            | Pode Fazer                                                                                            | Não Pode Fazer                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Google IDX Gemini** | ✅ Ler arquivos<br>✅ Criar arquivos<br>✅ Editar código<br>✅ Propor mudanças                        | ❌ Executar `git commit`<br>❌ Executar `git push`<br>❌ Executar `npm`/`node` |
| **Local VS Code**     | ✅ Desenvolvimento completo<br>✅ Terminal PowerShell<br>✅ Git integrado<br>✅ Scripts automatizados | -                                                                              |
| **GitHub**            | ✅ Repositório central<br>✅ CI/CD<br>✅ Pull Requests<br>✅ Code Review                              | -                                                                              |

### Fluxo de Dados

```
┌──────────────┐                  ┌──────────────┐                  ┌──────────────┐
│  Google IDX  │                  │    GitHub    │                  │ Local VS Code│
│              │                  │              │                  │              │
│  Gemini AI   │ ──────pull──────>│  Repository  │<─────pull─────── │  Development │
│  edita código│                  │    (main)    │                  │  + Scripts   │
│              │<──manual commit─>│              │<─automated push─>│              │
└──────────────┘                  └──────────────┘                  └──────────────┘
      ↑                                  ↑                                  ↑
      │                                  │                                  │
      └──────────────────────────────────┴──────────────────────────────────┘
                         Sincronização manual necessária
```

---

## 🤖 Script de Automação

### Instalação

O script `sync-servio.ps1` já está criado na raiz do projeto.

```powershell
# Tornar executável (necessário apenas uma vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verificar se funciona
.\sync-servio.ps1 -Mode Status
```

### Modos de Uso

#### 1️⃣ Sync Completo (Recomendado)

```powershell
.\sync-servio.ps1
```

**O que faz:**

1. ✅ Puxa últimas mudanças do GitHub (`git pull`)
2. ✅ Mostra arquivos modificados localmente
3. ✅ Pergunta se quer commitar e fazer push
4. ✅ Cria commit com mensagem interativa
5. ✅ Faz push para GitHub

**Quando usar:** Início/fim de cada sessão de desenvolvimento

---

#### 2️⃣ Apenas Pull

```powershell
.\sync-servio.ps1 -Mode Pull
```

**O que faz:**

- Busca e aplica mudanças do GitHub sem commitar nada local

**Quando usar:**

- Antes de começar a trabalhar
- Depois que Gemini fez edições no IDX e você fez push lá
- Para pegar mudanças de outros devs

---

#### 3️⃣ Apenas Push

```powershell
.\sync-servio.ps1 -Mode Push -Message "feat: nova funcionalidade X"
```

**O que faz:**

- Commita mudanças locais e faz push direto

**Quando usar:**

- Quando você sabe exatamente o que mudou
- Para commits rápidos

---

#### 4️⃣ Apenas Status

```powershell
.\sync-servio.ps1 -Mode Status
```

**O que faz:**

- Mostra arquivos modificados
- Mostra quantos commits à frente/atrás do GitHub

**Quando usar:**

- Para verificar estado antes de decisões
- Para ver o que mudou

---

## 🔄 Workflows por Cenário

### Cenário 1: Desenvolvimento 100% Local

```powershell
# Início do dia
.\sync-servio.ps1 -Mode Pull

# Editar arquivos no VS Code
# ...

# Fim do dia (ou após cada feature)
.\sync-servio.ps1
```

---

### Cenário 2: Gemini no IDX + Local

#### **No Google IDX (após Gemini editar código):**

```bash
# Terminal do IDX (Bash/Zsh)
git status                           # Ver o que mudou
git add .                           # Adicionar tudo
git commit -m "feat: feature X"     # Commitar
git push origin main                # Push para GitHub
```

#### **No Local (VS Code):**

```powershell
# Pegar mudanças que Gemini fez
.\sync-servio.ps1 -Mode Pull

# Continuar desenvolvimento local...

# Ao terminar, enviar de volta
.\sync-servio.ps1
```

---

### Cenário 3: Feature Branches (Recomendado)

#### **Criar branch para feature nova:**

```powershell
# Local ou IDX
git checkout -b feature/nome-da-feature
```

#### **Desenvolver na branch:**

```powershell
# Editar código...

# Commitar
git add .
git commit -m "feat: implementa X"

# Push da branch
git push origin feature/nome-da-feature
```

#### **Criar Pull Request:**

1. Ir no GitHub: https://github.com/agenciaclimb/Servio.AI/pulls
2. Clicar "New Pull Request"
3. Base: `main` ← Compare: `feature/nome-da-feature`
4. Preencher descrição
5. Request review (opcional)
6. Merge quando aprovado

#### **Após merge, voltar pra main:**

```powershell
git checkout main
.\sync-servio.ps1 -Mode Pull
git branch -d feature/nome-da-feature  # Deletar branch local
```

---

## ⚠️ Resolução de Conflitos

### O que são conflitos?

Acontecem quando:

- Você edita um arquivo localmente
- Outra pessoa (ou Gemini no IDX) edita o mesmo arquivo
- Ambos fazem push para GitHub

### Como resolver:

#### 1. Detectar conflito

```
$ .\sync-servio.ps1 -Mode Pull

❌ ERRO durante o pull:
⚠️  CONFLITOS DE MERGE DETECTADOS!
   Arquivo: src/App.tsx
```

#### 2. Abrir arquivo conflitante no VS Code

Você verá marcações assim:

```typescript
<<<<<<< HEAD
// Seu código local
const version = "3.0.0";
=======
// Código do GitHub (vindo do IDX)
const version = "3.1.0";
>>>>>>> origin/main
```

#### 3. Escolher versão

No VS Code:

- Clique em **"Accept Current Change"** (manter seu código)
- Clique em **"Accept Incoming Change"** (usar código do GitHub)
- Clique em **"Accept Both Changes"** (mesclar ambos)
- Ou edite manualmente

#### 4. Finalizar merge

```powershell
git add src/App.tsx              # Marcar como resolvido
git commit -m "merge: resolve conflict in App.tsx"
git push origin main
```

---

## ✅ Best Practices

### 1. **Sempre Pull Antes de Começar**

```powershell
# PRIMEIRA coisa ao abrir VS Code/IDX
.\sync-servio.ps1 -Mode Pull
```

**Por quê:** Evita conflitos e trabalha com código mais atualizado.

---

### 2. **Commits Frequentes e Pequenos**

```powershell
# ❌ Errado: 1 commit gigante no fim do dia
git commit -m "muitas coisas"

# ✅ Certo: commits incrementais
git commit -m "feat: adiciona botão de filtro"
git commit -m "fix: corrige validação de email"
git commit -m "style: melhora layout do header"
```

**Por quê:** Facilita code review, revert de bugs, e entendimento do histórico.

---

### 3. **Mensagens de Commit Semânticas**

Formato: `<tipo>: <descrição>`

**Tipos:**

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (não muda lógica)
- `refactor:` Refatoração de código
- `test:` Adiciona/corrige testes
- `chore:` Manutenção (configs, deps)

**Exemplos:**

```
✅ feat: adiciona dashboard de analytics
✅ fix: corrige erro 500 em scheduler endpoint
✅ docs: atualiza README com novos comandos
✅ refactor: extrai lógica de auth para middleware
```

---

### 4. **Use Branches para Features Grandes**

```powershell
# Para features que levam >1 dia ou são experimentais
git checkout -b feature/phase4-ai-autopilot

# Desenvolve...
git commit -m "feat: implementa recomendações AI"

# Push da branch
git push origin feature/phase4-ai-autopilot

# Cria PR no GitHub para review
```

**Por quê:** Protege `main` de código instável e permite code review.

---

### 5. **Mantenha .gitignore Atualizado**

Arquivo `.gitignore` já configurado com:

- `node_modules/`
- `.env*` (segredos)
- `.idx/` (arquivos do Google IDX)
- `coverage/`, `dist/`, `build/`

**Verificar se algo está sendo commitado indevidamente:**

```powershell
.\sync-servio.ps1 -Mode Status
```

Se ver arquivos como `.env` ou `node_modules`, adicione ao `.gitignore`!

---

### 6. **Sincronize IDX Manualmente**

**Lembre-se:** Gemini NÃO faz commit/push automático!

Após Gemini editar arquivos no IDX:

```bash
# Terminal do Google IDX
git status
git add .
git commit -m "feat: [descrever mudanças do Gemini]"
git push origin main
```

Depois, no Local:

```powershell
.\sync-servio.ps1 -Mode Pull
```

---

## ❓ FAQ

### P: E se eu esquecer de fazer pull antes de editar?

**R:** Não tem problema! Quando for fazer push, o Git vai avisar:

```
❌ Push rejeitado - provavelmente há commits remotos novos
```

Basta rodar:

```powershell
.\sync-servio.ps1 -Mode Pull
```

Se houver conflitos, siga a [seção de resolução](#resolução-de-conflitos).

---

### P: Posso usar o script no Google IDX?

**R:** Não diretamente (IDX usa Bash, não PowerShell). Mas os comandos Git são os mesmos:

```bash
# IDX equivalente ao script
git pull origin main
git status
git add .
git commit -m "feat: mensagem"
git push origin main
```

---

### P: E se eu deletar um arquivo sem querer?

**R:** Restaure do Git:

```powershell
# Ver arquivos deletados
git status

# Restaurar arquivo específico
git restore caminho/para/arquivo.tsx

# Restaurar todos deletados
git restore .
```

---

### P: Como desfazer último commit?

**R:** Depende do que quer:

```powershell
# Desfazer commit mas manter mudanças (recomendado)
git reset --soft HEAD~1

# Desfazer commit E descartar mudanças (CUIDADO!)
git reset --hard HEAD~1
```

---

### P: Como ver histórico de commits?

**R:**

```powershell
# Últimos 10 commits
git log --oneline -10

# Commits de hoje
git log --since="midnight" --oneline

# Commits de um arquivo específico
git log --oneline -- backend/src/index.js
```

---

### P: Posso commitar direto na `main`?

**R:**

✅ **Pode** (para fixes pequenos, hotfixes)  
⚠️ **Evite** (para features grandes - use branches)

**Recomendação:**

- Fixes rápidos (<30 min): direto na `main`
- Features (>1h): criar branch, PR, merge

---

## 🆘 Comandos de Emergência

### Descartar TODAS mudanças locais

```powershell
git reset --hard HEAD
git clean -fd
.\sync-servio.ps1 -Mode Pull
```

⚠️ **CUIDADO:** Perde tudo que não foi commitado!

---

### Criar backup antes de mudanças arriscadas

```powershell
git stash push -m "backup antes de [ação]"
# Fazer mudanças...
# Se der ruim:
git stash pop  # Restaura backup
```

---

### Ver diferenças antes de commitar

```powershell
git diff                    # Mudanças não staged
git diff --staged          # Mudanças staged (após git add)
git diff HEAD              # Todas mudanças vs último commit
```

---

## 🎓 Recursos Adicionais

- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf
- **Conventional Commits:** https://www.conventionalcommits.org/
- **GitHub Flow:** https://docs.github.com/en/get-started/quickstart/github-flow

---

**Última Atualização:** 05/12/2025  
**Mantido por:** Servio.AI Team  
**Dúvidas:** Consulte este documento ou pergunte ao GitHub Copilot no VS Code
