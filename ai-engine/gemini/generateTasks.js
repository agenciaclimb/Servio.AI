#!/usr/bin/env node

/**
 * GEMINI GENERATE TASKS
 * 
 * Gera especificações perfeitas de tasks a partir de backlog
 * 
 * USO:
 *   node generateTasks.js --backlog <arquivo.json>
 * 
 * SAÍDA:
 *   /ai-tasks/day-X/task-X.Y.md
 */

const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, '../../ai-tasks');

/**
 * Gera task em markdown estruturado
 */
function generateTask(taskSpec) {
  const taskId = taskSpec.id || 'X.X';
  const dayFolder = path.join(TASKS_DIR, `day-${Math.floor(taskSpec.day || 1)}`);

  // Cria diretório se não existir
  if (!fs.existsSync(dayFolder)) {
    fs.mkdirSync(dayFolder, { recursive: true });
  }

  const taskFile = path.join(dayFolder, `task-${taskId}.md`);
  const taskContent = formatTaskMarkdown(taskSpec);

  fs.writeFileSync(taskFile, taskContent);

  console.log(`✅ Task gerada: ${taskFile}`);
  return taskFile;
}

/**
 * Formata task em markdown estruturado
 */
function formatTaskMarkdown(spec) {
  return `# Task ${spec.id} — ${spec.titulo}

**Prioridade**: ${spec.prioridade || 'NORMAL'}  
**Estimativa**: ${spec.estimativa || '2h'}  
**Data Criação**: ${new Date().toISOString().split('T')[0]}

---

## Descrição

${spec.descricao}

---

## Especificação Técnica

### 1. Arquivos a Modificar/Criar

${(spec.arquivos || [])
  .map(f => `- \`${f}\``)
  .join('\n') || '- (Será determinado na implementação)'}

### 2. Alterações Exigidas

${(spec.alteracoes || [])
  .map(alt => `- **${alt.arquivo}**: ${alt.mudanca}`)
  .join('\n') || '- (Nenhuma alteração estrutural definida)'}

### 3. Testes Necessários

${(spec.testes || [])
  .map(t => `- ${t}`)
  .join('\n') || '- Unit tests para nova funcionalidade'}

### 4. Padrões a Respeitar

- ✅ TypeScript com tipos estritos
- ✅ Componentes React com interfaces Props
- ✅ Commits atômicos com mensagem [task-${spec.id}]
- ✅ Coverage de testes ≥ 80%
- ✅ Sem console.log em produção

---

## Critério de Sucesso

${(spec.criterios || [])
  .map(c => `- ✅ ${c}`)
  .join('\n') || `- ✅ Implementação exata da spec
- ✅ Testes passando
- ✅ Sem warnings de lint
- ✅ Pronto para produção`}

---

## Nota da Auditoria

Esta task foi **gerada por Gemini** e está pronta para execução pelo Copilot.

Seguir exatamente esta especificação. Não improvisar.

---

*Gerada em ${new Date().toISOString()} | Versão: 1.0*
`;
}

/**
 * Carrega tasks de um arquivo JSON e gera markdown
 */
function generateTasksFromBacklog(backlogFile) {
  if (!fs.existsSync(backlogFile)) {
    console.error(`❌ Arquivo não encontrado: ${backlogFile}`);
    process.exit(1);
  }

  const backlog = JSON.parse(fs.readFileSync(backlogFile, 'utf-8'));

  if (!Array.isArray(backlog.tasks)) {
    console.error('❌ Backlog deve ter array de "tasks"');
    process.exit(1);
  }

  const results = [];
  backlog.tasks.forEach(task => {
    try {
      const taskFile = generateTask(task);
      results.push({
        id: task.id,
        status: 'gerada',
        arquivo: taskFile,
      });
    } catch (error) {
      results.push({
        id: task.id,
        status: 'erro',
        erro: error.message,
      });
    }
  });

  console.log('\n--- RELATÓRIO DE GERAÇÃO ---');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// EXECUÇÃO
if (require.main === module) {
  const args = process.argv.slice(2);
  const backlogIndex = args.indexOf('--backlog');

  if (backlogIndex === -1) {
    console.error('USO: node generateTasks.js --backlog <arquivo.json>');
    process.exit(1);
  }

  const backlogFile = args[backlogIndex + 1];
  generateTasksFromBacklog(backlogFile);
}

module.exports = { generateTask, generateTasksFromBacklog };
