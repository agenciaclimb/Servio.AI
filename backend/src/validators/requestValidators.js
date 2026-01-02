/**
 * REQUEST VALIDATORS
 *
 * Validação rigorosa de entrada usando Zod
 * - Schemas para todos os endpoints críticos
 * - Validação de tipos, formatos e ranges
 * - Mensagens de erro estruturadas
 *
 * @module validators/requestValidators
 */

const { z } = require('zod');

/**
 * Schema para criação de job
 */
const createJobSchema = z.object({
  titulo: z
    .string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),

  descricao: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(5000, 'Descrição deve ter no máximo 5000 caracteres')
    .trim(),

  orcamento: z
    .number()
    .min(10, 'Orçamento mínimo é R$ 10')
    .max(999999, 'Orçamento máximo é R$ 999.999')
    .positive('Orçamento deve ser positivo'),

  localizacao: z
    .string()
    .min(3, 'Localização deve ter no mínimo 3 caracteres')
    .max(500, 'Localização deve ter no máximo 500 caracteres')
    .trim(),

  categoria: z.enum(
    ['design', 'dev', 'marketing', 'business', 'consultoria', 'escritor', 'tradutor', 'outro'],
    {
      errorMap: () => ({ message: 'Categoria inválida' }),
    }
  ),

  tags: z.array(z.string().max(50)).max(10, 'Máximo 10 tags').optional(),

  prazo: z.date().optional(),

  urgente: z.boolean().optional(),
});

/**
 * Schema para login
 */
const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo').toLowerCase().trim(),

  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres'),
});

/**
 * Schema para registro de usuário
 */
const registerSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z.string().email('Email inválido').max(255).toLowerCase().trim(),

  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número'),

  tipo: z.enum(['cliente', 'prestador'], {
    errorMap: () => ({ message: 'Tipo deve ser "cliente" ou "prestador"' }),
  }),

  telefone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido (formato internacional)')
    .optional(),

  cpfCnpj: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, 'CPF/CNPJ inválido')
    .optional(),
});

/**
 * Schema para pagamento
 */
const paymentSchema = z.object({
  jobId: z.string().length(28, 'Job ID inválido (deve ter 28 caracteres)'),

  amount: z.number().positive('Valor deve ser positivo').max(999999, 'Valor máximo é R$ 999.999'),

  currency: z.literal('BRL', {
    errorMap: () => ({ message: 'Apenas BRL é aceito' }),
  }),

  paymentMethodId: z.string().optional(),

  saveCard: z.boolean().optional(),
});

/**
 * Schema para proposta de prestador
 */
const proposalSchema = z.object({
  jobId: z.string().length(28),

  valor: z.number().positive('Valor deve ser positivo').max(999999, 'Valor máximo é R$ 999.999'),

  prazo: z
    .number()
    .int('Prazo deve ser um número inteiro')
    .min(1, 'Prazo mínimo é 1 dia')
    .max(365, 'Prazo máximo é 365 dias'),

  descricao: z
    .string()
    .min(20, 'Descrição deve ter no mínimo 20 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .trim(),

  portfolioLinks: z
    .array(z.string().url('Link de portfólio inválido'))
    .max(5, 'Máximo 5 links de portfólio')
    .optional(),
});

/**
 * Schema para atualização de perfil
 */
const updateProfileSchema = z.object({
  nome: z.string().min(2).max(100).trim().optional(),

  bio: z.string().max(500).trim().optional(),

  telefone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),

  endereco: z
    .object({
      rua: z.string().max(200),
      numero: z.string().max(10),
      complemento: z.string().max(100).optional(),
      bairro: z.string().max(100),
      cidade: z.string().max(100),
      estado: z.string().length(2),
      cep: z.string().regex(/^\d{5}-?\d{3}$/),
    })
    .optional(),

  skills: z.array(z.string().max(50)).max(20, 'Máximo 20 skills').optional(),

  hourlyRate: z.number().positive().max(10000).optional(),
});

/**
 * Schema para criação de review
 */
const reviewSchema = z.object({
  jobId: z.string().length(28),

  rating: z
    .number()
    .int('Rating deve ser inteiro')
    .min(1, 'Rating mínimo é 1')
    .max(5, 'Rating máximo é 5'),

  comentario: z
    .string()
    .min(10, 'Comentário deve ter no mínimo 10 caracteres')
    .max(1000, 'Comentário deve ter no máximo 1000 caracteres')
    .trim(),

  anonimo: z.boolean().optional(),
});

/**
 * Schema para busca de jobs
 */
const searchJobsSchema = z.object({
  query: z.string().max(200).trim().optional(),

  categoria: z.string().max(50).optional(),

  minOrcamento: z.number().positive().optional(),

  maxOrcamento: z.number().positive().optional(),

  localizacao: z.string().max(200).optional(),

  tags: z.array(z.string().max(50)).max(10).optional(),

  status: z.enum(['aberto', 'em_progresso', 'concluido', 'cancelado']).optional(),

  page: z.number().int().min(1).optional(),

  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Middleware genérico de validação
 * @param {z.ZodSchema} schema - Schema Zod para validação
 * @returns {Function} Express middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      // Validar e transformar dados
      const validated = schema.parse(req.body);

      // Substituir req.body pelos dados validados (sanitizados)
      req.validated = validated;
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Formatar erros do Zod de forma amigável
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: 'Validação falhou',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }

      // Erro inesperado
      console.error('[VALIDATION_ERROR]', error);
      return res.status(500).json({
        error: 'Erro interno na validação',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Middleware para validar query params
 * @param {z.ZodSchema} schema - Schema Zod
 * @returns {Function} Express middleware
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Query parameters inválidos',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }

      console.error('[QUERY_VALIDATION_ERROR]', error);
      return res.status(500).json({
        error: 'Erro interno na validação',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Schema helpers para tipos comuns
 */
const commonSchemas = {
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(8).max(128),
  id: z.string().length(28), // Firestore document ID
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  cpf: z.string().regex(/^\d{11}$/),
  cnpj: z.string().regex(/^\d{14}$/),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  url: z.string().url().max(2000),
  currency: z.literal('BRL'),
  date: z.coerce.date(), // Converte string para Date
  positiveNumber: z.number().positive(),
  percentage: z.number().min(0).max(100),
};

module.exports = {
  // Schemas
  createJobSchema,
  loginSchema,
  registerSchema,
  paymentSchema,
  proposalSchema,
  updateProfileSchema,
  reviewSchema,
  searchJobsSchema,

  // Middlewares
  validateRequest,
  validateQuery,

  // Helpers
  commonSchemas,
};
