import { User, Job, Proposal, Message, MaintainedItem, Notification, Bid, FraudAlert } from './types';

export const MOCK_USERS: User[] = [
  // Clientes
  { email: 'cliente@servio.ai', name: 'Ana Silva', type: 'cliente', bio: 'Busco profissionais de confiança para pequenos reparos em casa.', location: 'São Paulo, SP', memberSince: '2023-01-15T00:00:00Z', status: 'ativo' },
  { email: 'rodrigo.souza@email.com', name: 'Rodrigo Souza', type: 'cliente', bio: 'Preciso de ajuda com design e marketing para minha startup.', location: 'Rio de Janeiro, RJ', memberSince: '2023-03-22T00:00:00Z', status: 'ativo' },
  
  // Prestadores
  {
    email: 'prestador@servio.ai', name: 'Carlos Pereira', type: 'prestador', bio: 'Eletricista com mais de 10 anos de experiência em instalações e reparos residenciais e comerciais. Segurança e qualidade são minhas prioridades.', location: 'São Paulo, SP', memberSince: '2023-02-10T00:00:00Z', status: 'ativo',
    headline: 'Eletricista Profissional', specialties: ['Instalações elétricas', 'Reparo de curto-circuito', 'Manutenção preventiva'], hasCertificates: true, hasCriminalRecordCheck: true, availability: '24h',
    verificationStatus: 'verificado', cpf: '111.222.333-44', address: 'Rua das Luzes, 123, São Paulo, SP',
    portfolio: [
        { id: 'p1-1', imageUrl: 'https://i.imgur.com/3TwiM62.jpeg', title: 'Instalação Elétrica Residencial', description: 'Projeto completo de instalação elétrica para uma sala de estar moderna, incluindo spots de LED e novas tomadas.' },
        { id: 'p1-2', imageUrl: 'https://i.imgur.com/9q8m6p3.jpeg', title: 'Organização de Quadro de Luz', description: 'Reforma e organização de quadro de disjuntores para maior segurança e eficiência.' },
    ]
  },
  {
    email: 'mariana.costa@email.com', name: 'Mariana Costa', type: 'prestador', bio: 'Pintora detalhista, especializada em acabamentos finos e decoração de interiores.', location: 'Rio de Janeiro, RJ', memberSince: '2023-04-05T00:00:00Z', status: 'ativo',
    headline: 'Pintora Residencial', specialties: ['Pintura decorativa', 'Texturização', 'Acabamentos'], hasCertificates: false, hasCriminalRecordCheck: true, availability: '3dias',
    verificationStatus: 'verificado', cpf: '222.333.444-55', address: 'Av. das Cores, 456, Rio de Janeiro, RJ',
    portfolio: [
        { id: 'p2-1', imageUrl: 'https://i.imgur.com/sEyHeC9.jpeg', title: 'Parede com Efeito Cimento Queimado', description: 'Aplicação de técnica de cimento queimado para um visual industrial e sofisticado.' },
    ]
  },
  {
    email: 'joao.pedreiro@email.com', name: 'João Souza', type: 'prestador', bio: 'Encanador experiente pronto para resolver vazamentos e realizar instalações.', location: 'Belo Horizonte, MG', memberSince: '2023-05-11T00:00:00Z', status: 'ativo',
    headline: 'Encanador', specialties: ['Reparo de vazamentos', 'Instalação hidráulica'], hasCertificates: true, hasCriminalRecordCheck: false, availability: 'imediata',
    verificationStatus: 'pendente', documentImage: 'https://via.placeholder.com/400x250.png?text=Documento+de+Jo%C3%A3o', cpf: '333.444.555-66', address: 'Rua dos Canos, 789, Belo Horizonte, MG'
  },
  {
    email: 'fernanda.design@email.com', name: 'Fernanda Lima', type: 'prestador', bio: 'Designer gráfica criativa com foco em identidade visual para pequenas empresas.', location: 'Curitiba, PR', memberSince: '2023-06-18T00:00:00Z', status: 'ativo',
    headline: 'Designer Gráfico', specialties: ['Logotipos', 'Branding', 'Mídias Sociais'], hasCertificates: true, hasCriminalRecordCheck: true, availability: '1semana',
    verificationStatus: 'verificado', cpf: '444.555.666-77', address: 'Al. da Criação, 101, Curitiba, PR'
  },
  {
      email: 'lucas.negado@email.com', name: 'Lucas Mendes', type: 'prestador', bio: 'Técnico de TI.', location: 'Florianópolis, SC', memberSince: '2023-07-01T00:00:00Z', status: 'ativo',
      headline: 'Técnico de Informática', verificationStatus: 'recusado'
  },

  // Admin
  { email: 'admin@servio.ai', name: 'Admin', type: 'admin', bio: 'Administrador da plataforma SERVIO.AI.', location: 'Matrix', memberSince: '2023-01-01T00:00:00Z', status: 'ativo' },

  // Novo prestador para onboarding
  { email: 'prestador-novo@servio.ai', name: 'Novo Prestador', type: 'prestador', bio: '', location: 'A definir', memberSince: new Date().toISOString(), status: 'ativo', verificationStatus: 'pendente' },
];

