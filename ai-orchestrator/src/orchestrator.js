#!/usr/bin/env node

/**
 * ORCHESTRATOR — Pipeline Autônomo da Software Factory
 * 
 * Responsabilidades:
 * - Carrega tasks de JSON
 * - Cria pastas day-X
 * - Roteia tasks para Copilot ou Gemini
 * - Registra histórico imutável
 * - Sincroniza com GitHub
 * 
 * USO:
 *   node orchestrator.js --tasks <arquivo.json>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '../../');
const TASKS_DIR = path.join(PROJECT_ROOT, 'ai-tasks');
const HISTORY_DIR = path.join(TASKS_DIR, 'history');
const LOGS_DIR = path.join(TASKS_DIR, 'logs');

// Garante diretórios
[HISTORY_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class Orchestrator {
  constructor() {
    this.tasks = [];
    this.history = [];
    this.startTime = Date.now();
  }

  /**
   * PASSO 1: Carrega tasks de arquivo JSON
   */
  loadTasksFromJSON(filePath) {
    console.log(`\n[ORCHESTRATOR] Carregando tasks de ${filePath}...`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de tasks não encontrado: ${filePath}`);
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    this.tasks = content.tasks || [];

    if (!Array.isArray(this.tasks)) {
      throw new Error('JSON deve conter array "tasks"');
    }

    console.log(`✅ ${this.tasks.length} task(s) carregada(s)`);
    return this.tasks;
  }

  /**
   * PASSO 2: Cria pasta day-X automaticamente
   */
  createDayFolder(dayNumber) {
    const dayFolder = path.join(TASKS_DIR, `day-${dayNumber}`);

    if (!fs.existsSync(dayFolder)) {
      fs.mkdirSync(dayFolder, { recursive: true });
      console.log(`✅ Pasta criada: ${dayFolder}`);
    }

    return dayFolder;
  }

  /**
   * PASSO 3: Roteia tasks para Copilot ou Gemini
   */
  routeTasksToCopilot(task) {
    console.log(`\n[ORCHESTRATOR] Roteando task ${task.id}...`);

    const day = task.day || 1;
    const dayFolder = this.createDayFolder(day);
    const taskFile = path.join(dayFolder, `task-${task.id}.md`);

    // Gera arquivo task-X.Y.md se não existir
    if (!fs.existsSync(taskFile)) {
      const taskContent = this.formatTaskMarkdown(task);
      fs.writeFileSync(taskFile, taskContent);
      console.log(`✅ Task file criado: ${taskFile}`);
    }

    // Registra roteamento
    this.registerAction({
      taskId: task.id,
      action: 'ROUTE_TO_COPILOT',
      taskFile,
      status: 'ENFILEIRADA',
    });

    return taskFile;
  }

  /**
   * PASSO 4: Registra histórico imutável
   */
  registerHistory(action) {
    const timestamp = new Date().toISOString();
    const historyEntry = {
      timestamp,
      ...action,
    };

    this.history.push(historyEntry);

    // Salva em arquivo JSON
    const dateStr = new Date().toISOString().split('T')[0];
    const historyFile = path.join(HISTORY_DIR, `${dateStr}.json`);

    let dayHistory = [];
    if (fs.existsSync(historyFile)) {
      dayHistory = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }

    dayHistory.push(historyEntry);
    fs.writeFileSync(historyFile, JSON.stringify(dayHistory, null, 2));

    console.log(`📋 Registrado em histórico: ${action.action}`);
  }

  /**
   * PASSO 5: Gera metadados de Pull Request
   */
  generatePullRequestMetadata(task) {
    const prTitle = `[task-${task.id}] ${task.titulo}`;
    const prBody = `
# Task ${task.id}

## Descrição
${task.descricao || 'N/A'}

## Checklist
- [ ] Código implementado conforme spec
- [ ] Testes adicionados e passando
- [ ] Linting ok
- [ ] Build compilando
- [ ] Coverage ≥ 80%

## Aguardando Auditoria
Esta PR aguarda aprovação do Gemini Auditor.

---
*Gerada automaticamente pelo Orchestrator*
`;

    return { prTitle, prBody };
  }

  /**
   * PASSO 6: Garante ciclo imutável
   */
  ensureImmutableCycle(task) {
    const required = [
      'id',
      'titulo',
      'descricao',
      'prioridade',
    ];

    const missing = required.filter(field => !task[field]);

    if (missing.length > 0) {
      throw new Error(`Task ${task.id} está incompleta. Faltam: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Formata task em markdown
   */
  formatTaskMarkdown(task) {
    return `# Task ${task.id} — ${task.titulo}

**Prioridade**: ${task.prioridade || 'NORMAL'}  
**Status**: Enfileirada  
**Data Criação**: ${new Date().toISOString().split('T')[0]}

---

## Descrição

${task.descricao}

---

## Padrões a Respeitar

- ✅ TypeScript com tipos estritos
- ✅ Componentes React com Props tipado
- ✅ Commits atômicos [task-${task.id}]
- ✅ Coverage ≥ 80%
- ✅ Sem console.log em produção

---

## Checklist de Execução

- [ ] Branch feature/task-${task.id} criada
- [ ] Código implementado
- [ ] Testes passando
- [ ] PR aberta
- [ ] Auditoria Gemini aprovada
- [ ] Merge realizado

---

*Gerada pelo Orchestrator em ${new Date().toISOString()}*
`;
  }

  /**
   * Registra ação
   */
  registerAction(action) {
    this.registerHistory(action);
  }

  /**
   * Processa fila de tasks
   */
  processTasks() {
    console.log(`\n[ORCHESTRATOR] Processando ${this.tasks.length} task(s)...`);

    this.tasks.forEach(task => {
      try {
        // Valida ciclo imutável
        this.ensureImmutableCycle(task);

        // Roteia para Copilot
        this.routeTasksToCopilot(task);

        // Gera metadata de PR
        const prMetadata = this.generatePullRequestMetadata(task);

        // Registra action
        this.registerAction({
          taskId: task.id,
          action: 'PROCESS_COMPLETE',
          status: 'SUCESSO',
          prTitle: prMetadata.prTitle,
        });

      } catch (error) {
        this.registerAction({
          taskId: task.id,
          action: 'PROCESS_ERROR',
          status: 'ERRO',
          error: error.message,
        });

        console.error(`❌ Erro processando task ${task.id}: ${error.message}`);
      }
    });

    console.log(`\n✅ Processamento concluído`);
    this.printSummary();
  }

  /**
   * Imprime resumo de execução
   */
  printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`ORCHESTRATOR — RESUMO DE EXECUÇÃO`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total de tasks: ${this.tasks.length}`);
    console.log(`Histórico registrado: ${this.history.length} ação(ões)`);
    console.log(`Duração: ${Date.now() - this.startTime}ms`);
    console.log(`${'='.repeat(60)}\n`);
  }
}

// EXECUÇÃO
if (require.main === module) {
  const args = process.argv.slice(2);
  const tasksIndex = args.indexOf('--tasks');

  if (tasksIndex === -1) {
    console.error('USO: node orchestrator.js --tasks <arquivo.json>');
    process.exit(1);
  }

  const tasksFile = args[tasksIndex + 1];

  try {
    const orchestrator = new Orchestrator();
    orchestrator.loadTasksFromJSON(tasksFile);
    orchestrator.processTasks();
  } catch (error) {
    console.error(`❌ ERRO FATAL: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { Orchestrator };
