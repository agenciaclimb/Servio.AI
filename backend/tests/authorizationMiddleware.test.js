/**
 * Testes para Authorization Middleware (Task 1.2)
 *
 * Valida que o middleware usa custom claims (req.user.role)
 * em vez de consultar o Firestore para verificação de roles.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock completo do Firebase Admin
const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          type: 'admin',
          clientId: 'client@test.com',
          providerId: 'provider@test.com',
        }),
      }),
    })),
  })),
};

vi.mock('firebase-admin', () => ({
  default: {
    firestore: vi.fn(() => mockFirestore),
    initializeApp: vi.fn(),
  },
}));

// Importar as funções após o mock
const authMiddleware = await import('../src/authorizationMiddleware.js');
const { requireRole, requireAdmin, requireDisputeParticipant } = authMiddleware;

describe('Authorization Middleware - Task 1.2 (Custom Claims)', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: null,
      headers: {},
      params: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('requireRole with Custom Claims', () => {
    it('deve permitir acesso quando role do custom claim é válido', async () => {
      // Arrange: User com custom claim role: 'admin'
      mockReq.user = {
        email: 'admin@test.com',
        uid: 'uid-admin',
        role: 'admin', // Custom claim
      };

      const middleware = requireRole('admin');

      // Act
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve permitir acesso quando role está entre os permitidos', async () => {
      // Arrange
      mockReq.user = {
        email: 'prospector@test.com',
        uid: 'uid-prospector',
        role: 'prospector',
      };

      const middleware = requireRole('admin', 'prospector');

      // Act
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar quando role do custom claim não é permitido', async () => {
      // Arrange
      mockReq.user = {
        email: 'cliente@test.com',
        uid: 'uid-cliente',
        role: 'cliente',
      };

      const middleware = requireRole('admin', 'prospector');

      // Act
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: expect.stringContaining('This action requires one of: admin, prospector'),
      });
    });

    it('deve rejeitar quando user não tem role (custom claim ausente)', async () => {
      // Arrange: User sem custom claim role
      mockReq.user = {
        email: 'noroluser@test.com',
        uid: 'uid-norole',
        // role: undefined (ausente)
      };

      const middleware = requireRole('admin');

      // Act
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'User role not found. Please contact support.',
      });
    });

    it('deve rejeitar quando user não está autenticado', async () => {
      // Arrange: Sem user
      mockReq.user = null;

      const middleware = requireRole('admin');

      // Act
      await middleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
      });
    });

    it('deve NÃO buscar no Firestore quando custom claim está presente', async () => {
      // Este teste valida que não há chamadas ao Firestore
      // quando o role está no custom claim (objetivo da Task 1.2)

      // Arrange
      mockReq.user = {
        email: 'admin@test.com',
        uid: 'uid-admin',
        role: 'admin',
      };

      const middleware = requireRole('admin');

      // Spy para detectar se admin.firestore() foi chamado
      // (não deveria ser chamado pois role está no custom claim)
      const { default: admin } = await import('firebase-admin');
      const firestoreSpy = vi.spyOn(admin, 'firestore');

      // Act
      await middleware(mockReq, mockRes, mockNext);

      // Assert: Firestore NÃO deve ser chamado
      expect(firestoreSpy).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('requireAdmin with Custom Claims', () => {
    it('deve permitir acesso para admin via custom claim', async () => {
      // Arrange
      mockReq.user = {
        email: 'admin@test.com',
        uid: 'uid-admin',
        role: 'admin',
      };

      // Act
      await requireAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar não-admin via custom claim', async () => {
      // Arrange
      mockReq.user = {
        email: 'cliente@test.com',
        uid: 'uid-cliente',
        role: 'cliente',
      };

      // Act
      await requireAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Performance: Firestore Reads Reduction', () => {
    it('deve reduzir leituras do Firestore ao usar custom claims', async () => {
      // Este teste documenta o objetivo principal da Task 1.2:
      // Antes: requireRole fazia 1 leitura no Firestore por requisição
      // Depois: requireRole usa custom claim, 0 leituras no Firestore

      const { default: admin } = await import('firebase-admin');
      const firestoreSpy = vi.spyOn(admin, 'firestore');

      mockReq.user = {
        email: 'user@test.com',
        uid: 'uid-user',
        role: 'prospector',
      };

      const middleware = requireRole('prospector');
      await middleware(mockReq, mockRes, mockNext);

      // Assert: Nenhuma chamada ao Firestore
      expect(firestoreSpy).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
