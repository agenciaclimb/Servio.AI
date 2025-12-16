/**
 * Parser e Validador do Documento Mestre Servio.AI v4.0
 * Task 3.4 - Validação automática de estrutura e conteúdo
 */

import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface do Documento Mestre (subset para validação)
 */
export interface DocumentoMestre {
  metadata: {
    version: string;
    last_update: string;
    status: 'PRODUCAO' | 'DESENVOLVIMENTO' | 'MANUTENCAO';
  };
  system_status: {
    frontend: ComponentStatus;
    backend: ComponentStatus;
    database: ComponentStatus;
    tests: TestsStatus;
    cicd: ComponentStatus;
  };
  orchestrator: {
    status: 'PRODUCAO' | 'BETA' | 'ALPHA' | 'INATIVO';
    version: string;
    location: string;
    github_integration: boolean;
    metrics?: {
      files_created?: number;
      code_lines?: number;
      tasks_processed?: number;
    };
  };
  ai_workflow: {
    steps: WorkflowStep[];
  };
  tech_stack: {
    frontend: TechComponent;
    backend: TechComponent;
    database: TechComponent;
  };
  updates?: Update[];
}

interface ComponentStatus {
  status: '🟢' | '🟡' | '🔴';
  version: string;
  details?: string;
}

interface TestsStatus {
  status: '🟢' | '🟡' | '🔴';
  passing: number;
  total: number;
  coverage: number;
}

interface WorkflowStep {
  id: number;
  agent: 'GEMINI' | 'ORCHESTRATOR' | 'COPILOT' | 'MERGE';
  action: string;
}

interface TechComponent {
  framework?: string;
  language?: string;
  runtime?: string;
  type?: string;
  provider?: string;
  version?: string;
}

interface Update {
  date: string;
  pr_number: number;
  task_id: string;
  status: 'MERGED' | 'PENDENTE' | 'REJEITADO';
  score?: number;
}

/**
 * Resultado da validação
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    total_errors: number;
    total_warnings: number;
    sections_validated: number;
  };
}

export interface ValidationError {
  section: string;
  field: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface ValidationWarning {
  section: string;
  message: string;
}

/**
 * Parser do Documento Mestre
 */
