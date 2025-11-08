/**
 * TESTE E2E - SPRINT 1
 * Fluxo: Cliente cria job → IA match → Notificação → Prestador propõe → Cliente aceita
 * 
 * REQUISITOS:
 * - Backend rodando em https://servio-backend-h5ogjon7aa-uw.a.run.app
 * - Firestore com dados de teste (users, providers)
 * - Frontend rodando em http://localhost:3000
 * 
 * NOTA: Usa fetch nativo do Node.js 18+
 */

const BACKEND_URL = 'https://servio-backend-h5ogjon7aa-uw.a.run.app';
const FRONTEND_URL = 'http://localhost:3000';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`PASSO ${step}: ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Dados de teste
const testClient = {
  email: 'test-client-sprint1@servio.ai',
  name: 'Cliente Teste Sprint 1',
  role: 'cliente'
};

const testProvider = {
  email: 'test-provider-sprint1@servio.ai',
  name: 'Prestador Teste Sprint 1',
  role: 'prestador',
  category: 'Limpeza',
  verified: true
};

const testJob = {
  category: 'Limpeza',
  description: 'Limpeza completa de apartamento 2 quartos',
  location: 'São Paulo, SP',
  scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 dias
  clientId: testClient.email
};

let createdJobId = null;
let createdProposalId = null;
let matchingResults = [];

// ============================================================================
// TESTE 1: Verificar Backend Online
// ============================================================================
async function test1_checkBackend() {
  logStep(1, 'Verificar Backend Online');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      logSuccess(`Backend online: ${data.status}`);
      log(`   Service: ${data.service}`, 'blue');
      log(`   Timestamp: ${data.timestamp}`, 'blue');
      return true;
    } else {
      logError(`Backend retornou status inválido: ${data.status}`);
      return false;
    }
  } catch (error) {
    logError(`Erro ao conectar backend: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTE 2: Criar Job via API
