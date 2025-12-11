/**
 * Testes unitários para TaskManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import { TaskManager } from '../ai-tasks/task_manager';
import { TaskStatus } from '../ai-tasks/task_interface';

// Mock do módulo fs
vi.mock('fs');

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager({
      log_level: 'error', // Silencia logs durante testes
    });
    vi.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve criar instância com configuração padrão', () => {
      const tm = new TaskManager();
      expect(tm).toBeDefined();
      expect(tm.getAllTasks()).toEqual([]);
    });

    it('deve aceitar configuração customizada', () => {
      const tm = new TaskManager({
        tasks_directory: './custom-tasks',
        log_level: 'debug',
        enable_validation: false,
      });
      expect(tm).toBeDefined();
    });
  });

  describe('loadTasksFromFile', () => {
    it('deve carregar tasks válidas de arquivo JSON', async () => {
      const mockData = {
        day: 3,
        protocol_version: '4.0',
        tasks: [
          {
            id: '3.1',
            title: 'Task de teste',
            description: 'Descrição teste',
            acceptance_criteria: ['Critério 1'],
            files_to_create: ['file1.ts'],
            files_to_modify: [],
            dependencies: [],
            estimated_effort: '2h',
          },
        ],
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));

      const tasks = await taskManager.loadTasksFromFile('test.json');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('3.1');
      expect(tasks[0].status).toBe(TaskStatus.NOT_STARTED);
    });

    it('deve lançar erro se arquivo não existir', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(taskManager.loadTasksFromFile('missing.json')).rejects.toThrow(
        /Arquivo não encontrado/
      );
    });

    it('deve lançar erro para JSON inválido', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');

      await expect(taskManager.loadTasksFromFile('invalid.json')).rejects.toThrow();
    });

    it('deve validar estrutura do TaskDay', async () => {
      const invalidData = {
        day: 3,
        // Falta protocol_version
        tasks: [],
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(invalidData));

      await expect(taskManager.loadTasksFromFile('test.json')).rejects.toThrow(
        /protocol_version/
      );
    });

    it('deve validar campos obrigatórios de Task', async () => {
      const invalidData = {
        day: 3,
        protocol_version: '4.0',
        tasks: [
          {
            id: '3.1',
            // Faltam campos obrigatórios
          },
        ],
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(invalidData));

      await expect(taskManager.loadTasksFromFile('test.json')).rejects.toThrow(
        /campo obrigatório/
      );
    });
  });

  describe('Gerenciamento de Tasks', () => {
    beforeEach(async () => {
      const mockData = {
        day: 3,
        protocol_version: '4.0',
        tasks: [
          {
            id: '3.1',
            title: 'Task 1',
            description: 'Desc 1',
            acceptance_criteria: ['C1'],
            files_to_create: [],
            files_to_modify: [],
            dependencies: [],
            estimated_effort: '2h',
          },
          {
            id: '3.2',
            title: 'Task 2',
            description: 'Desc 2',
            acceptance_criteria: ['C2'],
            files_to_create: [],
            files_to_modify: [],
            dependencies: ['3.1'],
            estimated_effort: '4h',
          },
        ],
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));

      await taskManager.loadTasksFromFile('test.json');
    });

    it('deve retornar task por ID', () => {
      const task = taskManager.getTask('3.1');
      expect(task).toBeDefined();
      expect(task?.title).toBe('Task 1');
    });

    it('deve retornar undefined para task inexistente', () => {
      const task = taskManager.getTask('999');
      expect(task).toBeUndefined();
    });

    it('deve listar todas as tasks', () => {
      const tasks = taskManager.getAllTasks();
      expect(tasks).toHaveLength(2);
    });

    it('deve filtrar tasks por status', () => {
      const notStarted = taskManager.getTasksByStatus(TaskStatus.NOT_STARTED);
      expect(notStarted).toHaveLength(2);

      const completed = taskManager.getTasksByStatus(TaskStatus.COMPLETED);
      expect(completed).toHaveLength(0);
    });

    it('deve atualizar status de task', () => {
      const result = taskManager.updateTaskStatus('3.1', TaskStatus.IN_PROGRESS);
      expect(result).toBe(true);

      const task = taskManager.getTask('3.1');
      expect(task?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task?.updated_at).toBeDefined();
    });

    it('deve retornar false ao atualizar task inexistente', () => {
      const result = taskManager.updateTaskStatus('999', TaskStatus.COMPLETED);
      expect(result).toBe(false);
    });
  });

  describe('executeTask', () => {
    beforeEach(async () => {
      const mockData = {
        day: 3,
        protocol_version: '4.0',
        tasks: [
          {
            id: '3.1',
            title: 'Task executável',
            description: 'Desc',
            acceptance_criteria: ['C1', 'C2'],
            files_to_create: ['file1.ts', 'file2.ts'],
            files_to_modify: [],
            dependencies: [],
            estimated_effort: '2h',
          },
        ],
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));

      await taskManager.loadTasksFromFile('test.json');
    });

    it('deve executar task com sucesso', async () => {
      const result = await taskManager.executeTask('3.1');

      expect(result.success).toBe(true);
      expect(result.task_id).toBe('3.1');
      expect(result.execution_time_ms).toBeGreaterThan(0);
      expect(result.logs).toBeDefined();

      const task = taskManager.getTask('3.1');
      expect(task?.status).toBe(TaskStatus.COMPLETED);
    });

    it('deve retornar erro para task inexistente', async () => {
      const result = await taskManager.executeTask('999');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('não existe');
    });
  });

  describe('getStatusReport', () => {
    beforeEach(async () => {
      const mockData = {
        day: 3,
        protocol_version: '4.0',
        tasks: [
          {
            id: '3.1',
            title: 'Task 1',
            description: 'Desc',
            acceptance_criteria: [],
            files_to_create: [],
            files_to_modify: [],
            dependencies: [],
            estimated_effort: '2h',
          },
          {
            id: '3.2',
            title: 'Task 2',
            description: 'Desc',
            acceptance_criteria: [],
            files_to_create: [],
            files_to_modify: [],
            dependencies: [],
            estimated_effort: '4h',
          },
        ],
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));

      await taskManager.loadTasksFromFile('test.json');
    });

    it('deve gerar relatório de status', () => {
      const report = taskManager.getStatusReport();

      expect(report.total_tasks).toBe(2);
      expect(report.by_status).toBeDefined();
      expect((report.by_status as Record<string, number>).not_started).toBe(2);
      expect(report.tasks).toHaveLength(2);
    });

    it('deve refletir mudanças de status no relatório', () => {
      taskManager.updateTaskStatus('3.1', TaskStatus.COMPLETED);

      const report = taskManager.getStatusReport();
      expect((report.by_status as Record<string, number>).completed).toBe(1);
      expect((report.by_status as Record<string, number>).not_started).toBe(1);
    });
  });
});
