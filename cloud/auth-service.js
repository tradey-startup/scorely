/**
 * Authentication Service - JWT & Role-Based Access Control
 *
 * STEP 8: Sicurezza & Ruoli
 *
 * Features:
 * - JWT token generation and validation
 * - Role-based access control (RBAC)
 * - PIN authentication for CONTROLLER and ADMIN
 * - Token expiration and refresh
 *
 * Roles:
 * - DISPLAY: Read-only access, no authentication required
 * - CONTROLLER: Can control matches, requires PIN
 * - ADMIN: Full access including history/stats, requires PIN
 *
 * Run with: node auth-service.js
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'scorely_secret_key_change_in_production';
const JWT_EXPIRATION = '8h'; // Token expires after 8 hours

// Role definitions
const ROLES = {
  DISPLAY: 'display',      // View only, no auth
  CONTROLLER: 'controller', // Control match, needs PIN
  ADMIN: 'admin'           // Full access, needs PIN
};

// PIN configuration (in production, store in database with bcrypt)
// Default PINs (CHANGE THESE IN PRODUCTION!)
const DEFAULT_PINS = {
  controller: '1234', // Default controller PIN
  admin: '9999'       // Default admin PIN
};

// Hashed PINs (pre-computed for performance)
let HASHED_PINS = {};

/**
 * Initialize hashed PINs
 */
async function initializePINs() {
  console.log('🔐 Initializing authentication service...');

  HASHED_PINS.controller = await bcrypt.hash(DEFAULT_PINS.controller, 10);
  HASHED_PINS.admin = await bcrypt.hash(DEFAULT_PINS.admin, 10);

  console.log('✅ PINs initialized');
  console.log(`   Controller PIN: ${DEFAULT_PINS.controller} (CHANGE IN PRODUCTION!)`);
  console.log(`   Admin PIN: ${DEFAULT_PINS.admin} (CHANGE IN PRODUCTION!)`);
}

/**
 * Generate JWT token for a role
 *
 * @param {string} role - User role (display, controller, admin)
 * @param {object} metadata - Additional metadata to include in token
 * @returns {string} JWT token
 */
function generateToken(role, metadata = {}) {
  const payload = {
    role: role,
    timestamp: Date.now(),
    ...metadata
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'scorely-auth-service'
  });

  return token;
}

/**
 * Verify and decode JWT token
 *
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'scorely-auth-service'
    });
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return null;
  }
}

/**
 * Verify PIN for a role
 *
 * @param {string} role - Role to authenticate (controller or admin)
 * @param {string} pin - PIN to verify
 * @returns {Promise<boolean>} True if PIN is correct
 */
async function verifyPIN(role, pin) {
  if (role === ROLES.DISPLAY) {
    // Display role doesn't need PIN
    return true;
  }

  if (!HASHED_PINS[role]) {
    console.error(`❌ No PIN configured for role: ${role}`);
    return false;
  }

  try {
    const isValid = await bcrypt.compare(pin, HASHED_PINS[role]);
    return isValid;
  } catch (error) {
    console.error('❌ PIN verification error:', error.message);
    return false;
  }
}

/**
 * Authenticate user with role and PIN
 * Returns JWT token if authentication succeeds
 *
 * @param {string} role - Requested role
 * @param {string} pin - PIN (required for controller/admin)
 * @returns {Promise<object>} { success, token, error }
 */
async function authenticate(role, pin = null) {
  console.log(`\n🔐 Authentication attempt: role=${role}`);

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    console.log(`❌ Invalid role: ${role}`);
    return {
      success: false,
      error: 'Invalid role'
    };
  }

  // DISPLAY role doesn't need authentication
  if (role === ROLES.DISPLAY) {
    console.log('✅ Display role - no authentication required');
    const token = generateToken(role);
    return {
      success: true,
      token: token,
      role: role
    };
  }

  // CONTROLLER and ADMIN require PIN
  if (!pin) {
    console.log('❌ PIN required for this role');
    return {
      success: false,
      error: 'PIN required'
    };
  }

  // Verify PIN
  const isPINValid = await verifyPIN(role, pin);
  if (!isPINValid) {
    console.log('❌ Invalid PIN');
    return {
      success: false,
      error: 'Invalid PIN'
    };
  }

  // Generate token
  console.log('✅ Authentication successful');
  const token = generateToken(role, { authenticatedAt: Date.now() });

  return {
    success: true,
    token: token,
    role: role
  };
}

/**
 * Check if token has required role
 *
 * @param {string} token - JWT token
 * @param {string} requiredRole - Required role (display, controller, admin)
 * @returns {boolean} True if token has required role or higher
 */
function hasRole(token, requiredRole) {
  const decoded = verifyToken(token);
  if (!decoded) {
    return false;
  }

  const roleHierarchy = {
    [ROLES.DISPLAY]: 0,
    [ROLES.CONTROLLER]: 1,
    [ROLES.ADMIN]: 2
  };

  const userLevel = roleHierarchy[decoded.role] || -1;
  const requiredLevel = roleHierarchy[requiredRole] || 999;

  return userLevel >= requiredLevel;
}