export const MOCK_JOBS: Job[] = [
  { 
    id: 'job-1', clientId: 'cliente@servio.ai', providerId: 'prestador@servio.ai', category: 'reparos', 
    description: 'Instalação de duas tomadas novas na parede da sala e verificação de um disjuntor que está caindo.',
  status: 'concluido', createdAt: new Date('2023-08-10T10:00:00Z').toISOString(), serviceType: 'personalizado', urgency: '3dias',
    address: 'Rua das Flores, 123, São Paulo, SP', jobMode: 'normal',
    review: { rating: 5, comment: 'Carlos foi excepcional! Muito profissional, rápido e o serviço ficou perfeito. Recomendo!', authorId: 'cliente@servio.ai', createdAt: new Date('2023-08-12T14:00:00Z').toISOString() }
  },
  { 
    id: 'job-2', clientId: 'rodrigo.souza@email.com', providerId: 'mariana.costa@email.com', category: 'reparos',
    description: 'Pintar um quarto de 12m², incluindo teto. As paredes estão em bom estado, somente a pintura será necessária.',
  status: 'pagamento_pendente', createdAt: new Date('2023-08-15T14:00:00Z').toISOString(), serviceType: 'personalizado', urgency: '1semana',
    address: 'Av. Copacabana, 456, Rio de Janeiro, RJ', jobMode: 'normal',
  },
  { 
    id: 'job-3', clientId: 'cliente@servio.ai', category: 'reparos',
    description: 'Vazamento no sifão da pia da cozinha. Preciso de um reparo urgente pois está alagando o armário.',
  status: 'ativo', createdAt: new Date().toISOString(), serviceType: 'diagnostico', urgency: 'hoje',
    address: 'Rua das Flores, 123, São Paulo, SP', jobMode: 'normal',
  },
  {
    id: 'job-4', clientId: 'rodrigo.souza@email.com', providerId: 'fernanda.design@email.com', category: 'design',
    description: 'Criação de um logotipo para minha nova cafeteria. Preciso de algo moderno e que remeta a café de qualidade.',
  status: 'em_progresso', createdAt: new Date('2023-08-18T09:00:00Z').toISOString(), serviceType: 'personalizado', urgency: '1semana',
    address: 'Trabalho Remoto', jobMode: 'normal',
  },
  {
    id: 'job-5', clientId: 'cliente@servio.ai', providerId: 'joao.pedreiro@email.com', category: 'reparos',
    description: 'O chuveiro do banheiro social não está esquentando. Acredito que a resistência queimou.',
  status: 'em_disputa', disputeId: 'disp-1', escrowId: 'esc-1', createdAt: new Date('2023-08-20T11:00:00Z').toISOString(), serviceType: 'personalizado', urgency: 'amanha',
    address: 'Rua das Flores, 123, São Paulo, SP', jobMode: 'normal',
  },
  { 
    id: 'job-6', clientId: 'rodrigo.souza@email.com', category: 'design',
    description: 'Preciso de um website institucional de 5 páginas para minha startup de tecnologia. Foco em design limpo, moderno e responsivo. Incluir formulário de contato.',
  status: 'em_leilao', createdAt: new Date().toISOString(), serviceType: 'personalizado', urgency: '1semana',
    address: 'Trabalho Remoto', jobMode: 'leilao', auctionEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  },
];

