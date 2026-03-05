/* eslint-disable no-console */
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { execSync } from 'child_process';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Erro: GEMINI_API_KEY não configurada');
  process.exit(1);
}

async function auditPR26() {
  const client = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Obter diff do PR
  let prDiff = '';
  try {
    prDiff = execSync('gh pr diff 26', { encoding: 'utf-8' });
  } catch (error) {
    console.error('❌ Erro ao obter diff do PR:', error.message);
    process.exit(1);
  }

  // Ler Documento Mestre
  const _masterDoc = fs.readFileSync('DOCUMENTO_MESTRE_SERVIO_AI.md', 'utf-8');

  const prompt = `Tu és o Gemini, Auditor Global A+ do Protocolo Supremo v3.0 do Servio.AI.

Precisas fazer uma auditoria COMPLETA e RIGOROSA do PR #26 que implementa o Protocolo Supremo v4.0.

## CONTEXTO CRÍTICO:

Este PR foi criado APÓS a rejeição do PR #25. O Protocolo de Correção de Crise foi aplicado:
1. Documento Mestre foi REVERTIDO para v3.0
2. Protocolo v4.0 foi ISOLADO em branch dedicada (feature/protocolo-v4-isolado)
3. PR #26 foi CRIADO para auditoria formal do v4.0
4. Histórico de auditoria anterior foi PRESERVADO

## CÓDIGO DO PR #26:

\`\`\`diff
${prDiff.substring(0, 5000)}
\`\`\`

## INSTRUÇÕES DE AUDITORIA:

Verifica rigorosamente:

1. ✅ **Princípio Supremo**: Documento Mestre é fonte única? Conteúdo integrado corretamente?
2. ✅ **Hierarquia**: Gemini (Auditor), Copilot (Executor), Orchestrator (Motor) - claramente definidos?
3. ✅ **Ciclo Imutável**: 10 passos descritos corretamente? Ordem é respeitada?
4. ✅ **Arquitetura**: Impacto no ecossistema? Compatibilidade com fluxo existente?
5. ✅ **Rastreabilidade**: Git history preservado? Commits documentados?
6. ✅ **Duplicação**: Há duplicação de conteúdo? Arquivo standalone desnecessário?
7. ✅ **Branch**: Branch correta utilizada (feature/protocolo-v4-isolado)?
8. ✅ **Segurança**: Há exposição de secrets? API keys visíveis?

## SAÍDA OBRIGATÓRIA:

Gera um relatório estruturado com:

### VEREDITO: [APROVADO ✅ / REJEITADO ❌]

### ANÁLISE DETALHADA:
- Conformidade com Protocolo Supremo v3.0
- Pontos fortes do PR
- Violações encontradas (se houver)
- Recomendações de ajuste

### BLOCO DE ATUALIZAÇÃO:
Se aprovado, gera o bloco exato a ser adicionado ao Documento Mestre.

### PRÓXIMOS PASSOS:
Instruções claras para Copilot executar.

---

**Responda como o Gemini Auditor Global A+. Sê rigoroso. Sê justo. Sê definitivo.**`;

  try {
    console.log('🔍 Enviando PR #26 para auditoria do Gemini...\n');

    const result = await model.generateContent(prompt);
    const auditReport = result.response.text();

    // Salvar relatório
    fs.writeFileSync('automation_output/audit_PR_26.md', auditReport, 'utf-8');

    console.log('✅ Auditoria Completa!\n');
    console.log('=' + '='.repeat(79));
    console.log(auditReport);
    console.log('=' + '='.repeat(79));
    console.log('\n📄 Relatório salvo em: automation_output/audit_PR_26.md');
  } catch (error) {
    console.error('❌ Erro ao chamar Gemini API:', error.message);
    process.exit(1);
  }
}

auditPR26();
