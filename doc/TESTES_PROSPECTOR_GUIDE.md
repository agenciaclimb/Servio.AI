# 🧪 Guia de Testes - Módulo de Prospecção

## 📋 Resumo dos Testes Criados

### Testes Unitários (5 arquivos)

- ✅ `QuickPanel.test.tsx` - 20 testes
- ✅ `AIMessageGenerator.test.tsx` - 18 testes
- ✅ `ProspectorCRMEnhanced.test.tsx` - 15 testes
- ✅ `OnboardingTour.test.tsx` - 12 testes
- ✅ `QuickActionsBar.test.tsx` - 16 testes

### Testes de Integração (1 arquivo)

- ✅ `prospector-flow.test.tsx` - 10 fluxos completos

**Total: 91 testes automatizados**

---

## 🚀 Como Executar os Testes

### Executar todos os testes

```bash
npm run test
```

### Executar testes de um componente específico

```bash
npm run test QuickPanel
npm run test AIMessageGenerator
npm run test ProspectorCRMEnhanced
npm run test OnboardingTour
npm run test QuickActionsBar
```

### Executar testes de integração

```bash
npm run test integration
```

### Executar com coverage

```bash
npm run test:coverage
```

### Modo watch (desenvolvimento)

```bash
npm run test:watch
```

---

## 📊 Cobertura de Testes por Componente

### QuickPanel (20 testes)

- ✅ Renderização básica
- ✅ Saudações baseadas em horário
- ✅ Carregamento de smart actions
- ✅ Exibição de métricas com benchmarks
- ✅ Indicadores de performance (acima/abaixo da média)
- ✅ Progress bars com cores dinâmicas
- ✅ Confetti ao mudar de badge
- ✅ Mensagens motivacionais personalizadas
- ✅ Dicas do dia contextuais
- ✅ Click handlers para ações
- ✅ Estado de carregamento
- ✅ Tratamento de erros
- ✅ Formatação de valores monetários
- ✅ Badges de prioridade
- ✅ Truncamento de ações (máx 4)

### AIMessageGenerator (18 testes)

- ✅ Renderização de canais (WhatsApp/Email/SMS)
- ✅ Seleção de canal padrão
- ✅ Troca entre canais
- ✅ Geração de mensagem com IA
- ✅ Substituição de variáveis ({{nome}}, {{categoria}}, etc)
- ✅ Contador de caracteres
- ✅ Sugestão de melhor horário
- ✅ Abertura de WhatsApp Web
- ✅ Registro de atividade no backend
- ✅ Templates diferentes por stage
- ✅ Edição manual de mensagem
- ✅ Tratamento de erro na geração IA
- ✅ Estado de loading
- ✅ Adaptação para SMS (160 chars)
- ✅ Formatação de email com assunto/assinatura

### ProspectorCRMEnhanced (15 testes)

- ✅ Renderização do Kanban
- ✅ Carregamento de leads do Firestore
- ✅ Exibição em colunas corretas
- ✅ Cálculo de lead score automático
- ✅ Filtros por temperatura (hot/warm/cold)
- ✅ Stats resumidas
- ✅ Update no Firestore ao arrastar
- ✅ Confetti ao converter lead (won)
- ✅ Modal AIMessageGenerator ao clicar
- ✅ Quick action WhatsApp
- ✅ Tempo relativo de última atividade
- ✅ Progress bar de score
- ✅ Notificações de leads inativos
- ✅ Auto-refresh (30s)
- ✅ Fechar modal

### OnboardingTour (12 testes)

- ✅ Início automático no primeiro acesso
- ✅ Pergunta para continuar se incompleto
- ✅ Não inicia se já completo
- ✅ Exibição do checklist
- ✅ Cálculo de progresso (0-100%)
- ✅ Marcação de tarefas completas
- ✅ Confetti ao completar tour
- ✅ Update no Firestore
- ✅ Badge de conquista
- ✅ Retomar tour
- ✅ Botão finalizar quando tudo completo
- ✅ Ocultar checklist se completo

### QuickActionsBar (16 testes)

- ✅ Renderização barra desktop
- ✅ Renderização FAB mobile
- ✅ Carregamento de próxima ação IA
- ✅ Badge de notificações
- ✅ Badge 9+ quando >9
- ✅ Compartilhar no WhatsApp
- ✅ Adicionar lead
- ✅ Abrir notificações
- ✅ Executar próxima ação
- ✅ Prioridade alta (cor vermelha)
- ✅ Alerta urgente
- ✅ Auto-refresh (5min)
- ✅ Expandir FAB mobile
- ✅ Fechar FAB (overlay)
- ✅ Vibração mobile
- ✅ Tratamento de erro

### Integração (10 fluxos)

- ✅ Onboarding completo novo prospector
- ✅ Gerar e compartilhar link
- ✅ Adicionar lead e enviar mensagem IA
- ✅ Filtrar leads por temperatura
- ✅ Arrastar lead entre stages (placeholder)
- ✅ Smart actions personalizadas
- ✅ Navegação entre tabs
- ✅ Quick Actions Bar completa
- ✅ Celebração novo badge
- ✅ Responsividade mobile

---

## 🎯 Casos de Teste Manuais

### Checklist de Testes Manuais

#### QuickPanel

- [ ] Confetti dispara visualmente ao mudar badge
- [ ] Animações de hover funcionam suavemente
- [ ] Cores dos progress bars correspondem aos valores
- [ ] Skeleton loading aparece durante carregamento
- [ ] Toast de achievement é visível e desaparece após 5s

