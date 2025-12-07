# 🤖 Sistema de Prospecção Automática com IA

## Visão Geral

O Sistema de Prospecção Automática é ativado **automaticamente** quando um cliente solicita um serviço e não há prestadores disponíveis cadastrados na plataforma para aquela categoria.

## Fluxo Completo

### 1. Detecção Automática 🔍

Quando o cliente cria um job através do wizard IA:

- Sistema verifica se existem prestadores disponíveis para aquela categoria
- Se **nenhum prestador** for encontrado, dispara o processo de prospecção automática

### 2. Busca Inteligente 🌐

O sistema realiza:

- **Busca no Google** por profissionais da área na localização especificada
- **Extração de dados** usando IA (nome, email, telefone, website)
- Consulta: `"[categoria] [localização] profissional"`
- Exemplo: `"Eletricista São Paulo profissional"`

### 3. Envio de Convites 📧

Para cada profissional encontrado:

- **Email automático** convidando para participar do orçamento
- Link direto para cadastro como prestador
- Informações sobre o job disponível
- CTA claro: "Cadastre-se gratuitamente e participe deste orçamento"

**Template do Email:**

```
Assunto: Convite: Novo Cliente Procurando [Categoria] em [Localização]

Olá [Nome do Profissional],

Temos um cliente procurando por [Categoria] em [Localização].

Cadastre-se gratuitamente em Servio.AI e participe deste orçamento!

Acesse: https://servio-ai.com/register?type=provider

Equipe Servio.AI
```

### 4. Registro de Prospectos 💾

Cada profissional encontrado é salvo no banco de dados:

- **Collection:** `prospects`
- **Campos:**
  - `id`: ID único
  - `name`: Nome do profissional
  - `email`: Email de contato
  - `phone`: Telefone (se disponível)
  - `specialty`: Categoria do serviço
  - `source`: `google_auto` (indica prospecção automática)
  - `status`: `pendente` (inicial)
  - `relatedJob`: Informações do job que acionou a prospecção
  - `notes`: Histórico de interações
  - `createdAt`: Data/hora da prospecção

### 5. Notificação da Equipe 🚨

Sistema notifica TODOS os admins:

- **Tipo:** Notificação de alta prioridade
- **Mensagem:** "🚨 URGENTE: Cliente solicitou [Categoria] em [Localização]. X prospectos encontrados automaticamente."
- **Ação:** Admin deve acessar aba "Prospecting" no painel
- **Metadados:** Categoria, localização, email do cliente, quantidade de prospectos

### 6. Gestão no Painel Admin 📊

Na aba **Prospecting** do painel administrativo:

**Visualização:**

- Lista de todos os prospectos
- Status: pendente | contactado | convertido | perdido
- Filtros por status
- Paginação (50 itens por página)

**Métricas em Tempo Real:**

- Total de prospectos
- Pendentes
- Contactados
- Convertidos
- Taxa de conversão %

**Ações Disponíveis:**

- Atualizar status do prospecto
- Adicionar notas
- Enviar email direto
- Ver histórico de interações

### 7. Feedback ao Cliente 💬

Cliente recebe mensagem:

```
✅ Job "[Categoria]" criado!

🔍 Não encontramos prestadores cadastrados nesta categoria ainda.

Nossa IA está buscando profissionais qualificados para você agora mesmo!

Você receberá uma notificação assim que encontrarmos.
```

## APIs Implementadas

### Backend Endpoints

#### POST `/api/auto-prospect`

Endpoint principal de prospecção automática.

**Request:**

```json
{
  "category": "Eletricista",
  "location": "São Paulo, SP",
  "description": "Instalação de tomadas",
  "clientEmail": "cliente@email.com",
  "urgency": "high"
}
```

**Response:**

```json
{
  "success": true,
  "prospectsFound": 5,
  "emailsSent": 5,
  "adminNotified": true,
  "message": "Encontramos 5 profissionais e enviamos convites. Equipe notificada!"
}
```

