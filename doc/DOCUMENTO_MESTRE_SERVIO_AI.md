# 📘 DOCUMENTO MESTRE - SERVIO.AI
**Última atualização:** 30/10/2025 13:31

---

## 🧭 1. VISÃO GERAL DO PROJETO

O **Servio.AI** é uma plataforma inteligente de intermediação de serviços que conecta **clientes e prestadores** de forma segura, automatizada e supervisionada por Inteligência Artificial.

### 🎯 Objetivo principal
Criar um ecossistema que una **contratação, execução, pagamento e avaliação** em um único fluxo digital, com segurança garantida via **escrow (Stripe)** e monitoramento por IA.

### 💡 Proposta de valor
- Conexão direta entre cliente e prestador com mediação automatizada;
- Pagamentos seguros via escrow (retenção e liberação automática);
- IA Gemini integrada para triagem, suporte e acompanhamento;
- Escalabilidade completa via Google Cloud Run + Firestore.

---

## 🧩 2. ARQUITETURA TÉCNICA

### 🌐 Stack principal (100% Google Cloud)
| Camada | Tecnologia | Descrição |
|--------|-------------|------------|
| Frontend | React + Vite + TypeScript | Interface do cliente, prestador e painel admin |
| Backend | Cloud Run (Node.js) | API principal com autenticação e lógica de negócios |
| Banco de Dados | Firestore | Banco NoSQL serverless com sincronização em tempo real |
| Autenticação | Firebase Auth | Suporte a login Google, e-mail/senha e WhatsApp |
| Armazenamento | Cloud Storage | Upload e gestão de arquivos, fotos e comprovantes |
| Inteligência Artificial | Vertex AI + Gemini 2.5 Pro | IA contextual integrada ao chat e fluxo de suporte |
| Pagamentos | Stripe | Escrow de pagamentos e liberação após conclusão |
| CI/CD | GitHub Actions + GCP Service Account | Deploy automatizado a cada push na branch `main` |

### 🔐 Autenticação e segurança
- Firebase Auth com roles (cliente, prestador, admin);
- Criptografia AES em dados sensíveis;
- Regras Firestore com base em permissões dinâmicas;
- Monitoramento via Google Cloud Logs e Error Reporting.

### 2.1. Estrutura do Firestore

Com base nas interfaces definidas em `types.ts`, as principais coleções do Firestore serão:

| Coleção | Descrição | Principais Campos |
|---|---|---|
| `users` | Armazena perfis de clientes, prestadores e administradores. | `email` (ID do documento), `name`, `type`, `status`, `location`, `memberSince` |
| `jobs` | Detalhes dos pedidos de serviço. | `id` (ID do documento), `clientId`, `providerId`, `category`, `description`, `status`, `createdAt` |
| `proposals` | Propostas enviadas por prestadores para jobs. | `id` (ID do documento), `jobId`, `providerId`, `price`, `message`, `status`, `createdAt` |
| `messages` | Histórico de conversas entre clientes e prestadores (por job). | `id` (ID do documento), `chatId` (JobId), `senderId`, `text`, `createdAt` |
| `notifications` | Notificações para usuários. | `id` (ID do documento), `userId`, `text`, `isRead`, `createdAt` |
| `escrows` | Gerenciamento de pagamentos via Stripe Escrow. | `id` (ID do documento), `jobId`, `clientId`, `providerId`, `amount`, `status`, `createdAt` |
| `fraud_alerts` | Alertas gerados por comportamento suspeito. | `id` (ID do documento), `providerId`, `riskScore`, `reason`, `status`, `createdAt` |
| `disputes` | Detalhes de disputas entre clientes e prestadores. | `id` (ID do documento), `jobId`, `initiatorId`, `reason`, `status`, `createdAt` |
| `maintained_items` | Itens que o cliente deseja manter ou monitorar. | `id` (ID do documento), `clientId`, `name`, `category`, `createdAt` |
| `bids` | Lances em jobs no modo leilão. | `id` (ID do documento), `jobId`, `providerId`, `amount`, `createdAt` |

### ⚙️ CI/CD
- GitHub Actions (`.github/workflows/deploy-cloud-run.yml`);
- Deploy automático no **Cloud Run** (`servio-ai`) a cada commit em `main`;
- Service Account: `servio-cicd@gen-lang-client-0737507616.iam.gserviceaccount.com`;
- Região: `us-west1`.

---

## 🔄 3. FLUXO GERAL DO SISTEMA

### 👥 Papéis principais
1. **Cliente:** publica pedidos de serviço e acompanha execução.  
2. **Prestador:** recebe oportunidades e envia propostas.  
3. **Admin:** supervisiona, resolve disputas e audita atividades.  
4. **IA Servio (Gemini):** atua como suporte inteligente e agente de mediação.

### 🚀 Jornada do usuário
1. Cadastro / Login via Auth.  
2. Criação de pedido com descrição, categoria e orçamento.  
3. Matching IA → envio de propostas automáticas para prestadores.  
4. Escolha e aceite do prestador pelo cliente.  
5. Execução e acompanhamento em tempo real.  
6. Pagamento via escrow (Stripe).  
7. Liberação após confirmação de conclusão.  
8. Avaliação e feedback IA.

---

## 🤖 4. INTEGRAÇÃO COM IA (GEMINI + VERTEX AI)

