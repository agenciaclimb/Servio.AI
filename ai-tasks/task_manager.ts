/**
 * TaskManager - Sistema de gerenciamento de tasks do Protocolo Supremo v4.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  Task,
  TaskDay,
  TaskExecutionResult,
  TaskManagerConfig,
  TaskStatus,
} from './task_interface';

export class TaskManager {
  private config: TaskManagerConfig;
  private tasks: Map<string, Task> = new Map();

  constructor(config: Partial<TaskManagerConfig> = {}) {
    this.config = {
      tasks_directory: config.tasks_directory || './ai-tasks',
      log_level: config.log_level || 'info',
      enable_validation: config.enable_validation ?? true,
    };
  }

  /**
   * Carrega tasks de um arquivo JSON
   */
  async loadTasksFromFile(filePath: string): Promise<Task[]> {
    try {
      const absolutePath = path.resolve(filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Arquivo não encontrado: ${absolutePath}`);
      }

      const fileContent = fs.readFileSync(absolutePath, 'utf-8');
      const data = JSON.parse(fileContent) as TaskDay;

      if (this.config.enable_validation) {
        this.validateTaskDay(data);
      }

      // Armazena tasks no Map interno
      data.tasks.forEach(task => {
        task.status = task.status || TaskStatus.NOT_STARTED;
        task.created_at = task.created_at || new Date();
        this.tasks.set(task.id, task);
      });

      this.log('info', `✅ Carregadas ${data.tasks.length} tasks do arquivo ${filePath}`);
      return data.tasks;
    } catch (error) {
      this.log(
        'error',
        `❌ Erro ao carregar tasks: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Valida estrutura do TaskDay JSON
   */
  private validateTaskDay(data: TaskDay): void {
    if (!data.day || typeof data.day !== 'number') {
      throw new Error('Campo "day" inválido ou ausente');
    }

    if (!data.protocol_version || typeof data.protocol_version !== 'string') {
      throw new Error('Campo "protocol_version" inválido ou ausente');
    }

    if (!Array.isArray(data.tasks)) {
      throw new Error('Campo "tasks" deve ser um array');
    }

    data.tasks.forEach((task, index) => {
      this.validateTask(task, index);
    });
  }

  /**
   * Valida estrutura de uma Task individual
   */
  private validateTask(task: Task, index: number): void {
    const requiredFields = [
      'id',
      'title',
      'description',
      'acceptance_criteria',
      'files_to_create',
      'files_to_modify',
      'dependencies',
      'estimated_effort',
    ];

    requiredFields.forEach(field => {
      if (!(field in task)) {
        throw new Error(`Task[${index}]: campo obrigatório "${field}" ausente`);
      }
    });

    if (!Array.isArray(task.acceptance_criteria)) {
      throw new Error(`Task[${index}]: "acceptance_criteria" deve ser array`);
    }

    if (!Array.isArray(task.files_to_create)) {
      throw new Error(`Task[${index}]: "files_to_create" deve ser array`);
    }

    if (!Array.isArray(task.files_to_modify)) {
      throw new Error(`Task[${index}]: "files_to_modify" deve ser array`);
    }

    if (!Array.isArray(task.dependencies)) {
      throw new Error(`Task[${index}]: "dependencies" deve ser array`);
    }
  }

  /**
   * Retorna task por ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Lista todas as tasks carregadas
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Filtra tasks por status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  /**
   * Atualiza status de uma task
   */
  updateTaskStatus(taskId: string, status: TaskStatus): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.log('warn', `Task ${taskId} não encontrada`);
      return false;
    }

    task.status = status;
    task.updated_at = new Date();
    this.log('info', `Task ${taskId} status atualizado para ${status}`);
    return true;
  }

  /**
   * Executa handler de uma task (placeholder para extensão futura)
   */
  async executeTask(taskId: string): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const task = this.tasks.get(taskId);

    if (!task) {
      return {
        task_id: taskId,
        success: false,
        message: `Task ${taskId} não encontrada`,
        errors: ['Task não existe no gerenciador'],
      };
    }

    this.log('info', `🚀 Iniciando execução da task ${taskId}: ${task.title}`);
    this.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);

    try {
      // Placeholder: integração futura com Orchestrator/actions
      // Por enquanto apenas simula execução bem-sucedida
      await this.simulateExecution(task);

      this.updateTaskStatus(taskId, TaskStatus.COMPLETED);
      const executionTime = Date.now() - startTime;

      this.log('info', `✅ Task ${taskId} executada com sucesso em ${executionTime}ms`);

      return {
        task_id: taskId,
        success: true,
        message: `Task ${task.title} executada com sucesso`,
        execution_time_ms: executionTime,
        logs: [
          `Critérios de aceitação: ${task.acceptance_criteria.length}`,
          `Arquivos a criar: ${task.files_to_create.length}`,
        ],
      };
    } catch (error) {
      this.updateTaskStatus(taskId, TaskStatus.FAILED);
      const executionTime = Date.now() - startTime;

      this.log(
        'error',
        `❌ Falha na execução da task ${taskId}: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        task_id: taskId,
        success: false,
        message: `Falha na execução: ${error instanceof Error ? error.message : String(error)}`,
        errors: [error instanceof Error ? error.message : String(error)],
        execution_time_ms: executionTime,
      };
    }
  }

  /**
   * Simula execução (placeholder)
   */
  private async simulateExecution(task: Task): Promise<void> {
    // Simula delay de processamento
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simula validação de dependências
    if (task.dependencies.length > 0) {
      this.log('debug', `Verificando dependências: ${task.dependencies.join(', ')}`);
    }
  }

  /**
   * Sistema de logging simples
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', _message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.log_level];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      // const timestamp = new Date().toISOString();
      // const prefix = {
      //   info: 'ℹ️',
      //   warn: '⚠️',
      //   error: '❌',
      //   debug: '🔍',
      // }[level];

      // console.log(`[${timestamp}] ${prefix} [TaskManager] ${message}`);
    }
  }

  /**
   * Gera relatório de status
   */
  getStatusReport(): Record<string, unknown> {
    const tasks = this.getAllTasks();
    const byStatus = {
      not_started: this.getTasksByStatus(TaskStatus.NOT_STARTED).length,
      in_progress: this.getTasksByStatus(TaskStatus.IN_PROGRESS).length,
      completed: this.getTasksByStatus(TaskStatus.COMPLETED).length,
      failed: this.getTasksByStatus(TaskStatus.FAILED).length,
      blocked: this.getTasksByStatus(TaskStatus.BLOCKED).length,
    };

    return {
      total_tasks: tasks.length,
      by_status: byStatus,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        estimated_effort: t.estimated_effort,
      })),
    };
  }
}
