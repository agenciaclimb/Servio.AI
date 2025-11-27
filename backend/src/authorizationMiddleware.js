/**
 * Authorization Middleware for Servio.AI Backend
 * 
 * Provides granular permission checking for API endpoints
 * Validates user roles (client, provider, prospector, admin)
 * Ensures data ownership and role-based access control
 */

const admin = require("firebase-admin");

/**
 * Get current user from request
 * Priority: Firebase Auth -> X-User-Email header (dev) -> null
 */
async function getCurrentUser(req) {
  if (req.user?.email) return req.user;
  
  const injectedEmail = req.headers['x-user-email'];
  if (injectedEmail) return { email: injectedEmail };
  
  return null;
}

/**
 * Get user document from Firestore
 */
async function getUserDoc(userEmail) {
  try {
    const doc = await admin.firestore()
      .collection('users')
      .doc(userEmail)
      .get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error(`Error fetching user ${userEmail}:`, error);
    return null;
  }
}

/**
 * Middleware: Require authentication
 * Rejects requests without valid user
 */
function requireAuth(req, res, next) {
  if (!req.user?.email) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid authentication token required'
    });
  }
  next();
}

/**
 * Middleware: Require specific role
 * @param {string|string[]} roles - One or more allowed roles
 */
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (!user?.email) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userDoc = await getUserDoc(user.email);
      if (!userDoc) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'User profile not found'
        });
      }

      if (!roles.includes(userDoc.type)) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `This action requires one of: ${roles.join(', ')}`
        });
      }

      req.user = user;
      req.userDoc = userDoc;
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
          message: 'You can only access your own data'
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

      const jobDoc = await admin.firestore()
        .collection('jobs')
        .doc(jobId)
        .get();

      if (!jobDoc.exists) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const jobData = jobDoc.data();
      if (jobData.clientId !== user.email && jobData.providerId !== user.email) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not a participant in this job'
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

      const disputeDoc = await admin.firestore()
        .collection('disputes')
        .doc(disputeId)
        .get();

      if (!disputeDoc.exists) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      const disputeData = disputeDoc.data();
      const userDoc = await getUserDoc(user.email);
      const isAdmin = userDoc?.type === 'admin';
      const isParticipant = 
        disputeData.clientId === user.email || 
        disputeData.providerId === user.email;

      if (!isAdmin && !isParticipant) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not involved in this dispute'
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
        message: `Missing required fields: ${missing.join(', ')}`
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
  logAuthCheck
};