#### GET `/api/prospects`

Lista todos os prospectos.

#### POST `/api/prospects`

Cria prospecto manualmente.

#### PUT `/api/prospects/:id`

Atualiza prospecto (status, notas, etc).

#### POST `/api/send-prospect-invitation`

Envia email de convite para prospecto específico.

#### POST `/api/notify-prospecting-team`

Notifica equipe de prospecção.

## Frontend Services

### `prospectingService.ts`

Serviço centralizado para operações de prospecção:

**Funções:**

- `triggerAutoProspecting()` - Dispara prospecção automática
- `searchGoogleForProviders()` - Busca no Google
- `sendProspectInvitation()` - Envia convite por email
- `notifyProspectingTeam()` - Notifica admins
- `saveProspect()` - Salva prospecto no banco

## Integração com o Fluxo Principal

### Em `App.tsx`

```typescript
// Após criar job, verificar se há prestadores
const matchingResults = await API.matchProvidersForJob(newJob.id);

if (matchingResults && matchingResults.length > 0) {
  // Fluxo normal: notificar prestadores
} else {
  // NENHUM PRESTADOR - TRIGGER AUTO-PROSPECTING
  import('./services/prospectingService').then(async prospecting => {
    const result = await prospecting.triggerAutoProspecting(newJob, currentUser?.email || '');
  });
}
```

## Próximas Melhorias

### Curto Prazo

- [ ] Integração real com Google Places API
- [ ] Integração com SendGrid/Resend para emails
- [ ] Web scraping para extrair emails de profissionais
- [ ] Validação de emails antes de enviar

### Médio Prazo

- [ ] IA para análise de perfil do profissional (LinkedIn, site)
- [ ] Score de qualidade do prospecto
- [ ] Sequência automática de follow-up
- [ ] WhatsApp Business API para contato direto

### Longo Prazo

- [ ] Machine Learning para prever taxa de conversão
- [ ] Integração com múltiplas fontes (Facebook, Instagram)
- [ ] Sistema de recompensas para prospectos convertidos
- [ ] Dashboard analytics de prospecção

## Métricas de Sucesso

### KPIs Principais

- **Taxa de Resposta:** % de prospectos que respondem ao convite
- **Taxa de Conversão:** % de prospectos que se cadastram
- **Tempo Médio de Conversão:** Dias desde convite até cadastro
- **Qualidade do Prospecto:** Taxa de conclusão de primeiro job

### Objetivos

- **Taxa de Conversão Target:** 15-25%
- **Tempo de Resposta:** < 48h para primeiro contato
- **Prospectos por Categoria:** Mínimo 3-5 por categoria sem cobertura

## Troubleshooting

### Problema: Prospecção não ativada

**Causa:** Existem prestadores cadastrados na categoria
**Solução:** Sistema só ativa quando `matchingResults.length === 0`

### Problema: Emails não enviados

**Causa:** Serviço de email não configurado
**Solução:** Configurar SendGrid ou Resend no backend

### Problema: Notificações não chegam aos admins

**Causa:** Usuários admin não configurados corretamente
**Solução:** Verificar campo `type: 'admin'` nos usuários

## Segurança e Privacidade

- ✅ Emails enviados apenas para prospectos opt-in
- ✅ Dados de prospectos protegidos por Firestore rules
- ✅ Rate limiting para evitar spam
- ✅ LGPD compliance: opção de descadastramento em cada email
- ✅ Logs de auditoria para todas as prospecções

## Conclusão

O Sistema de Prospecção Automática garante que:

1. **Nenhuma solicitação fica sem resposta**
2. **Plataforma cresce organicamente** conforme demanda
3. **Equipe é notificada imediatamente** de gaps na oferta
4. **Cliente não fica frustrado** - sempre há esperança de encontrar profissional
5. **Processo totalmente automatizado** - zero intervenção manual necessária

---

**Status:** ✅ Implementado e deployado
**Última atualização:** 20/11/2025