/**
 * Express middleware to protect routes
 * Usage: app.get('/protected', authMiddleware(ROLES.CONTROLLER), handler)
 *
 * @param {string} requiredRole - Minimum required role
 * @returns {function} Express middleware
 */
function authMiddleware(requiredRole) {
  return (req, res, next) => {
    // Get token from Authorization header or query param
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check role
    if (!hasRole(token, requiredRole)) {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required: ${requiredRole}, You have: ${decoded.role}`
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  };
}

/**
 * Update PIN for a role (admin only)
 *
 * @param {string} role - Role to update PIN for
 * @param {string} newPin - New PIN
 * @returns {Promise<boolean>} Success
 */
async function updatePIN(role, newPin) {
  if (role === ROLES.DISPLAY) {
    console.log('⚠️  Display role does not use PIN');
    return false;
  }

  if (!Object.values(ROLES).includes(role)) {
    console.log(`❌ Invalid role: ${role}`);
    return false;
  }

  try {
    HASHED_PINS[role] = await bcrypt.hash(newPin, 10);
    console.log(`✅ PIN updated for role: ${role}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update PIN:', error.message);
    return false;
  }
}

/**
 * Get role permissions
 *
 * @param {string} role - Role to get permissions for
 * @returns {object} Permissions object
 */
function getRolePermissions(role) {
  const permissions = {
    [ROLES.DISPLAY]: {
      canView: true,
      canControl: false,
      canViewHistory: false,
      canManage: false
    },
    [ROLES.CONTROLLER]: {
      canView: true,
      canControl: true,
      canViewHistory: false,
      canManage: false
    },
    [ROLES.ADMIN]: {
      canView: true,
      canControl: true,
      canViewHistory: true,
      canManage: true
    }
  };

  return permissions[role] || permissions[ROLES.DISPLAY];
}

// Initialize on module load
initializePINs().catch(console.error);

// Export functions
module.exports = {
  ROLES,
  authenticate,
  generateToken,
  verifyToken,
  verifyPIN,
  hasRole,
  authMiddleware,
  updatePIN,
  getRolePermissions
};

// CLI test if run directly
if (require.main === module) {
  console.log('\n🧪 Auth Service Test Mode\n');
  console.log('Testing authentication...\n');

  (async () => {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 1: Display role (no PIN)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const displayAuth = await authenticate(ROLES.DISPLAY);
    console.log('Result:', displayAuth.success ? '✅ SUCCESS' : '❌ FAILED');
    if (displayAuth.token) {
      console.log('Token:', displayAuth.token.substring(0, 50) + '...');
      const verified = verifyToken(displayAuth.token);
      console.log('Token valid:', verified ? '✅' : '❌');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: Controller role (correct PIN)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const controllerAuth = await authenticate(ROLES.CONTROLLER, '1234');
    console.log('Result:', controllerAuth.success ? '✅ SUCCESS' : '❌ FAILED');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 3: Controller role (wrong PIN)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const wrongPIN = await authenticate(ROLES.CONTROLLER, '0000');
    console.log('Result:', wrongPIN.success ? '❌ SHOULD FAIL' : '✅ CORRECTLY REJECTED');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 4: Admin role (correct PIN)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const adminAuth = await authenticate(ROLES.ADMIN, '9999');
    console.log('Result:', adminAuth.success ? '✅ SUCCESS' : '❌ FAILED');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 5: Role permissions');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Display permissions:', getRolePermissions(ROLES.DISPLAY));
    console.log('Controller permissions:', getRolePermissions(ROLES.CONTROLLER));
    console.log('Admin permissions:', getRolePermissions(ROLES.ADMIN));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 6: hasRole checks');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (adminAuth.token) {
      console.log('Admin token has DISPLAY role:', hasRole(adminAuth.token, ROLES.DISPLAY) ? '✅' : '❌');
      console.log('Admin token has CONTROLLER role:', hasRole(adminAuth.token, ROLES.CONTROLLER) ? '✅' : '❌');
      console.log('Admin token has ADMIN role:', hasRole(adminAuth.token, ROLES.ADMIN) ? '✅' : '❌');
    }
    if (controllerAuth.token) {
      console.log('Controller token has DISPLAY role:', hasRole(controllerAuth.token, ROLES.DISPLAY) ? '✅' : '❌');
      console.log('Controller token has CONTROLLER role:', hasRole(controllerAuth.token, ROLES.CONTROLLER) ? '✅' : '❌');
      console.log('Controller token has ADMIN role:', hasRole(controllerAuth.token, ROLES.ADMIN) ? '❌ (correct)' : '✅ (wrong!)');
    }

    console.log('\n╔════════════════════════════════════╗');
    console.log('║  ✅ AUTH SERVICE TESTS COMPLETE   ║');
    console.log('╚════════════════════════════════════╝\n');

    process.exit(0);
  })();
}