#### AIMessageGenerator

- [ ] Chamada real ao backend `/api/ai/generate-prospector-message`
- [ ] WhatsApp Web abre corretamente com mensagem preenchida
- [ ] mailto: funciona no email
- [ ] SMS abre app de mensagens (mobile)
- [ ] Variáveis são substituídas corretamente em tempo real
- [ ] Timing optimization sugere horários corretos
- [ ] Alternatives IA aparecem abaixo da mensagem principal

#### ProspectorCRMEnhanced

- [ ] Drag-and-drop fluido entre todas as 5 colunas
- [ ] Visual feedback durante drag (shadow, hover)
- [ ] Confetti épico ao soltar em "Convertidos"
- [ ] Toast animado aparece ao converter
- [ ] Notificação de leads inativos dispara (7+ dias)
- [ ] Filtros mudam cards exibidos instantaneamente
- [ ] Score bar atualiza cores dinamicamente
- [ ] Modal fecha ao clicar fora

#### OnboardingTour

- [ ] Tour inicia automaticamente no primeiro acesso
- [ ] Navegação entre steps funciona (next/prev/skip)
- [ ] Spotlight destaca elementos corretamente
- [ ] Checklist sidebar acompanha progresso
- [ ] Confetti triplo ao finalizar
- [ ] Toast de "Onboarding Completo" aparece
- [ ] Badge 🏆 fica fixo após completar
- [ ] Pergunta de retomar aparece se não completou

#### QuickActionsBar

**Desktop:**

- [ ] Barra sticky permanece no topo ao scrollar
- [ ] Próxima ação IA atualiza a cada 5 min
- [ ] Badge de notificações pulsa se >0
- [ ] Hover effects funcionam em todos os botões
- [ ] Alerta urgente aparece para prioridade alta

**Mobile:**

- [ ] FAB aparece no canto inferior direito
- [ ] Menu expande suavemente ao tocar
- [ ] Overlay escurece tela ao abrir
- [ ] Botões possuem área de toque adequada
- [ ] Vibração tátil funciona ao tocar
- [ ] Animação slide-up é suave

#### ProspectorDashboard

- [ ] Tab padrão é "Dashboard IA"
- [ ] Onboarding tour dispara no primeiro acesso
- [ ] QuickActionsBar está sempre visível
- [ ] Navegação entre tabs é instantânea
- [ ] Modais abrem/fecham corretamente
- [ ] Layout responsivo em mobile/tablet/desktop
- [ ] Dados persistem ao trocar tabs

---

## 🐛 Cenários de Erro a Testar

### API Failures

1. **Backend offline**
   - [ ] Fallback templates são usados no AIMessageGenerator
   - [ ] Smart actions usam regras client-side
   - [ ] Mensagem de erro amigável aparece

2. **Firestore indisponível**
   - [ ] CRM exibe mensagem de erro
   - [ ] Retry automático acontece
   - [ ] Dados em cache são usados se disponíveis

3. **Timeout de rede**
   - [ ] Loading states não ficam travados
   - [ ] Timeout após 30s com mensagem clara

### Edge Cases

1. **Nenhum lead cadastrado**
   - [ ] CRM exibe empty state convidativo
   - [ ] Smart actions sugerem adicionar primeiro lead

2. **Onboarding já completo**
   - [ ] Tour não inicia novamente
   - [ ] Apenas badge 🏆 aparece

3. **Notificações bloqueadas**
   - [ ] App funciona normalmente
   - [ ] Mensagem sugere habilitar notificações

4. **Mobile com tela pequena (<375px)**
   - [ ] FAB não sobrepõe conteúdo
   - [ ] Tabs são scrollable horizontalmente
   - [ ] Cards do CRM responsivos

---

## 📈 Métricas de Qualidade

### Coverage Targets

- **Linhas:** ≥85%
- **Funções:** ≥90%
- **Branches:** ≥80%
- **Statements:** ≥85%

### Performance Targets

- **Render QuickPanel:** <100ms
- **Gerar mensagem IA:** <2s
- **Carregar leads CRM:** <500ms
- **Iniciar onboarding tour:** <200ms
- **Auto-refresh actions:** background, não bloqueia UI

---

## 🔍 Debugging Tips

### Vitest Debug

```bash
# Rodar um teste específico
npm run test -- -t "deve disparar confetti"

# Modo UI interativo
npm run test:ui

# Verbose output
npm run test -- --reporter=verbose
```

### React Testing Library

```tsx
// Ver DOM atual
screen.debug();

// Ver elemento específico
screen.debug(screen.getByText('Test'));

// Queries disponíveis
screen.logTestingPlaygroundURL();
```

### Firebase Emulator (local testing)

```bash
firebase emulators:start --only firestore

# Configurar no teste
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
```

---

## ✅ Critérios de Aceitação

Todos os testes devem passar antes de merge para `main`:

```bash
✓ npm run test (91/91 passed)
✓ npm run test:coverage (>85% coverage)
✓ npm run build (0 errors TypeScript)
✓ npm run lint (0 warnings ESLint)
```

**Testes manuais críticos:**

- [ ] Confetti visual funciona
- [ ] Drag-and-drop é fluido
- [ ] WhatsApp abre corretamente
- [ ] Onboarding tour navegável
- [ ] Responsivo em mobile

---

## 🚦 CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
      - uses: codecov/codecov-action@v3
```

---

**🎯 Status:** Todos os testes criados e documentados. Pronto para execução!
