/**
 * Authorization Middleware for Servio.AI Backend
 *
 * Provides granular permission checking for API endpoints
 * Validates user roles (client, provider, prospector, admin)
 * Ensures data ownership and role-based access control
 *
 * IMPORTANTE: A partir da Task 1.2, os roles são validados via Custom Claims
 * do Firebase Auth (req.user.role) em vez de consultas ao Firestore.
 * Isso elimina leituras desnecessárias e melhora performance.
 */

const admin = require('firebase-admin');

/**
 * Get current user from request
 * Priority: Firebase Auth (with custom claims) -> X-User-Email header (dev) -> null
 *
 * Quando req.user vem do Firebase Auth, ele contém:
 * - email: string
 * - uid: string
 * - role: string (custom claim definido na Task 1.1)
 */
async function getCurrentUser(req) {
  if (req.user?.email) return req.user;

  const injectedEmail = req.headers['x-user-email'];
  if (injectedEmail) {
    // Modo dev: buscar role do Firestore para manter compatibilidade
    const userDoc = await getUserDocForDevMode(injectedEmail);
    return {
      email: injectedEmail,
      role: userDoc?.type || 'cliente', // Fallback para cliente
    };
  }

  return null;
}

/**
 * Get user document from Firestore (SOMENTE para modo dev com x-user-email)
 * Em produção, os roles vêm dos custom claims do token Firebase Auth.
 *
 * @deprecated Use req.user.role (custom claim) em vez de buscar no Firestore
 */
async function getUserDocForDevMode(userEmail) {
  try {
    const doc = await admin.firestore().collection('users').doc(userEmail).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error(`Error fetching user ${userEmail}:`, error);
    return null;
  }
}

/**
 * OBSOLETO: Função mantida apenas para compatibilidade com código legado
 * @deprecated Use req.user.role (custom claim) em vez de getUserDoc()
 */
async function getUserDoc(userEmail) {
  console.warn(
    '[DEPRECATED] getUserDoc() chamado. Use req.user.role (custom claim) em vez de buscar no Firestore.'
  );
  return getUserDocForDevMode(userEmail);
}

/**
 * Middleware: Require authentication
 * Rejects requests without valid user
 */
function requireAuth(req, res, next) {
  if (!req.user?.email) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  }
  next();
}

/**
 * Middleware: Require specific role
 *
 * Valida o role do usuário usando Custom Claims do Firebase Auth (req.user.role)
 * em vez de buscar no Firestore. Isso elimina uma leitura desnecessária por requisição.
 *
 * Os custom claims são definidos automaticamente pela Cloud Function processUserSignUp
 * (Task 1.1) e podem ser atualizados via admin.auth().setCustomUserClaims().
 *
 * @param {string|string[]} roles - One or more allowed roles ('cliente', 'prestador', 'prospector', 'admin')
 */
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user?.email) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Valid authentication token required',
        });
      }

      // Validar role via custom claim (Task 1.2)
      const userRole = user.role;

      if (!userRole) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User role not found. Please contact support.',
        });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This action requires one of: ${roles.join(', ')}. Your role: ${userRole}`,
        });
      }

      // Anexar user ao request (já contém email, uid, role)
      req.user = user;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware: Require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware: Require data ownership
 * Validates that requesting user owns the resource (by email)
 * @param {string} paramName - Name of URL param containing the owner email (default: 'userId')
 */
function requireOwnership(paramName = 'userId') {
  return async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const targetEmail = req.params[paramName];
      if (user.email !== targetEmail) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own data',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware: Require job participation
 * Validates that user is client or provider of the job
 */
function requireJobParticipant() {
  return async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const jobId = req.params.jobId;
      if (!jobId) {
        return res.status(400).json({ error: 'Job ID required' });
      }

      const jobDoc = await admin.firestore().collection('jobs').doc(jobId).get();

      if (!jobDoc.exists) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const jobData = jobDoc.data();
      if (jobData.clientId !== user.email && jobData.providerId !== user.email) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not a participant in this job',
        });
      }

      req.user = user;
      req.jobData = jobData;
      next();
    } catch (error) {
      console.error('Job participant check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware: Require dispute participant
 * Validates user is involved in the dispute (admin, client, or provider)
 *
 * Usa custom claim (req.user.role) para verificar se é admin, eliminando
 * leitura desnecessária do Firestore (Task 1.2).
 */
function requireDisputeParticipant() {
  return async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const disputeId = req.params.disputeId;
      if (!disputeId) {
        return res.status(400).json({ error: 'Dispute ID required' });
      }

      const disputeDoc = await admin.firestore().collection('disputes').doc(disputeId).get();

      if (!disputeDoc.exists) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      const disputeData = disputeDoc.data();

      // Usar custom claim em vez de buscar no Firestore (Task 1.2)
      const isAdmin = user.role === 'admin';
      const isParticipant =
        disputeData.clientId === user.email || disputeData.providerId === user.email;

      if (!isAdmin && !isParticipant) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not involved in this dispute',
        });
      }

      req.user = user;
      req.disputeData = disputeData;
      next();
    } catch (error) {
      console.error('Dispute participant check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Validate request body has required fields
 * @param {string[]} fields - Required field names
 */
function validateBody(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => !(f in req.body));
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Sanitize user output
 * Removes sensitive fields from user objects before sending to client
 */
function sanitizeUser(userData) {
  const { password, ...safe } = userData;
  return safe;
}

/**
 * Log authorization check (for audit trail)
 */
function logAuthCheck(req, action, allowed) {
  const timestamp = new Date().toISOString();
  const user = req.user?.email || 'unknown';
  const status = allowed ? 'ALLOWED' : 'DENIED';
  console.log(`[${timestamp}] AUTH_${status}: ${user} attempted "${action}" on ${req.path}`);
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireOwnership,
  requireJobParticipant,
  requireDisputeParticipant,
  validateBody,
  getCurrentUser,
  getUserDoc,
  sanitizeUser,
  logAuthCheck,
};
