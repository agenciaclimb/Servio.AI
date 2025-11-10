## Plano incremental de testes de frontend (Fase 1)

Objetivo: elevar cobertura >25% linhas focando fluxos críticos (chat, propostas/pagamento, disputa e avaliação), com baixo risco e integração progressiva.

Escopo prioritário (componentes):

- ChatModal: persistência de mensagens, marcação de lidas, integração futura com notifyOnNewMessage.
- PaymentModal: criação de sessão de checkout (Stripe), manejo de estados de carregamento/erro e redirecionamento.
- ReviewModal: submissão de avaliação, atualização do job para “concluído” e recalculo de média no perfil.
- DisputeModal: criação de disputa, anexos e transição para status “em_disputa”.
- ProviderEarningsCard: cálculo de comissão dinâmico (75–85%) e regras de badges.

Fase 1 — unit/integration (RTL + Vitest):

- Renderização básica e acessibilidade (aria roles, foco inicial, teclas de escape).
- Estados de carregamento/erro para ações assíncronas (proposta, checkout, review, disputa).
- Interações mínimas (abrir/fechar modal, submit com validação, toasts/spinners).
- Mock de serviços em `services/api.ts` com validação de payloads.

Casos por componente (mínimos):

- ChatModal
  - Abre/fecha modal e limpa input ao enviar (test.todo, fase 1.1)
  - Renderiza histórico pré-carregado e adiciona nova mensagem (test.todo)
  - Desabilita envio quando texto vazio (test.todo)
  - Exibe erro ao falhar criação de mensagem (test.todo)
- PaymentModal
  - Renderiza com valores e CTA de pagamento (test.todo)
  - Chama `createCheckoutSession` e mostra spinner até redirecionar (test.todo)
  - Exibe erro e reabilita botão em falha (test.todo)
- ReviewModal
  - Valida seleção de estrelas e comentário opcional (test.todo)
  - Chama `POST /reviews` e `updateJob` → “concluído” (test.todo)
  - Exibe confirmação e fecha modal (test.todo)
- DisputeModal
  - Abre com motivo obrigatório; bloqueia submit sem texto (test.todo)
  - Cria disputa via API e atualiza UI (test.todo)
- ProviderEarningsCard
  - Calcula comissão para perfis 75/80/85% com fixtures (test.todo)
  - Exibe badges de acordo com critérios (test.todo)

Fase 2 — E2E (Playwright/Cypress):

- Aceitar proposta → abrir Stripe Checkout (ambiente de teste) → webhook atualiza escrow.
- Chat persistente com novo job → mensagens aparecem para cliente e prestador.
- Abrir disputa e fluxo administrativo básico (skip se escrow não disponível no ambiente).
- Review ao concluir serviço → média refletida no perfil.

Critérios de aceite:

- Suite unit/integration adiciona pelo menos 10–15 casos pendentes (test.todo) sem quebrar build.
- Sem flakiness novo; zero testes falhando.
- Docs indicam como evoluir cada test.todo para casos reais com mocks dos serviços.

# PLANO_TESTES_COMPLETO

## Objetivo

Garantir funcionamento consistente e confiável de todas as jornadas (Cliente, Prestador, Admin) antes de release público.

## Estrutura de Cenários

### 1. Autenticação

- Login cliente (email/senha, Google)
- Login prestador (email/senha, Google)
- Login admin
- Registro cliente
- Registro prestador (verificação pendente)
- Logout (limpa estado + redireciona home)
- Erros: credenciais inválidas, provedor desativado, domínio não autorizado

### 2. Painel do Cliente

- Render inicial sem jobs (skeleton -> estado vazio)
- Criar job via wizard a partir do Hero (prompt texto simples)
- Criar job via assistente flutuante (chat -> "publicar")
- Abrir propostas do job (modo normal)
- Criar leilão (jobMode = leilao) e exibir contagem regressiva
- Chat: enviar mensagens, receber notificação (simulação)
- Agendar serviço (confirmação e mensagem system)
- Finalizar job (review + liberação pagamento)
- Abrir disputa (status em_disputa, escrow em disputa)
- Enviar mensagem em disputa
- Adicionar item mantido (Meus Itens) e sugerir manutenção
- Atualizar perfil (bio > 30 chars) e receber notificação
- Troca de abas (inicio, serviços, itens, ajuda) sem crash

