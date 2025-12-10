/**
 * Firebase Cloud Functions
 * 
 * Este arquivo contém todas as Cloud Functions do Servio.AI
 * Organizadas por categoria: Auth, Firestore, HTTP, Scheduled
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function: processUserSignUp
 * 
 * Trigger: auth.user().onCreate()
 * Objetivo: Atribuir custom claim inicial { role: 'cliente' } ao novo usuário
 * 
 * Custom Claims são usados para:
 * - Controle de acesso baseado em roles (RBAC)
 * - Autorização em Firestore Rules
 * - Middleware de autenticação no backend
 * 
 * @param {admin.auth.UserRecord} user - Objeto do usuário criado
 * @returns {Promise<void>}
 */
exports.processUserSignUp = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email;

  try {
    // Log inicial
    console.log(`[processUserSignUp] Processando novo usuário: ${email} (UID: ${uid})`);

    // Atribuir custom claim inicial
    // Por padrão, todo novo usuário é um 'cliente'
    const customClaims = {
      role: 'cliente'
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    console.log(`[processUserSignUp] ✅ Custom claim atribuído com sucesso para ${email}: role=cliente`);

    // Opcional: Criar documento inicial na coleção users
    // Isso garante consistência entre Auth e Firestore
    const db = admin.firestore();
    await db.collection('users').doc(email).set({
      uid: uid,
      email: email,
      type: 'cliente', // Alinhado com custom claim 'role'
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'ativo'
    }, { merge: true });

    console.log(`[processUserSignUp] ✅ Documento Firestore criado/atualizado para ${email}`);

  } catch (error) {
    console.error(`[processUserSignUp] ❌ Erro ao processar usuário ${email}:`, error);
    
    // Não fazer throw do erro para não bloquear a criação do usuário
    // A função falha silenciosamente e pode ser reprocessada via backfill script
  }
});

/**
 * Função auxiliar para validação de roles
 * 
 * Roles válidos no Servio.AI:
 * - cliente: Usuário padrão que contrata serviços
 * - prestador: Prestador de serviços
 * - prospector: Usuário com acesso a ferramentas de prospecção
 * - admin: Administrador do sistema
 */
function isValidRole(role) {
  const validRoles = ['cliente', 'prestador', 'prospector', 'admin'];
  return validRoles.includes(role);
}

// Exportar função auxiliar para uso em outros módulos
exports.isValidRole = isValidRole;
