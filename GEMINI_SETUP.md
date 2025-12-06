# 📢 INSTRUÇÕES PARA GEMINI - Sem Limitações!

Cole isto no Google IDX para Gemini ler de uma vez:

---

## 🎯 LEIA ESTES ARQUIVOS (Documentação Completa)

Leia com atenção na seguinte ordem:

1. **INTEGRACAO_VOCE_GEMINI.md** ← COMEÇAR AQUI!
   - Como você e o dev trabalham juntos
   - Workflows possíveis
   - Exemplos práticos

2. **IDX_CONTEXT.md**
   - Stack técnico completo
   - 138 endpoints
   - Collections Firestore
   - Status atual (Fase 3)

3. **DOCUMENTO_MESTRE_SERVIO_AI.md**
   - Documentação técnica completa
   - Padrões de código
   - Conventions críticas
   - Tudo o que você precisa saber

4. **GEMINI_IDX_INSTRUCTIONS.md**
   - Padrões específicos
   - O que fazer/não fazer
   - Checklist pré-commit

5. **API_ENDPOINTS.md**
   - Lista de todos os 138 endpoints
   - Métodos e respostas

---

## ⚡ TL;DR - Resumo Rápido

### ✅ Você Pode Fazer Tudo

```
- Ler qualquer arquivo
- Criar novos componentes/serviços
- Editar código existente
- Executar git commands (commit, push, pull)
- Executar npm (test, build, dev)
- Executar gcloud commands
- Fazer deploy
- Tomar decisões arquiteturais
```

### 🔄 Fluxo Principal

```
1. Leia os arquivos acima
2. Edite/crie o que precisar
3. Teste localmente (npm test, npm dev)
4. Commit com mensagem clara: git commit -m "feat: descrição"
5. Push: git push origin main
6. Dev (local) vai puxar suas mudanças com: sa
```

### 💬 Comunicação

Sempre que terminar algo:

```
✅ Implementação completa!

📝 Arquivos criados/editados:
- arquivo1.ts (novo)
- arquivo2.js (editado)
- arquivo3.test.ts (novo)

✅ Status:
- Testes passando localmente
- Sem erros TypeScript
- Endpoints retornando 200 OK

🚀 Próximo passo:
Dev vai fazer: sa (pull) → stest (testar) → sdev (validar local)
```

---

## 🚀 Começe Agora!

Depois de ler os arquivos, responda:

**"Entendi! Pronto para trabalhar em Servio.AI. Qual é a primeira feature que devo implementar?"**

Depois o dev vai dizer o que quer e vocês trabalham juntos!

---

## 📚 Recursos Rápidos

- **Stack**: React 18 + TypeScript (frontend), Node.js 18 (backend)
- **DB**: Firestore (collections em Firebase Console)
- **Deploy**: Cloud Run (backend), Firebase Hosting (frontend)
- **CI/CD**: GitHub Actions (automático em push)
- **Status**: 🟢 Production LIVE (Fase 3 completa)
- **Próximo**: Phase 4 (AI Autopilot + Marketplace Matching)

---

## 🎯 Primeira Tarefa (Exemplo)

Dev vai pedir tipo:

```
"Implemente o endpoint POST /api/phase4/ai-recommendations que:
- Recebe prospectorId e jobId
- Usa Google Gemini para analisar e gerar 3 recomendações
- Salva em collection 'prospector_recommendations'
- Retorna em JSON
Siga os padrões de INTEGRACAO_VOCE_GEMINI.md"
```

Aí você:

1. Cria o service (backend/src/services/aiAutopilotService.js)
2. Cria a rota (backend/src/routes/aiAutopilot.js)
3. Cria os testes
4. Testa: `npm test` + `cd backend && npm start`
5. Commit + Push
6. Dev valida no local

---

**Pronto? Confirme que leu tudo! 🚀**
