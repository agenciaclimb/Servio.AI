# Sistema de Comissões - Prospectores Servio.AI

## 📋 Visão Geral

Sistema de comissionamento para equipe de prospecção, que incentiva o recrutamento de novos prestadores para a plataforma através de códigos de convite únicos.

## 🎯 Objetivos

1. **Incentivar Prospecção**: Equipe ganha comissão por recrutar prestadores
2. **Rastreabilidade**: Cada prospector tem código único de convite
3. **Suporte Contínuo**: Prospector responsável por prestadores recrutados
4. **Recompensa IA**: Comissão menor quando IA faz prospecção automática

## 💰 Estrutura de Comissões

### Taxas de Comissão

| Tipo de Recrutamento | Taxa | Descrição |
|---------------------|------|-----------|
| **Manual** | 1.0% | Prospector humano convidou diretamente |
| **IA Automática** | 0.25% | IA encontrou e convidou automaticamente |

### Cálculo de Comissão

```
Comissão = Ganhos do Prestador × Taxa de Comissão
Ganhos do Prestador = Preço do Job × Provider Rate (ex: 75%)

Exemplo (Manual - 1%):
- Job: R$ 1.000
- Provider Rate: 75%
- Ganhos Prestador: R$ 750
- Comissão Prospector: R$ 7,50

Exemplo (IA - 0.25%):
- Job: R$ 1.000
- Provider Rate: 75%
- Ganhos Prestador: R$ 750
- Comissão Prospector: R$ 1,88
```

## 🔗 Fluxo de Funcionamento

### 1. Criação de Prospector

**Painel Admin → Gestão de Prospectores → Criar Prospector**

```typescript
// Dados necessários:
{
  name: "João Silva",
  email: "joao@servio.ai",
  inviteCode: "JOAO2025" // Gerado automaticamente
}
```

**Código de Convite:**
- Formato: `NOME + 4 dígitos aleatórios`
- Exemplo: `JOAO2025`, `MARIA3K4L`
- Único por prospector

### 2. Link de Convite

**URL Gerada:**
```
https://servio-ai.com/register?type=provider&invite=JOAO2025
```

**Funcionalidades:**
- ✅ Link copiável com um clique
- ✅ Mostra mensagem de boas-vindas ao registrar
- ✅ Associa prestador ao prospector automaticamente

### 3. Registro com Convite

**Quando prestador acessa o link:**

1. Página de registro detecta parâmetro `?invite=JOAO2025`
2. Mostra badge: "🎉 Você foi convidado por um membro da equipe!"
3. Ao completar registro:
   - Prestador recebe campo `prospectorId`
   - Taxa de comissão definida (1% ou 0.25%)
   - Data de recrutamento registrada
   - Prospector atualizado com novo recrutado

### 4. Criação de Comissão

**Quando job é concluído:**

```javascript
// Backend automaticamente:
if (job.status === 'concluido' && provider.prospectorId) {
  const commission = {
    prospectorId: provider.prospectorId,
    providerId: provider.id,
    jobId: job.id,
    amount: calculateCommission(job.price, provider),
    rate: provider.prospectorCommissionRate,
    status: 'pending'
  };
  
  await db.collection('commissions').add(commission);
}
```

## 📊 Estrutura de Dados

### Collection: `prospectors`

```typescript
interface Prospector {
  id: string;                    // Email do prospector
  name: string;                  // Nome completo
  email: string;                 // Email de contato
  inviteCode: string;            // Código único (ex: "JOAO2025")
  totalRecruits: number;         // Total de prestadores recrutados
  activeRecruits: number;        // Prestadores ativos
  totalCommissionsEarned: number; // Total ganho em comissões (R$)
  commissionRate: number;        // Taxa padrão (0.01 ou 0.0025)
  providersSupported: string[];  // IDs dos prestadores
  createdAt: string;             // Data de criação
}
```

### Collection: `commissions`

```typescript
interface Commission {
  id: string;                    // ID único da comissão
  prospectorId: string;          // Email do prospector
  providerId: string;            // Email do prestador
  jobId: string;                 // ID do job concluído
  amount: number;                // Valor da comissão (R$)
  rate: number;                  // Taxa aplicada (0.01 ou 0.0025)
  providerEarnings: number;      // Ganhos do prestador neste job
  jobPrice: number;              // Preço total do job
  providerRate: number;          // Taxa do prestador (ex: 0.75)
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;               // Data de pagamento
  createdAt: string;             // Data de criação
}
```

### Campos Adicionados em `users`

```typescript
interface User {
  // ... campos existentes
  prospectorId?: string;         // Email de quem recrutou
  prospectorCommissionRate?: number; // 0.01 ou 0.0025
  inviteCode?: string;           // Se for prospector
  recruitedAt?: string;          // Data de recrutamento
  recruitmentSource?: 'manual' | 'ai_auto' | 'organic';
}
```

## 🎛️ Painel Administrativo

### Gestão de Prospectores

**Funcionalidades:**
- ✅ Listar todos os prospectores
- ✅ Criar novo prospector
- ✅ Ver estatísticas individuais
- ✅ Copiar link de convite
- ✅ Ver histórico de comissões

**Estatísticas Exibidas:**
- Total de prospectores ativos
- Total de prestadores recrutados
- Comissões pendentes (R$)
- Comissões pagas (R$)

**Por Prospector:**
- Nome e email
- Código de convite
- Total recrutados / Ativos
- Comissões ganhas (R$)
- Taxa de comissão
- Botão "Copiar Link"

