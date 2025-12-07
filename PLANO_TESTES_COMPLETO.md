# 🎯 PLANO DE TESTES COMPLETO - SERVIO.AI

## 🚨 FILOSOFIA: QUALIDADE É PRIORIDADE ABSOLUTA

**"Só lançamos quando tudo funcionar perfeitamente"**

Este documento descreve a estratégia completa de testes que garante:

- ✅ 100% das funcionalidades testadas
- ✅ Toda a experiência do cliente coberta
- ✅ Todas as páginas e componentes validados
- ✅ Cenários de erro e edge cases contemplados
- ✅ Performance e acessibilidade asseguradas

---

## 📋 ÍNDICE

1. [Jornadas Completas](#jornadas-completas)
2. [Páginas e Componentes](#páginas-e-componentes)
3. [Cenários de Erro](#cenários-de-erro)
4. [Performance e Acessibilidade](#performance-e-acessibilidade)
5. [Cobertura de Código](#cobertura-de-código)
6. [Estratégia de Implementação](#estratégia-de-implementação)
7. [Critérios de Lançamento](#critérios-de-lançamento)

---

## 🎭 JORNADAS COMPLETAS

### 1️⃣ JORNADA DO CLIENTE (end-to-end)

#### 1.1 Cadastro e Autenticação

```typescript
// tests/e2e/client-auth.spec.ts
- [ ] Cadastrar com email/senha
- [ ] Login com credenciais válidas
- [ ] Login com Google (se habilitado)
- [ ] Logout
- [ ] Recuperação de senha
- [ ] Validações: email inválido, senha curta, senhas não coincidem
```

#### 1.2 Perfil e Onboarding

```typescript
// tests/e2e/client-profile.spec.ts
- [ ] Visualizar perfil próprio
- [ ] Editar perfil (nome, endereço, WhatsApp, bio)
- [ ] Adicionar múltiplos endereços
- [ ] Upload de foto de perfil
- [ ] Completar 4 passos do onboarding
- [ ] Indicador de força do perfil (0-100%)
```

#### 1.3 Criar Serviço com IA

```typescript
// tests/e2e/client-create-service.spec.ts
- [ ] Abrir wizard de criação
- [ ] Descrever necessidade (mín. 10 caracteres)
- [ ] IA analisa e sugere categoria/preço
- [ ] Fallback quando IA offline (usar descrição original)
- [ ] Editar descrição sugerida
- [ ] Selecionar categoria manualmente
- [ ] Escolher tipo: personalizado/tabelado/diagnóstico/leilão
- [ ] Definir urgência: hoje/amanhã/3dias/1semana
- [ ] Adicionar endereço do serviço
- [ ] Upload de fotos/vídeos (máx 5 arquivos, 10MB cada)
- [ ] Publicar serviço
- [ ] Ver serviço na lista "Meus Serviços"
```

#### 1.4 Receber e Aceitar Propostas

```typescript
// tests/e2e/client-proposals.spec.ts
- [ ] Notificação quando prestador propõe
- [ ] Ver lista de propostas
- [ ] Visualizar perfil público do prestador
- [ ] Comparar propostas (preço, rating, distância)
- [ ] Aceitar proposta
- [ ] Rejeitar proposta
- [ ] Job muda para status "agendado"
- [ ] Outros prestadores notificados da rejeição
```

#### 1.5 Pagamento Stripe

```typescript
// tests/e2e/client-payment.spec.ts
- [ ] Modal de pagamento abre após aceitar
- [ ] Ver resumo: serviço, prestador, valor, taxa
- [ ] Criar sessão Stripe Checkout
- [ ] Redirecionar para Stripe (test mode)
- [ ] Processar pagamento com cartão válido (4242...)
- [ ] Pagamento falha com cartão inválido
- [ ] Timeout e retry automático
- [ ] Voltar para dashboard após sucesso
- [ ] Job muda para "em_andamento"
- [ ] Escrow criado no backend
```

#### 1.6 Acompanhamento do Serviço

```typescript
// tests/e2e/client-tracking.spec.ts
- [ ] Ver status: agendado/a_caminho/em_andamento
- [ ] Chat com prestador em tempo real
- [ ] Enviar mensagem de texto
- [ ] IA sugere resumo do chat
- [ ] Propor agendamento
- [ ] Confirmar agendamento
- [ ] Ver localização no mapa
- [ ] Receber notificações de mudança de status
```

#### 1.7 Avaliação e Conclusão

```typescript
// tests/e2e/client-review.spec.ts
- [ ] Prestador marca como "concluído"
- [ ] Job muda para "aguardando_avaliacao"
- [ ] Modal de avaliação abre automaticamente
- [ ] Selecionar rating (1-5 estrelas)
- [ ] IA gera comentário sugerido
- [ ] Editar comentário manualmente
- [ ] Submeter avaliação
- [ ] Job muda para "concluido"
- [ ] Pagamento liberado para prestador
- [ ] Rating refletido no perfil do prestador
```

#### 1.8 Disputa (se necessário)

```typescript
// tests/e2e/client-dispute.spec.ts
- [ ] Abrir disputa durante "em_andamento"
- [ ] Descrever motivo (mín. 20 caracteres)
- [ ] Anexar evidências (fotos/vídeos)
- [ ] Enviar mensagens ao prestador
- [ ] Admin media disputa
- [ ] Disputa resolvida com decisão
- [ ] Pagamento liberado conforme decisão
- [ ] Job: "em_disputa" → "concluido" ou "cancelado"
```

#### 1.9 Gerenciar Itens

```typescript
// tests/e2e/client-items.spec.ts
- [ ] Cadastrar item (geladeira, ar condicionado, etc.)
- [ ] Upload de foto do item
- [ ] Ver lista de itens em grid
- [ ] Abrir detalhes do item
- [ ] Solicitar manutenção preventiva a partir do item
- [ ] Editar item
- [ ] Deletar item (confirmação)
```

---

### 2️⃣ JORNADA DO PRESTADOR (end-to-end)

#### 2.1 Cadastro e Onboarding

```typescript
// tests/e2e/provider-onboarding.spec.ts
- [ ] Cadastro inicial (escolher "Quero prestar serviços")
- [ ] Passo 1: Completar perfil (nome, WhatsApp, localização)
- [ ] Passo 2: Adicionar especialidades (mín. 1, máx. 10)
- [ ] Passo 3: Adicionar biografia (mín. 50 caracteres)
- [ ] Passo 4: Stripe Connect (criar conta e vincular)
- [ ] Aguardar aprovação do admin
- [ ] Receber notificação quando aprovado
- [ ] Status muda para "ativo"
```

#### 2.2 Dashboard e Busca de Jobs

```typescript
// tests/e2e/provider-dashboard.spec.ts
- [ ] Ver jobs abertos compatíveis com especialidades
- [ ] Filtrar por categoria
- [ ] Filtrar por distância (raio em km)
- [ ] Ordenar por urgência/preço/distância
- [ ] Ver jobs em leilão
- [ ] Ver "Meus Jobs" (propostas, aceitos, em andamento)
- [ ] Tabs: Abertos / Meus Jobs / Ganhos
```

#### 2.3 Propor Serviço

```typescript
// tests/e2e/provider-proposal.spec.ts
- [ ] Ver detalhes do job
- [ ] Calcular preço sugerido (IA)
- [ ] IA gera mensagem de proposta personalizada
- [ ] Editar mensagem manualmente
- [ ] Definir preço (validar mín. R$ 50, máx. R$ 50.000)
- [ ] Enviar proposta
- [ ] Proposta aparece na lista do cliente
- [ ] Receber notificação quando aceito
```

#### 2.4 Leilão (modo auction)

```typescript
// tests/e2e/provider-auction.spec.ts
- [ ] Ver jobs em leilão
- [ ] Ver lances atuais (anonimizados)
- [ ] Dar lance menor que o atual
- [ ] Validação de lance inválido (igual ou maior)
- [ ] Contador de tempo até encerramento
- [ ] Notificação quando leilão encerra
- [ ] Ganhador recebe job automaticamente
- [ ] Perdedores notificados
```

#### 2.5 Execução do Serviço

```typescript
// tests/e2e/provider-execution.spec.ts
- [ ] Job aceito aparece em "Meus Jobs"
- [ ] Marcar como "a_caminho"
- [ ] Chat com cliente
- [ ] Ver endereço no mapa (navegação)
- [ ] Marcar como "em_andamento"
- [ ] Adicionar fotos do trabalho
- [ ] Marcar como "concluido"
- [ ] Aguardar avaliação do cliente
```

#### 2.6 Recebimento

```typescript
// tests/e2e/provider-earnings.spec.ts
- [ ] Cliente avalia e pagamento é liberado
- [ ] Valor aparece em "Ganhos"
- [ ] Comissão calculada (75-85% conforme rating)
- [ ] Transfer para conta Stripe Connect
- [ ] Histórico de pagamentos
- [ ] Filtrar por período
- [ ] Exportar relatório (CSV)
```

#### 2.7 Responder Disputa

```typescript
// tests/e2e/provider-dispute-response.spec.ts
- [ ] Cliente abre disputa
- [ ] Receber notificação
- [ ] Ver detalhes da disputa
- [ ] Enviar mensagens/evidências
- [ ] Admin decide
- [ ] Receber notificação da decisão
- [ ] Valor ajustado conforme decisão
```

---

### 3️⃣ JORNADA DO ADMIN (end-to-end)

#### 3.1 Login e Dashboard

```typescript
// tests/e2e/admin-dashboard.spec.ts
- [ ] Login com email admin
- [ ] Redirecionar para dashboard admin
- [ ] Ver métricas gerais (usuários, jobs, receita)
- [ ] Gráficos de tendências (últimos 30 dias)
- [ ] Alertas de fraude e pendências
```

#### 3.2 Gestão de Usuários

```typescript
// tests/e2e/admin-users.spec.ts
- [ ] Listar todos os usuários
- [ ] Filtrar por tipo (cliente/prestador)
- [ ] Filtrar por status (ativo/suspenso/pendente)
- [ ] Buscar por nome/email
- [ ] Ver perfil de qualquer usuário
- [ ] Aprovar prestador pendente
- [ ] Suspender usuário com motivo
- [ ] Reativar usuário
- [ ] Ver histórico de ações
```

#### 3.3 Gestão de Jobs

```typescript
// tests/e2e/admin-jobs.spec.ts
- [ ] Listar todos os jobs
- [ ] Filtrar por status
- [ ] Filtrar por categoria
- [ ] Buscar por cliente/prestador
- [ ] Ver detalhes de qualquer job
- [ ] Cancelar job se necessário
- [ ] Ver timeline de eventos
```

#### 3.4 Mediação de Disputas

```typescript
// tests/e2e/admin-disputes.spec.ts
- [ ] Listar disputas abertas
- [ ] Ver detalhes da disputa
- [ ] Ver mensagens entre cliente e prestador
- [ ] Analisar evidências (fotos/vídeos)
- [ ] Decidir a favor do cliente ou prestador
- [ ] Definir porcentagem de reembolso (0-100%)
- [ ] Adicionar comentário na decisão
- [ ] Submeter decisão
- [ ] Disputa resolvida automaticamente
- [ ] Partes notificadas
- [ ] Pagamento ajustado no escrow
```

#### 3.5 Analytics e Relatórios

```typescript
// tests/e2e/admin-analytics.spec.ts
- [ ] Dashboard de métricas
- [ ] Total de usuários (ativos/suspensos)
- [ ] Total de jobs por status
- [ ] Receita total
- [ ] Receita da plataforma (comissão)
- [ ] Gráfico de crescimento
- [ ] Top 10 categorias
- [ ] Top 10 prestadores
- [ ] Taxa de conversão (jobs criados vs pagos)
- [ ] Tempo médio de resposta
- [ ] Filtros de período personalizado
- [ ] Exportar relatórios (CSV/PDF)
```

---

## 🖥️ PÁGINAS E COMPONENTES

### Páginas Públicas

```typescript
// tests/e2e/public-pages.spec.ts
- [ ] Home (HeroSection): Hero banner, CTA, navegação
- [ ] Catálogo: Grid de categorias, busca, filtros
- [ ] Landing de Categoria: /servicos/encanamento/sao-paulo
- [ ] Landing de Prestador: Convite para cadastro
- [ ] Encontrar Profissionais: Busca, filtros, resultados
- [ ] Perfil Público: Ver prestador (avaliações, portfolio)
- [ ] Payment Success: Confirmação + redirecionamento
- [ ] 404 Not Found: Mensagem amigável
```

### Páginas Autenticadas - Cliente

```typescript
// tests/e2e/client-pages.spec.ts
- [ ] Dashboard: Tabs, onboarding, ações rápidas
- [ ] Meus Serviços: Lista, filtros, ordenação
- [ ] Meus Itens: Grid de itens
- [ ] Perfil: Edição de dados
```

### Páginas Autenticadas - Prestador

```typescript
// tests/e2e/provider-pages.spec.ts
- [ ] Dashboard: Jobs abertos, meus jobs, filtros
- [ ] Onboarding: 4 steps progressivos
- [ ] Perfil: Especialidades, biografia, portfolio
- [ ] Ganhos: Histórico, filtros, exportar
```

### Páginas Autenticadas - Admin

```typescript
// tests/e2e/admin-pages.spec.ts
- [ ] Analytics: Métricas, gráficos, KPIs
- [ ] Usuários: Tabela, filtros, ações em massa
- [ ] Jobs: Tabela, detalhes, timeline
- [ ] Disputas: Lista, mediação, decisões
```

### Modais Críticos

```typescript
// tests/integration/modals.spec.ts
- [ ] AuthModal: Login/Cadastro
- [ ] AIJobRequestWizard: Criar serviço com IA (10 steps)
- [ ] ProposalModal: Enviar proposta
- [ ] ProposalListModal: Ver propostas recebidas
- [ ] PaymentModal: Checkout Stripe
- [ ] ReviewModal: Avaliar serviço
- [ ] DisputeModal: Abrir disputa
- [ ] DisputeDetailsModal: Ver/mediar disputa
- [ ] ChatModal: Chat em tempo real
- [ ] AuctionRoomModal: Sala de leilão
- [ ] ProfileModal: Editar perfil rápido
- [ ] AddItemModal: Cadastrar item
- [ ] ItemDetailModal: Detalhes do item
- [ ] JobLocationModal: Mapa de localização
- [ ] JobFAQModal: FAQ gerada por IA
```

### Componentes Críticos

```typescript
// tests/unit/components.spec.ts
- [ ] Header: Navegação, notificações, logout
- [ ] NotificationsBell: Badge não lidas
- [ ] NotificationsPopover: Lista de notificações
- [ ] ClientJobCard: Card de job do cliente
- [ ] ProviderJobCard: Card de job do prestador
- [ ] CompletedJobCard: Card de job concluído
- [ ] ItemCard: Card de item
- [ ] ProfileStrength: Indicador de perfil
- [ ] ProfileTips: Dicas de IA
- [ ] LoadingSpinner: Feedback de carregamento
- [ ] ErrorBoundary: Captura erros React
```

---

## 🚨 CENÁRIOS DE ERRO E EDGE CASES

### Validações de Formulário

```typescript
// tests/unit/form-validations.spec.ts
- [ ] Email inválido
- [ ] Senha muito curta (< 6 caracteres)
- [ ] Senhas não coincidem
- [ ] Campos obrigatórios vazios
- [ ] Descrição muito curta (< 10 caracteres)
- [ ] Preço abaixo do mínimo (< R$ 50)
- [ ] Preço acima do máximo (> R$ 50.000)
- [ ] Upload arquivo muito grande (> 10MB)
- [ ] Formato de arquivo inválido
- [ ] Número de telefone inválido
- [ ] CEP inválido
- [ ] CPF inválido
```

### Erros de Rede

```typescript
// tests/integration/network-errors.spec.ts
- [ ] API offline (mostrar fallback ou mock data)
- [ ] Timeout (retry automático 3x)
- [ ] 401 Unauthorized (redirecionar para login)
- [ ] 403 Forbidden (mensagem de permissão negada)
- [ ] 404 Not Found (fallback para dados locais)
- [ ] 409 Conflict (mensagem específica)
- [ ] 500 Server Error (mensagem amigável)
- [ ] Rede offline (modo offline com dados em cache)
```

### Estados Vazios

```typescript
// tests/integration/empty-states.spec.ts
- [ ] Cliente sem jobs
- [ ] Cliente sem itens
- [ ] Prestador sem jobs abertos
- [ ] Admin sem disputas pendentes
- [ ] Lista de notificações vazia
- [ ] Chat sem mensagens
- [ ] Leilão sem lances
- [ ] Histórico de pagamentos vazio
```

### Permissões e Segurança

```typescript
// tests/e2e/permissions.spec.ts
- [ ] Cliente não pode acessar dashboard prestador
- [ ] Prestador não pode acessar dashboard cliente
- [ ] Não-admin não pode acessar dashboard admin
- [ ] Usuário não pode editar perfil de outro
- [ ] Usuário não pode ver jobs de outro
- [ ] Prestador não aprovado não pode propor
- [ ] Cliente não pode aceitar própria proposta
- [ ] Não pode deletar job com proposta aceita
```

### IA e Integrações

```typescript
// tests/integration/ai-fallbacks.spec.ts
- [ ] IA offline → fallback para heurística
- [ ] Gemini timeout → usar texto original do usuário
- [ ] Stripe offline → mensagem de erro + retry
- [ ] Firebase offline → tentar reconectar
- [ ] Upload de imagem falha → retry ou skip
- [ ] Geolocalização negada → usar endereço manual
- [ ] Notificações bloqueadas → mostrar aviso
```

---

## ⚡ PERFORMANCE E ACESSIBILIDADE

### Lighthouse Scores (alvo: > 90)

```typescript
// tests/lighthouse/scores.spec.ts
- [ ] Performance: > 90
- [ ] Accessibility: 100
- [ ] Best Practices: > 90
- [ ] SEO: 100
```

### Acessibilidade (WCAG 2.1 AA)

```typescript
// tests/a11y/wcag.spec.ts
- [ ] Navegação por teclado (Tab, Enter, Esc)
- [ ] Leitores de tela (ARIA labels, roles corretos)
- [ ] Contraste de cores adequado (4.5:1 texto, 3:1 UI)
- [ ] Tamanho de fonte legível (mín. 16px)
- [ ] Botões e links com texto descritivo
- [ ] Formulários com labels associados
- [ ] Erros de validação anunciados
- [ ] Modais com foco trap (não sai do modal com Tab)
- [ ] Skip links para navegação rápida
- [ ] Landmarks HTML5 (header, nav, main, footer)
```

### Performance

```typescript
// tests/performance/metrics.spec.ts
- [ ] Tempo de carregamento inicial < 3s
- [ ] Time to Interactive < 5s
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Lazy loading de imagens
- [ ] Code splitting por rota
- [ ] Cache de assets estáticos (1 ano)
- [ ] Compressão gzip/brotli
- [ ] Minificação de JS/CSS
```

---

## 📊 COBERTURA DE CÓDIGO

### Alvo: 80%+ no SonarCloud (código novo)

#### Componentes Críticos (100% cobertura obrigatória):

```typescript
// Estes arquivos NÃO podem ter menos de 100% de cobertura
- [ ] services/api.ts - Todas as chamadas de API
- [ ] services/geminiService.ts - Integrações IA
- [ ] firebaseConfig.ts - Configuração Firebase
- [ ] components/PaymentModal.tsx - Pagamentos
- [ ] components/ChatModal.tsx - Chat em tempo real
- [ ] components/DisputeModal.tsx - Disputas
- [ ] components/ReviewModal.tsx - Avaliações
- [ ] App.tsx - Roteamento principal
```

#### Componentes Importantes (80%+ cobertura):

```typescript
- [ ] components/ClientDashboard.tsx
- [ ] components/ProviderDashboard.tsx
- [ ] components/AdminDashboard.tsx
- [ ] components/AIJobRequestWizard.tsx
- [ ] components/ProposalModal.tsx
- [ ] components/AuctionRoomModal.tsx
- [ ] components/Header.tsx
- [ ] services/messagingService.ts
- [ ] services/notificationService.ts
```

---

## 🚀 ESTRATÉGIA DE IMPLEMENTAÇÃO

### FASE 1: Jornadas E2E Principais (PRIORIDADE MÁXIMA)

**Prazo: 3-5 dias**

1. ✅ Cliente: Cadastro → Criar serviço → Aceitar proposta → Pagar → Avaliar
2. ✅ Prestador: Cadastro → Onboarding → Propor → Executar → Receber
3. ✅ Admin: Aprovar prestador → Mediar disputa

### FASE 2: Cobertura de Todas as Páginas

**Prazo: 2-3 dias**

1. Testar renderização de cada página
2. Validar navegação entre páginas
3. Testar estados de loading e erro

### FASE 3: Cobertura de Todos os Modais

**Prazo: 2-3 dias**

1. Testar abertura/fechamento
2. Validar interações
3. Testar submissão de formulários

### FASE 4: Cenários de Erro

**Prazo: 2 dias**

1. Validações de formulário
2. Erros de rede
3. Permissões negadas

### FASE 5: Performance e Acessibilidade

**Prazo: 1-2 dias**

1. Lighthouse audits
2. Testes com teclado
3. Testes com screen readers

### FASE 6: Quality Gate SonarCloud

**Prazo: 1-2 dias**

1. Corrigir bugs SonarCloud
2. Atingir 80% coverage
3. Reliability Rating A

### FASE 7: Validação em Produção

**Prazo: 1 dia**

1. Deploy para produção
2. Smoke tests em prod
3. Monitoramento de erros
4. Validação final de todos os flows

---

## ✅ CRITÉRIOS DE LANÇAMENTO

### Requisitos Mínimos (BLOQUEANTES)

- ✅ **100% dos flows principais testados e funcionando**
- ✅ **0 bugs críticos ou blockers**
- ✅ **SonarCloud Quality Gate PASSED**
- ✅ **80%+ cobertura de código novo**
- ✅ **Lighthouse Performance > 90**
- ✅ **Lighthouse Accessibility = 100**
- ✅ **0 erros no console em produção**
- ✅ **Todos os pagamentos processando corretamente**
- ✅ **Stripe Connect funcionando**
- ✅ **Chat em tempo real estável**
- ✅ **Notificações sendo entregues**
- ✅ **IA respondendo OU fallback funcionando**

### Validação Final (Checklist de Lançamento)

- [ ] Todos os testes E2E passando
- [ ] Todas as páginas renderizando sem erros
- [ ] Todos os modais funcionando
- [ ] Todos os formulários validando
- [ ] Todos os pagamentos processando
- [ ] Todas as notificações sendo entregues
- [ ] Todos os chats funcionando
- [ ] Todas as disputas sendo mediadas
- [ ] Todas as avaliações sendo salvas
- [ ] Todos os leilões funcionando
- [ ] Todos os uploads funcionando
- [ ] Todas as integrações (Stripe, Firebase, Gemini) estáveis

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

1. **AGORA**: Criar suite completa de testes E2E
   - `tests/e2e/client-full-journey.spec.ts`
   - `tests/e2e/provider-full-journey.spec.ts`
   - `tests/e2e/admin-full-journey.spec.ts`

2. **HOJE**: Aumentar cobertura para 80%+
   - Adicionar testes unitários para componentes críticos
   - Corrigir bugs SonarCloud para Rating A

3. **AMANHÃ**: Validar todas as páginas e modais
   - Renderização sem erros
   - Interações funcionando

4. **ESTA SEMANA**: Performance e acessibilidade
   - Lighthouse scores
   - WCAG compliance

5. **PRÓXIMA SEMANA**: Validação final e lançamento
   - Deploy para produção
   - Smoke tests
   - Monitoramento 24h

---

**FILOSOFIA FINAL**:

> "Uma boa ideia só funciona se o produto ou serviço tiver qualidade. Não lançamos até termos certeza absoluta de que TUDO está funcionando como deveria." 🚀

\*\*Critérios de aceite:

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
