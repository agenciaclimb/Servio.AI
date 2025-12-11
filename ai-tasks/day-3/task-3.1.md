# Task 3.1 — Implementar sistema de tasks automático (ai-tasks/day-X/)

ID: 3.1
Protocolo: v4.0

Descrição:
Criação de um sistema automático para leitura e execução de tasks definidas em arquivos JSON.

Critérios de Aceitação:

- Sistema lê e parseia arquivos JSON de tasks
- Sistema valida o schema dos arquivos
- Sistema executa as ações descritas
- Sistema lida com erros apropriadamente
- Logging básico das ações executadas

Arquivos:

- Criar: `ai-tasks/task_manager.ts`, `ai-tasks/task_interface.ts`, `ai-tasks/task_manager.test.ts`
- Modificar: (nenhum)

Dependências: (nenhuma)
Esforço Estimado: 8h

Plano de Implementação:

1. Definir `Task` interface e schemas básicos
2. Implementar `TaskManager` com: carregar JSON, validar, executar handlers
3. Adicionar logging simples usando console + hooks para integrar logger posterior (Task 3.3)
4. Escrever testes unitários básicos com Vitest
5. Preparar branch `feature/task-3.1` e PR para auditoria Gemini

Observações:

- Integrar com futura camada de auditoria (Task 3.3)
- Arquitetura simples, extensível para ações como criação de arquivos, abrir issues, etc.
- Garantir que não dependa de serviços externos na primeira versão.