// ============================================================================
async function test2_createJob() {
  logStep(2, 'Criar Job via API (POST /jobs)');
  
  try {
    const response = await fetch(`${BACKEND_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testJob)
    });
    
    const data = await response.json();
    
    if (response.ok && data.id) {
      createdJobId = data.id;
      logSuccess(`Job criado com sucesso: ${createdJobId}`);
      log(`   Categoria: ${data.category}`, 'blue');
      log(`   Status: ${data.status}`, 'blue');
      log(`   Cliente: ${data.clientId}`, 'blue');
      return true;
    } else {
      logError(`Falha ao criar job: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logError(`Erro ao criar job: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTE 3: Chamar IA Matching
// ============================================================================
async function test3_matchProviders() {
  logStep(3, 'Chamar IA Matching (POST /api/match-providers)');
  
  if (!createdJobId) {
    logError('Teste 2 falhou - não há jobId para matching');
    return false;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/match-providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: createdJobId })
    });
    
    const data = await response.json();
    
    if (response.ok && Array.isArray(data.matches)) {
      matchingResults = data.matches;
      logSuccess(`Matching realizado: ${matchingResults.length} providers encontrados`);
      
      matchingResults.slice(0, 5).forEach((match, idx) => {
        log(`   ${idx + 1}. ${match.provider.name} - Score: ${match.score}`, 'blue');
        log(`      Razão: ${match.reason}`, 'blue');
      });
      
      return true;
    } else {
      logWarning(`Matching retornou resultado vazio ou inválido`);
      log(`   Response: ${JSON.stringify(data)}`, 'yellow');
      return false;
    }
  } catch (error) {
    logError(`Erro no matching: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTE 4: Verificar Notificações Criadas
// ============================================================================
async function test4_checkNotifications() {
  logStep(4, 'Verificar Notificações Criadas (GET /notifications)');
  
  try {
    const response = await fetch(`${BACKEND_URL}/notifications`);
    const notifications = await response.json();
    
    if (response.ok && Array.isArray(notifications)) {
      const recentNotifications = notifications.filter(n => 
        n.text && n.text.includes('novo job') && 
        new Date(n.createdAt) > new Date(Date.now() - 60000) // últimos 60s
      );
      
      logSuccess(`${recentNotifications.length} notificações recentes encontradas`);
      
      recentNotifications.slice(0, 3).forEach((notif, idx) => {
        log(`   ${idx + 1}. Para: ${notif.userId}`, 'blue');
        log(`      Texto: ${notif.text.substring(0, 60)}...`, 'blue');
      });
      
      return recentNotifications.length > 0;
    } else {
      logWarning('Nenhuma notificação encontrada');
      return false;
    }
  } catch (error) {
    logError(`Erro ao verificar notificações: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTE 5: Criar Proposta (simulando prestador)
// ============================================================================
async function test5_createProposal() {
  logStep(5, 'Criar Proposta via API (POST /proposals)');
  
  if (!createdJobId) {
    logError('Teste 2 falhou - não há jobId para proposta');
    return false;
  }
  
  const proposal = {
    jobId: createdJobId,
    providerId: testProvider.email,
    price: 150.00,
    message: 'Olá! Posso realizar a limpeza com excelência. Tenho 5 anos de experiência.',
    status: 'pendente',
    createdAt: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${BACKEND_URL}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal)
    });
    
    const data = await response.json();
    
    if (response.ok && data.id) {
      createdProposalId = data.id;
      logSuccess(`Proposta criada: ${createdProposalId}`);
      log(`   Prestador: ${data.providerId}`, 'blue');
      log(`   Preço: R$ ${data.price.toFixed(2)}`, 'blue');
      log(`   Status: ${data.status}`, 'blue');
      return true;
    } else {
      logError(`Falha ao criar proposta: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logError(`Erro ao criar proposta: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTE 6: Buscar Propostas do Job
// ============================================================================
async function test6_getProposals() {
  logStep(6, 'Buscar Propostas do Job (GET /proposals?jobId=X)');
  
  if (!createdJobId) {
    logError('Teste 2 falhou - não há jobId');
    return false;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/proposals?jobId=${createdJobId}`);
    const proposals = await response.json();
    
    if (response.ok && Array.isArray(proposals)) {
      const foundProposal = proposals.find(p => p.id === createdProposalId);
      
      if (foundProposal) {
        logSuccess(`Proposta encontrada na listagem`);
        log(`   Total de propostas: ${proposals.length}`, 'blue');
        log(`   ID: ${foundProposal.id}`, 'blue');
        log(`   Status: ${foundProposal.status}`, 'blue');
        return true;
      } else {
        logWarning(`Proposta ${createdProposalId} não encontrada na listagem`);
        log(`   Total retornado: ${proposals.length}`, 'yellow');
        return false;
      }
    } else {
      logError('Resposta inválida ao buscar propostas');
      return false;
    }
  } catch (error) {
    logError(`Erro ao buscar propostas: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTE 7: Aceitar Proposta
// ============================================================================
async function test7_acceptProposal() {
  logStep(7, 'Aceitar Proposta (PUT /proposals/:id)');
  
  if (!createdProposalId) {
    logError('Teste 5 falhou - não há proposalId');
    return false;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/proposals/${createdProposalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'aceita' })
    });
    
    const data = await response.json();
    
    if (response.ok && data.status === 'aceita') {
      logSuccess(`Proposta aceita com sucesso`);
      log(`   ID: ${data.id}`, 'blue');
      log(`   Status: ${data.status}`, 'blue');
      return true;
    } else {
      logError(`Falha ao aceitar proposta: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logError(`Erro ao aceitar proposta: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTE 8: Verificar Status do Job Atualizado
// ============================================================================
async function test8_checkJobStatus() {
  logStep(8, 'Verificar Status do Job (GET /jobs/:id)');
  
  if (!createdJobId) {
    logError('Teste 2 falhou - não há jobId');
    return false;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/jobs/${createdJobId}`);
    const job = await response.json();
    
    if (response.ok && job.id) {
      logSuccess(`Job encontrado: ${job.id}`);
      log(`   Status: ${job.status}`, 'blue');
      log(`   Provider ID: ${job.providerId || 'N/A'}`, 'blue');
      
      if (job.status === 'proposta_aceita' || job.providerId) {
        logSuccess('Job atualizado corretamente após aceite!');
        return true;
      } else {
        logWarning('Job não foi atualizado após aceite da proposta');
        log('   Status esperado: proposta_aceita', 'yellow');
        log(`   Status atual: ${job.status}`, 'yellow');
        return false;
      }
    } else {
      logError('Job não encontrado');
      return false;
    }
  } catch (error) {
    logError(`Erro ao verificar job: ${error.message}`);
    return false;
  }
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================
async function runAllTests() {
  log('\n' + '█'.repeat(60), 'cyan');
  log('█' + ' '.repeat(58) + '█', 'cyan');
  log('█' + '  TESTE E2E - SPRINT 1: Job → Proposta → Aceite  '.padEnd(58) + '█', 'cyan');
  log('█' + ' '.repeat(58) + '█', 'cyan');
  log('█'.repeat(60) + '\n', 'cyan');
  
  const results = {
    total: 8,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Executar testes em sequência
  const tests = [
    { name: 'Backend Online', fn: test1_checkBackend },
    { name: 'Criar Job', fn: test2_createJob },
    { name: 'IA Matching', fn: test3_matchProviders },
    { name: 'Notificações', fn: test4_checkNotifications },
    { name: 'Criar Proposta', fn: test5_createProposal },
    { name: 'Buscar Propostas', fn: test6_getProposals },
    { name: 'Aceitar Proposta', fn: test7_acceptProposal },
    { name: 'Verificar Job Status', fn: test8_checkJobStatus }
  ];
  
  for (const test of tests) {
    const success = await test.fn();
    results.tests.push({ name: test.name, success });
    if (success) results.passed++;
    else results.failed++;
  }
  
  // Resumo final
  log('\n' + '='.repeat(60), 'cyan');
  log('RESUMO DOS TESTES', 'cyan');
  log('='.repeat(60), 'cyan');
  
  results.tests.forEach((test, idx) => {
    const status = test.success ? '✅ PASS' : '❌ FAIL';
    const color = test.success ? 'green' : 'red';
    log(`${status} - Teste ${idx + 1}: ${test.name}`, color);
  });
  
  log('\n' + '='.repeat(60), 'cyan');
  log(`TOTAL: ${results.passed}/${results.total} testes passaram`, 
      results.passed === results.total ? 'green' : 'yellow');
  log('='.repeat(60) + '\n', 'cyan');
  
  // IDs criados para referência
  if (createdJobId || createdProposalId) {
    log('\n📋 IDs CRIADOS (para limpeza manual se necessário):', 'blue');
    if (createdJobId) log(`   Job ID: ${createdJobId}`, 'blue');
    if (createdProposalId) log(`   Proposal ID: ${createdProposalId}`, 'blue');
    log('');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Executar
runAllTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
