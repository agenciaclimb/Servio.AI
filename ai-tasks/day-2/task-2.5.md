# Servio.AI – Task 2.5

**Dia:** 2  
**Área:** Phase 4 - AI Autopilot & Marketplace Matching  
**Fonte:** gemini  
**Prioridade:** 🟡 MEDIUM  
**Labels sugeridas:** orchestrator, gemini, task, testing, backend, unit-test, marketplace-matching

---

## 🎯 Título da Task

Testing: Criar Testes de Unidade para o Novo Endpoint 'trigger-matching'

---

## 🧩 Objetivo

Descrever de forma técnica o que deve ser implementado, sempre em um único Pull Request atômico.

Esta task foi gerada pelo **gemini** no modo Arquiteto A+, e deve ser implementada pelo **Copilot** seguindo exatamente as especificações abaixo.

---

## 📋 Descrição Técnica (vinda do gemini)

Adicionar um novo arquivo de teste em `backend/tests/routes/jobs.test.js`. O teste deve usar um mock do Firestore para simular a requisição ao endpoint POST `/api/v2/jobs/{jobId}/trigger-matching`. Validar se o status do job é corretamente atualizado para 'in_progress' e se a API retorna o status 200 com a resposta esperada.

---

## ✅ Critérios de Aceitação (para o PR)

- ✅ A implementação deve focar **APENAS** nesta task (2.5), sem misturar com outras
- ✅ Todos os testes existentes devem continuar passando
- ✅ Se necessário criar novos testes, eles devem ser claros e focados no comportamento descrito
- ✅ O PR deve descrever claramente o que foi feito, quais arquivos foram alterados e como testar
- ✅ Seguir os padrões de código já estabelecidos no projeto (TypeScript, ESLint, Prettier)
- ✅ Documentar funções públicas e interfaces conforme JSDoc/TSDoc
- ✅ Não introduzir warnings ou erros de lint

---

## 🧠 Instrução para o Copilot

> **"Copilot, implemente a Task 2.5 descrita neste arquivo.**  
> **Crie um Pull Request separado com um commit focado nessa task, seguindo os critérios de aceitação e sem alterar outras partes do sistema fora do necessário."**

---

## 📚 Contexto Adicional

Esta task faz parte do **Dia 2** da área de **Phase 4 - AI Autopilot & Marketplace Matching**.

**Fluxo de trabalho:**

1. 🔵 **Gemini (Arquiteto)** → Gerou esta task em JSON
2. 🟧 **Orchestrator** → Criou este arquivo e a issue vinculada
3. 🟣 **Copilot (Executor)** → Implementa seguindo este documento
4. 🔴 **Gemini (Auditor)** → Revisa o PR antes do merge

---

## 🔗 Links Úteis

- [DOCUMENTO_MESTRE](../../../doc/DOCUMENTO_MESTRE_SERVIO_AI.md)
- [Guia de Contribuição](../../../CONTRIBUTING.md)
- [API Endpoints](../../../API_ENDPOINTS.md)

---

**Gerado automaticamente pelo Servio.AI Orchestrator v1.0**  
**Data:** 2025-12-10