export const MOCK_BIDS: Bid[] = [
    { id: 'bid-1', jobId: 'job-6', providerId: 'fernanda.design@email.com', amount: 3500, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'bid-2', jobId: 'job-6', providerId: 'outro.designer@email.com', amount: 3250, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
];

export const MOCK_PROPOSALS: Proposal[] = [
    { id: 'prop-1', jobId: 'job-3', providerId: 'prestador@servio.ai', price: 150, message: 'Olá! Sou eletricista e posso verificar o vazamento na sua pia hoje mesmo.', status: 'pendente', createdAt: new Date().toISOString() },
    { id: 'prop-2', jobId: 'job-3', providerId: 'joao.pedreiro@email.com', price: 120, message: 'Boa tarde, sou encanador e tenho experiência com esse tipo de reparo. Posso ir agora.', status: 'pendente', createdAt: new Date().toISOString() },
    { id: 'prop-3', jobId: 'job-2', providerId: 'mariana.costa@email.com', price: 800, message: 'Olá Rodrigo, sou especialista em pintura de interiores e adoraria deixar seu quarto novo em folha.', status: 'aceita', createdAt: new Date('2023-08-16T10:00:00Z').toISOString()},
];

export const MOCK_MESSAGES: Message[] = [
    { id: 'msg-1', chatId: 'job-2', senderId: 'rodrigo.souza@email.com', text: 'Olá Mariana, proposta aceita! Quando podemos começar?', createdAt: new Date('2023-08-16T11:00:00Z').toISOString() },
    { id: 'msg-2', chatId: 'job-2', senderId: 'mariana.costa@email.com', text: 'Ótimo! Que tal na próxima segunda-feira, dia 21, às 9h?', createdAt: new Date('2023-08-16T11:05:00Z').toISOString() },
    { id: 'msg-3', chatId: 'job-2', senderId: 'rodrigo.souza@email.com', text: 'Combinado!', createdAt: new Date('2023-08-16T11:10:00Z').toISOString() },
];

export const MOCK_ITEMS: MaintainedItem[] = [
  { 
    id: 'item-1', clientId: 'cliente@servio.ai', name: 'Ar Condicionado Split', category: 'Eletrodomésticos',
    brand: 'LG', model: 'Dual Inverter 12000 BTU', serialNumber: 'LG123456789',
    imageUrl: 'https://i.imgur.com/rG7p9wB.jpeg',
    createdAt: '2023-01-20T00:00:00Z', // More than a year ago
    maintenanceHistory: []
  },
  { 
    id: 'item-2', clientId: 'cliente@servio.ai', name: 'Geladeira Frost Free', category: 'Eletrodomésticos',
    brand: 'Brastemp', model: 'BRE57AK', serialNumber: 'BR987654321',
    imageUrl: 'https://i.imgur.com/7c829oF.jpeg',
    notes: 'Comprada em 2022. Filtro trocado em janeiro.',
    createdAt: new Date().toISOString(), // Recent
    maintenanceHistory: []
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', userId: 'prestador@servio.ai', text: 'Você recebeu uma nova proposta para o job "Reparos".', isRead: false, createdAt: new Date().toISOString() },
  { id: 'notif-2', userId: 'cliente@servio.ai', text: 'Sua proposta para o job "Pintura" foi aceita!', isRead: true, createdAt: new Date(new Date().getTime() - 3600 * 1000 * 2).toISOString() }, // 2 hours ago
];

export const MOCK_FRAUD_ALERTS: FraudAlert[] = [
    { 
        id: 'fra-1', 
        providerId: 'prestador@servio.ai', 
        riskScore: 85, 
        reason: 'Enviou 5 propostas com preços muito abaixo do mercado para a categoria "reparos" em um curto período.', 
        status: 'novo', 
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    }
];
