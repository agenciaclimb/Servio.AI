/**
 * Interface para definição de Tasks do Protocolo Supremo v4.0
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  files_to_create: string[];
  files_to_modify: string[];
  dependencies: string[];
  estimated_effort: string;
  status?: TaskStatus;
  created_at?: Date;
  updated_at?: Date;
}

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface TaskExecutionResult {
  task_id: string;
  success: boolean;
  message: string;
  errors?: string[];
  logs?: string[];
  execution_time_ms?: number;
}

export interface TaskManagerConfig {
  tasks_directory: string;
  log_level: 'info' | 'warn' | 'error' | 'debug';
  enable_validation: boolean;
}

export interface TaskDay {
  day: number;
  protocol_version: string;
  tasks: Task[];
}