export class DocumentoMestreParser {
  private ajv: Ajv;
  private schema: JSONSchemaType<DocumentoMestre> | null = null;
  private validate: ValidateFunction<DocumentoMestre> | null = null;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
  }

  /**
   * Carregar schema JSON
   */
  async loadSchema(schemaPath?: string): Promise<void> {
    const defaultPath = path.join(__dirname, '../schema.json');
    const finalPath = schemaPath || defaultPath;

    try {
      const schemaContent = fs.readFileSync(finalPath, 'utf-8');
      this.schema = JSON.parse(schemaContent) as JSONSchemaType<DocumentoMestre>;
      this.validate = this.ajv.compile(this.schema);
    } catch (error) {
      throw new Error(`Erro ao carregar schema: ${(error as Error).message}`);
    }
  }

  /**
   * Extrair dados estruturados do Markdown do Documento Mestre
   * (Versão simplificada - parse básico de seções)
   */
  parseMarkdownToJSON(markdownPath: string): Partial<DocumentoMestre> {
    const content = fs.readFileSync(markdownPath, 'utf-8');
    
    // Parse básico de seções (para MVP)
    const data: Partial<DocumentoMestre> = {
      metadata: {
        version: '0.0.0',
        last_update: '01/01/2000',
        status: 'DESENVOLVIMENTO',
      },
    };

    // Extrair versão (exemplo: **Versão**: 4.0.0)
    const versionMatch = content.match(/\*\*Versão\*\*:\s*([\d.]+)/);
    const dateMatch = content.match(/\*\*Última Atualização\*\*:\s*(\d{2}\/\d{2}\/\d{4})/);
    const statusMatch = content.match(/\*\*Status\*\*:\s*🟢\s*\*\*(\w+)/);

    // Sobrescrever valores default com dados extraídos
    if (versionMatch) data.metadata.version = versionMatch[1];
    if (dateMatch) data.metadata.last_update = dateMatch[1];
    if (statusMatch) data.metadata.status = statusMatch[1] as 'PRODUCAO' | 'DESENVOLVIMENTO';

    return data;
  }

  /**
   * Validar documento completo
   */
  async validateDocument(documentPath: string): Promise<ValidationResult> {
    if (!this.validate) {
      throw new Error('Schema não carregado. Chame loadSchema() primeiro.');
    }

    // Parse Markdown para JSON
    const parsedData = this.parseMarkdownToJSON(documentPath);

    // Validar contra schema
    const isValid = this.validate(parsedData as DocumentoMestre);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isValid && this.validate.errors) {
      for (const err of this.validate.errors) {
        const instancePath = err.instancePath || '';
        errors.push({
          section: instancePath.split('/')[1] || 'root',
          field: instancePath || 'unknown',
          message: err.message || 'Erro desconhecido',
          expected: err.params ? JSON.stringify(err.params) : undefined,
          actual: err.data ? String(err.data) : undefined,
        });
      }
    }

    // Validações customizadas
    this.performCustomValidations(parsedData, warnings);

    return {
      valid: isValid,
      errors,
      warnings,
      summary: {
        total_errors: errors.length,
        total_warnings: warnings.length,
        sections_validated: Object.keys(parsedData).length,
      },
    };
  }

  /**
   * Validações customizadas (business rules)
   */
  private performCustomValidations(
    data: Partial<DocumentoMestre>,
    warnings: ValidationWarning[]
  ): void {
    // Validação 1: Coverage de testes deve ser >= 80%
    if (data.system_status?.tests?.coverage && data.system_status.tests.coverage < 80) {
      warnings.push({
        section: 'system_status.tests',
        message: `Coverage de testes abaixo de 80% (atual: ${data.system_status.tests.coverage}%)`,
      });
    }

    // Validação 2: Status PRODUCAO exige todos componentes 🟢
    if (data.metadata?.status === 'PRODUCAO') {
      const components = ['frontend', 'backend', 'database', 'cicd'] as const;
      for (const comp of components) {
        const status = data.system_status?.[comp]?.status;
        if (status && status !== '🟢') {
          warnings.push({
            section: `system_status.${comp}`,
            message: `Componente ${comp} não está 🟢 em ambiente PRODUCAO (atual: ${status})`,
          });
        }
      }
    }

    // Validação 3: Orchestrator em PRODUCAO exige github_integration
    if (data.orchestrator?.status === 'PRODUCAO' && !data.orchestrator.github_integration) {
      warnings.push({
        section: 'orchestrator',
        message: 'Orchestrator em PRODUCAO sem integração GitHub ativada',
      });
    }

    // Validação 4: AI Workflow deve ter no mínimo 3 steps
    if (data.ai_workflow?.steps && data.ai_workflow.steps.length < 3) {
      warnings.push({
        section: 'ai_workflow',
        message: `AI Workflow possui apenas ${data.ai_workflow.steps.length} steps (mínimo: 3)`,
      });
    }
  }

  /**
   * Gerar relatório de validação em formato legível
   */
  generateReport(result: ValidationResult): string {
    let report = '='.repeat(60) + '\n';
    report += 'RELATÓRIO DE VALIDAÇÃO DO DOCUMENTO MESTRE v4.0\n';
    report += '='.repeat(60) + '\n\n';

    report += `✅ Status: ${result.valid ? 'VÁLIDO' : '❌ INVÁLIDO'}\n`;
    report += `📊 Seções Validadas: ${result.summary.sections_validated}\n`;
    report += `🔴 Erros: ${result.summary.total_errors}\n`;
    report += `🟡 Avisos: ${result.summary.total_warnings}\n\n`;

    if (result.errors.length > 0) {
      report += '🔴 ERROS ENCONTRADOS:\n';
      report += '-'.repeat(60) + '\n';
      for (const err of result.errors) {
        report += `  [${err.section}] ${err.field}\n`;
        report += `    └─ ${err.message}\n`;
        if (err.expected) {
          report += `    └─ Esperado: ${err.expected}\n`;
        }
        if (err.actual) {
          report += `    └─ Encontrado: ${err.actual}\n`;
        }
        report += '\n';
      }
    }

    if (result.warnings.length > 0) {
      report += '🟡 AVISOS:\n';
      report += '-'.repeat(60) + '\n';
      for (const warn of result.warnings) {
        report += `  [${warn.section}] ${warn.message}\n`;
      }
    }

    report += '\n' + '='.repeat(60) + '\n';
    return report;
  }
}

/**
 * Função auxiliar para validação rápida
 */
export async function validateDocumentoMestre(
  documentPath: string,
  schemaPath?: string
): Promise<ValidationResult> {
  const parser = new DocumentoMestreParser();
  await parser.loadSchema(schemaPath);
  return parser.validateDocument(documentPath);
}

export default DocumentoMestreParser;
