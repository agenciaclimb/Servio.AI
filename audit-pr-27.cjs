/**
 * Script de auditoria do PR #27 (Task 3.1) via Gemini API
 * Protocolo Supremo v4.0
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { execSync } = require('child_process');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function auditPR27() {
  console.log('🔍 Iniciando auditoria do PR #27 (Task 3.1)...\n');

  // Obter diff do PR
  const diff = execSync('gh pr diff 27', { encoding: 'utf-8' });
  fs.writeFileSync('pr27_diff.txt', diff);

  // Carregar especificação da task
  const taskSpec = fs.readFileSync('ai-tasks/day-3/task-3.1.md', 'utf-8');
  const taskJson = JSON.parse(fs.readFileSync('tasks-day-3-generated.json', 'utf-8'));
  const task31 = taskJson.tasks.find(t => t.id === '3.1');

  const prompt = `# AUDITORIA DE PR — PROTOCOLO SUPREMO v4.0

## Contexto
Você é o **Auditor Global (Gemini)** responsável por validar PRs conforme o Protocolo Supremo v4.0.

## PR em Análise
- **Número**: #27
- **Task**: 3.1 — Implementar sistema de tasks automático
- **Branch**: feature/task-3.1 → main
- **Protocolo**: v4.0

## Especificação da Task
\`\`\`json
${JSON.stringify(task31, null, 2)}
\`\`\`

## Descrição Detalhada
${taskSpec}

## Diff do PR
\`\`\`diff
${diff.substring(0, 15000)}
\`\`\`

## Critérios de Auditoria (Protocolo Supremo v4.0)

### 1. Conformidade com Especificação
- [ ] Todos os arquivos especificados foram criados?
- [ ] Todos os critérios de aceitação foram atendidos?
- [ ] Funcionalidades implementadas conforme descrito?

### 2. Qualidade de Código
- [ ] TypeScript com tipagem adequada?
- [ ] Tratamento de erros robusto?
- [ ] Logging implementado?
- [ ] Código limpo e manutenível?

### 3. Testes
- [ ] Cobertura de testes adequada?
- [ ] Casos de teste cobrem cenários válidos e inválidos?
- [ ] Todos os testes passando?

### 4. Documentação
- [ ] Código comentado apropriadamente?
- [ ] Interfaces bem documentadas?
- [ ] README ou guias criados (se necessário)?

### 5. Impacto no Sistema
- [ ] Mudanças não quebram código existente?
- [ ] Integração futura planejada?
- [ ] Extensibilidade considerada?

### 6. Protocolo v4.0
- [ ] Processo de 10 passos seguido?
- [ ] Branch isolado usado?
- [ ] Commit messages claros?

## Sua Tarefa
Analise o PR #27 e retorne a auditoria no seguinte formato JSON:

\`\`\`json
{
  "veredito": "APROVADO" | "APROVADO_COM_RESSALVAS" | "REJEITADO",
  "conformidade": "TOTAL" | "PARCIAL" | "NENHUMA",
  "violacoes": [
    {
      "tipo": "CRÍTICA" | "MÉDIA" | "LEVE",
      "descricao": "...",
      "arquivo_linha": "..."
    }
  ],
  "pontos_fortes": ["..."],
  "recomendacoes": ["..."],
  "score": 0-10,
  "bloco_atualizacao": "### PR #27 — Task 3.1 Aprovado\\n\\n**Data**: ...\\n**Veredito**: ...\\n**Análise**: ...\\n**Pontos Fortes**: ...\\n**Próximos Passos**: ...",
  "proximos_passos": ["..."]
}
\`\`\`

**IMPORTANTE**: Seja rigoroso conforme o Protocolo Supremo v4.0. Zero tolerância para violações críticas.`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Extrair JSON da resposta
  const jsonMatch = response.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
  const auditResult = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(response);

  // Salvar resultado
  const reportPath = 'automation_output/audit_PR_27.md';
  fs.mkdirSync('automation_output', { recursive: true });
  fs.writeFileSync(reportPath, `# Auditoria PR #27 — Task 3.1

${response}

---
**Gerado em**: ${new Date().toISOString()}
**Auditor**: Gemini 2.0 Flash
**Protocolo**: v4.0
`);

  console.log('\n📊 Resultado da Auditoria:\n');
  console.log(`Veredito: ${auditResult.veredito}`);
  console.log(`Conformidade: ${auditResult.conformidade}`);
  console.log(`Score: ${auditResult.score}/10`);
  console.log(`Violações: ${auditResult.violacoes.length}`);
  console.log(`\nRelatório salvo em: ${reportPath}\n`);

  // Postar comentário no PR
  if (auditResult.veredito === 'APROVADO' || auditResult.veredito === 'APROVADO_COM_RESSALVAS') {
    const commentBody = `## 🟢 AUDITORIA APROVADA — PR #27

**Auditor**: Gemini 2.0 Flash (Protocolo Supremo v4.0)
**Data**: ${new Date().toISOString()}

### Veredito: ${auditResult.veredito} ✅
**Score**: ${auditResult.score}/10
**Conformidade**: ${auditResult.conformidade}

### Pontos Fortes
${auditResult.pontos_fortes.map(p => `- ${p}`).join('\n')}

${auditResult.recomendacoes.length > 0 ? `### Recomendações\n${auditResult.recomendacoes.map(r => `- ${r}`).join('\n')}` : ''}

${auditResult.violacoes.length > 0 ? `### Violações Encontradas\n${auditResult.violacoes.map(v => `- **[${v.tipo}]** ${v.descricao} (${v.arquivo_linha})`).join('\n')}` : '### ✅ Nenhuma violação encontrada'}

### Próximos Passos
${auditResult.proximos_passos.map(p => `1. ${p}`).join('\n')}

---

### Bloco de Atualização (Documento Mestre)
${auditResult.bloco_atualizacao}

**Autorização**: ✅ **MERGE APROVADO**`;

    execSync(`gh pr comment 27 --body "${commentBody.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  } else {
    const commentBody = `## 🔴 AUDITORIA REJEITADA — PR #27

**Auditor**: Gemini 2.0 Flash
**Veredito**: ${auditResult.veredito} ❌

### Violações Críticas
${auditResult.violacoes.filter(v => v.tipo === 'CRÍTICA').map(v => `- ${v.descricao} (${v.arquivo_linha})`).join('\n')}

**Ação Requerida**: Corrigir violações e solicitar nova auditoria.`;

    execSync(`gh pr comment 27 --body "${commentBody.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  }

  return auditResult;
}

auditPR27()
  .then(result => {
    console.log('\n✅ Auditoria concluída!');
    process.exit(result.veredito === 'APROVADO' || result.veredito === 'APROVADO_COM_RESSALVAS' ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Erro na auditoria:', error);
    process.exit(1);
  });