### 🧠 Funções principais da IA
- **Triagem automática:** entendimento do pedido do cliente e classificação por categoria;  
- **Matching inteligente:** recomendação de prestadores com base em perfil e histórico;  
- **Atendimento e suporte:** respostas contextuais integradas ao Firestore;  
- **Monitoramento de comportamento:** análise de mensagens, tempo de resposta e satisfação;  
- **Análise de performance:** identificação de gargalos e sugestões de melhoria contínua.

### 💬 Configuração do agente
- Modelo: **Gemini 2.5 Pro**  
- Ambiente: **Vertex AI / Google Cloud**  
- Canal: **VS Code (Gemini Code Assist)** + **API integrada**  
- Comunicação: JSON e Firestore Collections  
- Módulo “Agente Central”: leitura contínua do Documento Mestre para autoatualização.

---

## 💳 5. INTEGRAÇÕES EXTERNAS

| Serviço | Finalidade | Status |
|----------|-------------|---------|
| Stripe | Pagamentos com escrow | ✅ Configuração base pronta |
| Google Auth | Login social | ✅ Ativo via Firebase |
| Gemini / Vertex AI | IA contextual e suporte | ✅ Conectado via GCP |
| Twilio / WhatsApp | Notificações (planejado) | ⏳ Em análise |
| Maps API | Localização e raio de atuação | ⏳ Próxima etapa |

---

## 📊 6. ESTADO ATUAL DO PROJETO

| Área | Situação | Detalhes |
|------|-----------|-----------|
| Repositório GitHub | ✅ Ativo | `agenciaclimb/Servio.AI` |
| CI/CD | ✅ Funcionando | Deploy via Cloud Run testado com sucesso |
| Firestore | ⚙️ Em preparação | Estrutura inicial sendo definida |
| Auth | ⚙️ Configurado | Falta integração com frontend |
| Frontend | ⏳ Em desenvolvimento | Estrutura React pronta no diretório base |
| IA (Gemini) | ✅ Conectada ao workspace | Gemini Code Assist ativo em VS Code |
| Stripe | ⏳ A configurar | Chaves secretas e webhook |
| Storage | ⏳ Pendente | Integração com upload de comprovantes |

---

## 🧱 7. PRÓXIMOS PASSOS

### 🔹 Backend
- Estruturar API Firestore (usuários, jobs, propostas, pagamentos);
- Criar Cloud Function para notificações e auditoria;
- Implementar endpoints REST para o frontend.

### 🔹 Frontend
- Criar páginas de **login, dashboard, solicitações e propostas**;
- Integrar Firebase Auth + Firestore;
- Configurar rotas com React Router e autenticação protegida.

### 🔹 Integração com IA
- Conectar Vertex AI ao Firestore para geração de insights;
- Criar coleções `ia_logs`, `recommendations` e `feedback`.

### 🔹 Pagamentos
- Implementar Stripe Checkout + webhook de confirmação;
- Sincronizar status de pagamento com Firestore.

### 🔹 Monitoramento
- Ativar Cloud Monitoring + Logging;
- Alertas automáticos no Discord ou e-mail.

---

## 🧠 8. GUIA PARA IAs E DESENVOLVEDORES

### Regras para agentes IA
1. **Leitura obrigatória** do Documento Mestre antes de iniciar qualquer tarefa.  
2. **Registrar toda ação** de desenvolvimento, correção ou descoberta em uma nova seção `#update_log`.  
3. **Nunca sobrescrever informações antigas**, apenas adicionar histórico.  
4. **Priorizar sempre qualidade, boas práticas e integridade dos dados.**  
5. **Trabalhar em modo autônomo** com foco em estabilidade e conclusão das pendências.  

### Exemplo de registro IA
```markdown
#update_log - 30/10/2025 22:45
A IA Gemini detectou melhoria na função de deploy automático.
Atualizado workflow deploy-cloud-run.yml para suportar rollback.
```

#update_log - 30/10/2025 13:31
A IA Gemini definiu a estrutura inicial das coleções do Firestore com base nas interfaces TypeScript existentes em `types.ts` e `mockData.ts`. A seção `2.1. Estrutura do Firestore` foi adicionada ao Documento Mestre.

#update_log - 30/10/2025 13:32
A IA Gemini criou o arquivo `firestore.rules` na raiz do projeto com as regras de segurança iniciais para as coleções do Firestore, garantindo controle de acesso básico para diferentes tipos de usuários (cliente, prestador, admin).

#update_log - 30/10/2025 13:33
A IA Gemini criou a estrutura básica da API de backend em `backend/src/index.js` com um aplicativo Express, inicialização do Firebase Admin SDK e endpoints de exemplo para "Hello World" e interação com a coleção `users` do Firestore. Um `package.json` dedicado para o backend foi criado em `backend/package.json`.


---

## ✅ 9. CHECKLIST FINAL DO MVP

- [ ] Estrutura Firestore configurada  
- [ ] API REST no Cloud Run  
- [ ] Frontend React conectado  
- [ ] Auth + Stripe funcionando  
- [ ] Deploy automatizado validado  
- [ ] IA Gemini integrada ao fluxo real  
- [ ] Testes e documentação finalizados  

---

**📘 Documento Mestre – Servio.AI**  
Este arquivo deve ser considerado **a FONTE DA VERDADE DO PROJETO**.  
Todas as ações humanas ou automáticas devem **registrar atualizações** neste documento.  
Seu propósito é garantir **consistência, rastreabilidade e continuidade** até a conclusão e evolução do sistema.