### 3. Painel do Prestador

- Render com jobs recomendados (simulado)
- Enviar proposta para job normal
- Enviar lance para leilão
- Receber notificação de proposta aceita
- Abrir chat e responder
- Atualizar disponibilidade / specialties (se existir UI)
- Ver histórico de serviços concluídos

### 4. Painel do Admin

- Listar usuários pendentes de verificação
- Aprovar prestador
- Ver disputas abertas e alterar status
- Ver alertas de fraude simulados
- Ver métricas (growth, revenue, job creation) carregando sem erro
- Desativar usuário (status)

### 5. Wizard de Criação de Serviço

- Prompt inicial pré-preenchido (landing -> wizard)
- Análise IA (enhanceJobRequest) populando descrição
- Formulário manual (categoria, urgency, serviceType)
- Convite direto a prestador (targetProviderId)
- Leilão (jobMode = leilao + auctionEndDate)
- Erros: backend indisponível, validação faltando category

### 6. Matching & Notificações

- matchProvidersForJob() executa pós criação (modo normal)
- Gera até 5 notificações para prestadores qualificados
- Cliente recebe propostas (simular via API ou mock)
- Marcar notificação como lida individualmente / todas

### 7. Pagamentos / Escrow

- createCheckoutSession() retorna sessionId
- Redirecionamento Stripe (test key)
- updateProposal(status='aceita') + rejeitar outras
- updateJob(status='proposta_aceita', escrowId atribuído)
- releasePayment(jobId) após review -> escrow status liberado

### 8. Disputas

- Abrir disputa (status em_disputa)
- escrow marcado em_disputa
- Enviar mensagem disputas (persistência / UI)
- Resolver disputa (status resolvida) (simulado)

### 9. Chat

- createMessage(chatId, senderId, text)
- System message ao confirmar agendamento
- createNotification para outra parte
- Persistência não duplica mensagens

### 10. Itens Mantidos

- Adicionar item
- Listar itens
- Abrir item (ItemDetailModal)
- Sugerir job a partir do item (onServiceRequest)

### 11. Performance / UX

- Lazy chunks carregam apenas quando necessário (Wizard, modais)
- Nenhum freeze ao navegar entre painéis
- ErrorBoundary captura exceções sem tela branca

### 12. Acessibilidade / SEO (Smoke)

- Títulos presentes
- Meta description dinâmica (se aplicável)
- Estrutura sem headings quebradas nas páginas principais

### 13. Segurança (Smoke)

- Campos edição perfil não permitem XSS simples (<script>)
- Regras: ações críticas (finalizar job, abrir disputa) exigem usuário autenticado

### 14. Logs / Observabilidade

- console.error apenas em erros reais (limpar temporários)
- Sem spam de warnings desnecessários

### 15. Edge Cases

- Conexão lenta (skeleton aparece)
- API 500 ao criar job (mensagem user-friendly)
- Falha IA (fallback tratamento local)
- stripe.redirectToCheckout erro -> alerta amigável

## Metodologia de Execução

Cada cenário marcado como PASS/FAIL em planilha ou no Documento Mestre. Para FAIL: registrar:

- Componente / função
- Passos
- Resultado esperado vs obtido
- Stack trace ou log

## Script Sugerido (Manual)

1. Iniciar backend Cloud Run (ou verificar URL)
2. npm run dev (frontend)
3. Criar usuário admin master: `node scripts/create_admin_master.mjs admin@servio.ai`
4. Executar cenários em ordem por papel
5. Atualizar DOCUMENTO_MESTRE com resultados

## Critério de Aceite Beta

- 0 blockers (tela branca, crashes)
- <= 5 bugs médios documentados com workaround
- Fluxos principais (cliente criar job, prestador enviar proposta, admin aprovar) funcionam

## Próximos Complementos

- Testes e2e Cypress para fluxo cliente → proposta → pagamento → review
- Testes unitários para API helpers (services/api.ts)
- Load test simples (10 jobs simultâneos leilão)