### Histórico de Comissões

**Filtros:**
- Por prospector
- Por status (pending/paid/cancelled)
- Por período

**Informações:**
- Data de criação
- Prestador que gerou
- Job relacionado
- Valor da comissão
- Status
- Data de pagamento (se pago)

## 🔧 Rotas Backend

### Prospectores

```javascript
// Listar prospectores
GET /api/prospectors
Response: Prospector[]

// Criar prospector
POST /api/prospectors
Body: {
  name: string,
  email: string,
  inviteCode: string,
  commissionRate: number
}
Response: { success: true, id: string }
```

### Comissões

```javascript
// Listar comissões
GET /api/commissions?prospectorId=xxx&status=pending
Response: Commission[]

// Criar comissão (automático no job completion)
POST /api/commissions
Body: {
  prospectorId: string,
  providerId: string,
  jobId: string,
  providerEarnings: number,
  rate: number
}
Response: { success: true, id: string, amount: number }

// Atualizar status
PUT /api/commissions/:id
Body: { status: 'paid' | 'cancelled' }
Response: { success: true }
```

### Registro com Convite

```javascript
// Associar prestador a prospector
POST /api/register-with-invite
Body: {
  providerEmail: string,
  inviteCode: string,
  source: 'manual' | 'ai_auto'
}
Response: {
  success: true,
  prospectorId: string,
  commissionRate: number
}
```

## 📱 Fluxo de Uso

### Para o Admin

1. **Adicionar Prospector:**
   - Abrir painel admin
   - Ir para "Gestão de Prospectores"
   - Clicar "Criar Prospector"
   - Preencher nome e email
   - Sistema gera código único
   - Salvar

2. **Compartilhar Link:**
   - Ver lista de prospectores
   - Clicar "Copiar Link" no prospector desejado
   - Link copiado: `servio-ai.com/register?type=provider&invite=CODE`
   - Enviar para prospector via WhatsApp/Email

3. **Acompanhar Performance:**
   - Ver estatísticas gerais
   - Ver performance individual
   - Verificar comissões pendentes
   - Marcar comissões como pagas

### Para o Prospector

1. **Receber Credenciais:**
   - Admin cria conta e envia link
   - Prospector recebe email/whatsapp

2. **Recrutar Prestadores:**
   - Copiar link de convite pessoal
   - Compartilhar em redes sociais
   - Enviar para profissionais conhecidos
   - Acompanhar conversões

3. **Acompanhar Ganhos:**
   - Login no painel
   - Ver prestadores recrutados
   - Ver comissões ganhas
   - Ver histórico de pagamentos

### Para o Prestador

1. **Receber Convite:**
   - Clicar no link recebido
   - Ver mensagem de boas-vindas
   - Ver código de quem convidou

2. **Registrar-se:**
   - Preencher dados normais
   - Sistema associa automaticamente ao prospector
   - Começar a trabalhar

3. **Gerar Comissões:**
   - Concluir jobs normalmente
   - Comissão calculada automaticamente
   - Prospector recebe sem interferir nos ganhos

## 🔄 Integração com IA

### Auto-Prospecting

Quando IA encontra e convida prestadores automaticamente:

```typescript
// Em prospectingService.ts
const prospect = {
  email: 'profissional@email.com',
  inviteCode: 'IA_AUTO', // Código especial da IA
  source: 'ai_auto'
};

// Taxa de comissão reduzida: 0.25%
commissionRate = 0.0025;
```

**Benefícios:**
- IA trabalha 24/7
- Prospector ainda ganha (0.25%)
- Incentiva uso inteligente da IA
- Equipe foca em casos complexos

## 📈 Métricas e KPIs

### Para Admin Monitorar

1. **Efetividade:**
   - Taxa de conversão por prospector
   - Tempo médio até primeiro job
   - Retenção de recrutados

2. **Financeiro:**
   - Total comissões geradas
   - Comissões vs. receita total
   - ROI da equipe de prospecção

3. **Performance:**
   - Top prospectores
   - Recrutados mais ativos
   - Categorias mais convertidas

## 🔐 Segurança

### Validações

- ✅ Código de convite único
- ✅ Evita duplicação de códigos
- ✅ Valida existência do prospector
- ✅ Protege contra manipulação de taxa

### Auditoria

- ✅ Registra quem recrutou quem
- ✅ Data de recrutamento
- ✅ Fonte (manual/IA/orgânico)
- ✅ Histórico de comissões
- ✅ Mudanças de status

## 🚀 Próximos Passos

### Fase 1 - MVP (Atual)
- ✅ Sistema de convites
- ✅ Rastreamento de comissões
- ✅ Painel administrativo
- ✅ Integração com IA

### Fase 2 - Expansão
- [ ] Painel exclusivo para prospectores
- [ ] Relatórios detalhados
- [ ] Exportação de dados
- [ ] Notificações em tempo real

### Fase 3 - Automação
- [ ] Pagamento automático via PIX
- [ ] Integração bancária
- [ ] Dashboard de analytics
- [ ] Gamificação (ranking, badges)

## 📞 Suporte

Para dúvidas sobre o sistema de comissões:
- **Admin**: Acesse "Gestão de Prospectores" no painel
- **Documentação**: Este arquivo
- **Backend**: `/backend/src/index.js` (rotas de comissões)
- **Frontend**: `/components/AdminProspectorManagement.tsx`

---

**Versão:** 1.0  
**Última Atualização:** 2025  
**Desenvolvedor:** Servio.AI Team
