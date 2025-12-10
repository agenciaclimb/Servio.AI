/**
 * Testes para Cloud Functions - processUserSignUp
 * 
 * Framework: firebase-functions-test
 * Docs: https://firebase.google.com/docs/functions/unit-testing
 */

const test = require('firebase-functions-test')();
const admin = require('firebase-admin');

describe('Cloud Functions - processUserSignUp', () => {
  let myFunctions;
  let adminInitStub;
  let setCustomUserClaimsStub;
  let firestoreSetStub;

  beforeAll(() => {
    // Stub Firebase Admin initialization
    adminInitStub = jest.spyOn(admin, 'initializeApp');
    
    // Mock Firestore
    firestoreSetStub = jest.fn().mockResolvedValue(undefined);
    const firestoreDocStub = jest.fn(() => ({
      set: firestoreSetStub
    }));
    const firestoreCollectionStub = jest.fn(() => ({
      doc: firestoreDocStub
    }));
    jest.spyOn(admin, 'firestore').mockReturnValue({
      collection: firestoreCollectionStub,
      FieldValue: {
        serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP')
      }
    });

    // Mock Auth
    setCustomUserClaimsStub = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(admin, 'auth').mockReturnValue({
      setCustomUserClaims: setCustomUserClaimsStub
    });

    // Import functions after mocking
    myFunctions = require('../index');
  });

  afterAll(() => {
    test.cleanup();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('processUserSignUp', () => {
    it('deve atribuir custom claim { role: "cliente" } para novo usuário', async () => {
      // Arrange
      const userRecord = {
        uid: 'test-uid-123',
        email: 'novousuario@example.com'
      };

      // Wrap the function
      const wrapped = test.wrap(myFunctions.processUserSignUp);

      // Act
      await wrapped(userRecord);

      // Assert
      expect(setCustomUserClaimsStub).toHaveBeenCalledTimes(1);
      expect(setCustomUserClaimsStub).toHaveBeenCalledWith('test-uid-123', {
        role: 'cliente'
      });
    });

    it('deve criar documento no Firestore com dados corretos', async () => {
      // Arrange
      const userRecord = {
        uid: 'test-uid-456',
        email: 'usuario@test.com'
      };

      const wrapped = test.wrap(myFunctions.processUserSignUp);

      // Act
      await wrapped(userRecord);

      // Assert
      expect(firestoreSetStub).toHaveBeenCalledTimes(1);
      expect(firestoreSetStub).toHaveBeenCalledWith(
        {
          uid: 'test-uid-456',
          email: 'usuario@test.com',
          type: 'cliente',
          createdAt: 'SERVER_TIMESTAMP',
          updatedAt: 'SERVER_TIMESTAMP',
          status: 'ativo'
        },
        { merge: true }
      );
    });

    it('deve usar email como document ID no Firestore', async () => {
      // Arrange
      const userRecord = {
        uid: 'test-uid-789',
        email: 'email-como-id@test.com'
      };

      const wrapped = test.wrap(myFunctions.processUserSignUp);

      // Mock para verificar document ID
      const docMock = jest.fn(() => ({
        set: firestoreSetStub
      }));
      const collectionMock = jest.fn(() => ({
        doc: docMock
      }));
      admin.firestore.mockReturnValue({
        collection: collectionMock,
        FieldValue: {
          serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP')
        }
      });

      // Act
      await wrapped(userRecord);

      // Assert
      expect(collectionMock).toHaveBeenCalledWith('users');
      expect(docMock).toHaveBeenCalledWith('email-como-id@test.com');
    });

    it('deve logar sucesso sem lançar erro mesmo se setCustomUserClaims falhar', async () => {
      // Arrange
      const userRecord = {
        uid: 'test-uid-error',
        email: 'error@test.com'
      };

      // Mock console.error para verificar logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simular erro no setCustomUserClaims
      setCustomUserClaimsStub.mockRejectedValueOnce(new Error('Auth service unavailable'));

      const wrapped = test.wrap(myFunctions.processUserSignUp);

      // Act & Assert - não deve lançar erro
      await expect(wrapped(userRecord)).resolves.not.toThrow();

      // Verificar que o erro foi logado
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[processUserSignUp]'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('deve processar múltiplos usuários de forma independente', async () => {
      // Arrange
      const users = [
        { uid: 'uid-1', email: 'user1@test.com' },
        { uid: 'uid-2', email: 'user2@test.com' },
        { uid: 'uid-3', email: 'user3@test.com' }
      ];

      const wrapped = test.wrap(myFunctions.processUserSignUp);

      // Act
      await Promise.all(users.map(user => wrapped(user)));

      // Assert
      expect(setCustomUserClaimsStub).toHaveBeenCalledTimes(3);
      expect(firestoreSetStub).toHaveBeenCalledTimes(3);

      // Verificar cada usuário recebeu role: 'cliente'
      users.forEach((user, index) => {
        expect(setCustomUserClaimsStub.mock.calls[index]).toEqual([
          user.uid,
          { role: 'cliente' }
        ]);
      });
    });
  });

  describe('isValidRole helper', () => {
    it('deve validar roles corretos', () => {
      expect(myFunctions.isValidRole('cliente')).toBe(true);
      expect(myFunctions.isValidRole('prestador')).toBe(true);
      expect(myFunctions.isValidRole('admin')).toBe(true);
      expect(myFunctions.isValidRole('prospector')).toBe(true);
    });

    it('deve rejeitar roles inválidos', () => {
      expect(myFunctions.isValidRole('invalid')).toBe(false);
      expect(myFunctions.isValidRole('user')).toBe(false);
      expect(myFunctions.isValidRole('')).toBe(false);
      expect(myFunctions.isValidRole(null)).toBe(false);
      expect(myFunctions.isValidRole(undefined)).toBe(false);
    });
  });
});
