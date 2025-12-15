#!/usr/bin/env node

/**
 * ORCHESTRATOR — Pipeline Autônomo com GitHub Integration
 * Integrado com Octokit para criar Issues automaticamente
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const { Octokit } = require('@octokit/rest');

const PROJECT_ROOT = path.join(__dirname, '../../');
const TASKS_DIR = path.join(PROJECT_ROOT, 'ai-tasks');
const HISTORY_DIR = path.join(TASKS_DIR, 'history');
const LOGS_DIR = path.join(TASKS_DIR, 'logs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'JE';
const GITHUB_REPO = process.env.GITHUB_REPO || 'servio.ai';

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

    if (GITHUB_TOKEN) {
      this.octokit = new Octokit({ auth: GITHUB_TOKEN });
      console.log(`✅ GitHub API inicializado`);
    } else {
      this.octokit = null;
    }
  }

  loadTasksFromJSON(filePath) {
    console.log(`\n[ORCHESTRATOR] Carregando tasks de ${filePath}...`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    this.tasks = content.tasks || [];

    if (!Array.isArray(this.tasks)) {
      throw new Error('JSON deve conter array "tasks"');
    }

    console.log(`✅ ${this.tasks.length} task(s) carregada(s)`);
    return this.tasks;
  }

  createDayFolder(dayNumber) {
    const dayFolder = path.join(TASKS_DIR, `day-${dayNumber}`);
    if (!fs.existsSync(dayFolder)) {
      fs.mkdirSync(dayFolder, { recursive: true });
      console.log(`✅ Pasta criada: ${dayFolder}`);
    }
    return dayFolder;
  }

  async createGitHubIssue(task) {
    if (!this.octokit) {
      console.log(`⚠️ GitHub não configurado, pulando Issue`);
      return null;
    }

    try {
      const issueTitle = `[task-${task.id}] ${task.titulo}`;
      const issueBody = `# ${task.titulo}

**ID**: ${task.id}  
**Prioridade**: ${task.prioridade || 'NORMAL'}  
**Estimativa**: ${task.estimativa || 'N/A'}  

## Descrição
${task.descricao || 'Sem descrição'}

## Objetivo
${task.objetivo || 'N/A'}

## Checklist
- [ ] Código implementado
- [ ] Testes passando (coverage ≥ 80%)
- [ ] Linting ok
- [ ] Build compilando

---

*Gerada automaticamente pelo Orchestrator em ${new Date().toISOString()}*
`;

      const response = await this.octokit.issues.create({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        title: issueTitle,
        body: issueBody,
        labels: ['task', `priority/${(task.prioridade || 'normal').toLowerCase()}`],
      });

      const issueNumber = response.data.number;
      console.log(`✅ GitHub Issue criada: #${issueNumber}`);
      return issueNumber;
    } catch (error) {
      console.warn(`⚠️ Erro criando Issue: ${error.message}`);
      return null;
    }
  }

  routeTasksToCopilot(task, issueNumber) {
    console.log(`\n[ORCHESTRATOR] Roteando task ${task.id}...`);

    const day = task.day || 1;
    const dayFolder = this.createDayFolder(day);
    const taskFile = path.join(dayFolder, `task-${task.id}.md`);

    if (!fs.existsSync(taskFile)) {
      const taskContent = this.formatTaskMarkdown(task, issueNumber);
      fs.writeFileSync(taskFile, taskContent);
      console.log(`✅ Task file criado: ${taskFile}`);
    } else if (issueNumber) {
      let content = fs.readFileSync(taskFile, 'utf-8');
      if (!content.includes(`#${issueNumber}`)) {
        const issueLink = `\n\n---\n**GitHub Issue**: [#${issueNumber}](https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber})`;
        fs.writeFileSync(taskFile, content + issueLink);
        console.log(`✅ Issue #${issueNumber} adicionada ao .md`);
      }
    }

    this.registerHistory({
      taskId: task.id,
      action: 'ROUTE_TO_COPILOT',
      taskFile,
      issueNumber: issueNumber || null,
      status: 'ENFILEIRADA',
    });

    return taskFile;
  }

  registerHistory(action) {
    const timestamp = new Date().toISOString();
    const historyEntry = { timestamp, ...action };

    this.history.push(historyEntry);

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

  formatTaskMarkdown(task, issueNumber) {
    let md = `# ${task.titulo}

**ID**: ${task.id}  
**Prioridade**: ${task.prioridade || 'NORMAL'}  
**Estimativa**: ${task.estimativa || 'N/A'}  
**Dia**: day-${task.day || 1}  
`;

    if (issueNumber) {
      md += `**GitHub Issue**: [#${issueNumber}](https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber})  \n`;
    }

    md += `
## Descrição
${task.descricao || 'Sem descrição'}

## Objetivo
${task.objetivo || 'N/A'}

## Tipo
${task.tipo || 'feature'}

## Checklist
- [ ] Implementado
- [ ] Testes passando (coverage ≥ 80%)
- [ ] Linting ok
- [ ] Build compilando

---

*Gerada pelo Orchestrator em ${new Date().toISOString()}*
`;
    return md;
  }

  async processTasks() {
    console.log(`\n[ORCHESTRATOR] Processando ${this.tasks.length} task(s)...`);

    for (const task of this.tasks) {
      try {
        if (!task.id || !task.titulo) {
          throw new Error('Task inválida: faltam id ou titulo');
        }

        const issueNumber = await this.createGitHubIssue(task);
        this.routeTasksToCopilot(task, issueNumber);

        this.registerHistory({
          taskId: task.id,
          action: 'PROCESS_COMPLETE',
          status: 'SUCESSO',
          issueNumber: issueNumber || null,
        });

      } catch (error) {
        this.registerHistory({
          taskId: task.id,
          action: 'PROCESS_ERROR',
          status: 'ERRO',
          error: error.message,
        });

        console.error(`❌ Erro processando task ${task.id}: ${error.message}`);
      }
    }

    console.log(`\n✅ Processamento concluído`);
    this.printSummary();
  }

  printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`ORCHESTRATOR — RESUMO DE EXECUÇÃO`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total de tasks: ${this.tasks.length}`);
    console.log(`Histórico registrado: ${this.history.length} ação(ões)`);
    console.log(`Duração: ${Date.now() - this.startTime}ms`);
    console.log(`GitHub: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    console.log(`${'='.repeat(60)}\n`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const tasksIndex = args.indexOf('--tasks');

  if (tasksIndex === -1) {
    console.error('USO: node orchestrator.cjs --tasks <arquivo.json>');
    process.exit(1);
  }

  const tasksFile = args[tasksIndex + 1];

  try {
    const orchestrator = new Orchestrator();
    orchestrator.loadTasksFromJSON(tasksFile);
    orchestrator.processTasks().then(() => {
      process.exit(0);
    }).catch(error => {
      console.error(`❌ ERRO FATAL: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`❌ ERRO FATAL: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { Orchestrator };
