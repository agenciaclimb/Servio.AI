import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('❌ Erro: GEMINI_API_KEY não configurada');
  process.exit(1);
}

const prompt = `Tu és o Gemini, planejador estratégico do Protocolo Supremo v4.0 do Servio.AI.

## CONTEXTO:

O Protocolo Supremo v4.0 foi APROVADO pelo Gemini e está agora ATIVO em main.

Documento Mestre v4.0 está ativo. Sistema pronto para Fase de Implementação.

## TAREFA:

Gera um JSON de **6 tasks** para o **Dia 3** que:

1. **Implementem incrementalmente** o Protocolo Supremo v4.0
2. **Sejam pequenas e auditáveis** (máximo 2-3 arquivos por task)
3. **Sigam ordem lógica** (dependências respeitadas)
4. **Incluam testes** para cada feature
5. **Tenham aceitação clara** (DoD - Definition of Done)

## FOCO DAS TASKS:

Dia 3 deve focar em:

- **Task 3.1**: Implementar sistema de tasks automático (ai-tasks/day-X/)
- **Task 3.2**: Integrar Gemini CLI com GitHub Actions
- **Task 3.3**: Criar protocolo de logging e auditoria
- **Task 3.4**: Implementar validação de Documento Mestre (parser)
- **Task 3.5**: Criar dashboard de status do Protocolo v4.0
- **Task 3.6**: Testes E2E do ciclo completo (10 passos)

## FORMATO DO JSON:

\`\`\`json
{
  "day": 3,
  "protocol_version": "4.0",
  "tasks": [
    {
      "id": "3.1",
      "title": "Task Title",
      "description": "Full description",
      "acceptance_criteria": ["✅ Criteria 1", "✅ Criteria 2"],
      "files_to_create": ["file1.ts", "file2.test.ts"],
      "files_to_modify": ["existing.ts"],
      "dependencies": ["2.4"],
      "estimated_effort": "4h",
      "security_notes": "Se aplicável"
    }
  ]
}
\`\`\`

## IMPORTANTE:

- JSON deve ser **válido e parseável**
- Cada task deve ter **descrição técnica completa**
- Aceitar critérios devem ser **específicos e mensuráveis**
- Esforço estimado deve ser **realista**
- Documentar **todas as dependências**

---

**Responde com APENAS o JSON válido, sem explicações adicionais.**`;

const generateTasksDay3 = async () => {
  const client = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const result = await model.generateContent(prompt);
  const tasksJson = result.response.text();

  // Extrair JSON se vier envolvido em markdown
  const jsonMatch = tasksJson.match(/```json\n([\s\S]*?)\n```/);
  const cleanJson = jsonMatch ? jsonMatch[1] : tasksJson;

  // Validar JSON
  const tasks = JSON.parse(cleanJson);

  // Salvar arquivo
  fs.writeFileSync('tasks-day-3-generated.json', JSON.stringify(tasks, null, 2));

  // eslint-disable-next-line no-console
  console.log('✅ Tasks geradas com sucesso!');
  // eslint-disable-next-line no-console
  console.log(`📊 Total: ${tasks.tasks.length} tasks`);

  return tasks;
};

generateTasksDay3()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error('❌ Erro:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
