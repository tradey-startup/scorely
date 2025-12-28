/**
 * API Service - REST API for Match History & Statistics
 *
 * This service provides HTTP endpoints for querying match history
 * and statistics. Used by the web app to display historical data.
 *
 * Endpoints:
 * - POST /auth/login - Authenticate and get JWT token
 * - GET  /auth/verify - Verify token validity
 * - GET  /health - Health check (public)
 * - GET  /api/matches - Get match history (public)
 * - GET  /api/matches/:id - Get single match (public)
 * - GET  /api/locations - Get all locations (public)
 * - GET  /api/stats/:locationId - Get location statistics (public)
 * - POST /api/locations - Create location (ADMIN only)
 * - DELETE /api/matches/:id - Delete match (ADMIN only)
 *
 * Run with: node api-service.js
 */

const express = require('express');
const cors = require('cors');

// Import database service
let database;
try {
  database = require('./database-service');
  console.log('✅ Database service loaded');
} catch (error) {
  console.error('❌ Failed to load database service:', error.message);
  console.error('   Make sure Firebase is configured');
  process.exit(1);
}

// Import auth service
const auth = require('./auth-service');
console.log('✅ Auth service loaded');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for web app
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * POST /auth/login
 * Authenticate and get JWT token
 *
 * Body:
 * {
 *   "role": "display|controller|admin",
 *   "pin": "1234" (optional for display)
 * }
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { role, pin } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const result = await auth.authenticate(role, pin);

    if (result.success) {
      res.json({
        success: true,
        token: result.token,
        role: result.role,
        permissions: auth.getRolePermissions(result.role)
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

/**
 * GET /auth/verify
 * Verify if token is valid
 */
app.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.query.token;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'No token provided'
    });
  }

  const decoded = auth.verifyToken(token);
  if (decoded) {
    res.json({
      success: true,
      valid: true,
      role: decoded.role,
      permissions: auth.getRolePermissions(decoded.role)
    });
  } else {
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Invalid or expired token'
    });
  }
});

/**
 * GET /health
 * Health check endpoint (public)
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-service',
    timestamp: Date.now(),
    database: database ? 'connected' : 'disconnected'
  });
});

/**
 * GET /api/matches
 * Get match history with optional filters
 *
 * Query parameters:
 * - locationId: Filter by location (optional)
 * - limit: Max number of results (default: 50, max: 100)
 * - offset: Skip N results (default: 0)
 * - orderBy: Field to sort by (default: endTime)
 * - order: Sort order asc/desc (default: desc)
 */
app.get('/api/matches', async (req, res) => {
  try {
    const {
      locationId,
      limit = 50,
      offset = 0,
      orderBy = 'endTime',
      order = 'desc'
    } = req.query;

    // Validate limit
    const validLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const validOffset = Math.max(parseInt(offset) || 0, 0);

    const options = {
      locationId,
      limit: validLimit,
      offset: validOffset,
      orderBy,
      order
    };

    console.log('📊 Fetching match history with options:', options);

    const matches = await database.getMatchHistory(options);

    res.json({
      success: true,
      count: matches.length,
      matches: matches,
      query: options
    });
  } catch (error) {
    console.error('❌ Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches',
      message: error.message
    });
  }
});

/**
 * GET /api/matches/:id
 * Get single match by ID
 */
app.get('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Fetching match: ${id}`);

    const match = await database.getMatchById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
        matchId: id
      });
    }

    res.json({
      success: true,
      match: match
    });
  } catch (error) {
    console.error('❌ Error fetching match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match',
      message: error.message
    });
  }
});

/**
 * GET /api/locations
 * Get all locations
 */
app.get('/api/locations', async (req, res) => {
  try {
    console.log('📍 Fetching all locations');

    const locations = await database.getLocations();

    res.json({
      success: true,
      count: locations.length,
      locations: locations
    });
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations',
      message: error.message
    });
  }
});

/**
 * GET /api/stats/:locationId
 * Get statistics for a location
 *
 * Query parameters:
 * - days: Number of days to include (default: 30)
 */
app.get('/api/stats/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { days = 30 } = req.query;

    const validDays = Math.min(Math.max(parseInt(days) || 30, 1), 365);

    console.log(`📈 Fetching stats for ${locationId} (${validDays} days)`);

    const stats = await database.getLocationStats(locationId, validDays);

    res.json({
      success: true,
      locationId: locationId,
      period: `${validDays} days`,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * DELETE /api/matches/:id
 * Delete a match by ID
 * (Admin only)
 */
app.delete('/api/matches/:id', auth.authMiddleware(auth.ROLES.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️  Deleting match: ${id}`);

    await database.deleteMatch(id);

    res.json({
      success: true,
      message: 'Match deleted successfully',
      matchId: id
    });
  } catch (error) {
    console.error('❌ Error deleting match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete match',
      message: error.message
    });
  }
});

/**
 * POST /api/locations
 * Create a new location
 * (Admin only)
 *
 * Body:
 * {
 *   "id": "campo_01",
 *   "name": "Campo 1",
 *   "address": "Via Example 123"
 * }
 */
app.post('/api/locations', auth.authMiddleware(auth.ROLES.ADMIN), async (req, res) => {
  try {
    const { id, name, address } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name'
      });
    }

    console.log(`➕ Creating location: ${id}`);

    const locationId = await database.createLocation({ id, name, address });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      locationId: locationId
    });
  } catch (error) {
    console.error('❌ Error creating location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create location',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 API Service Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server listening on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET    /api/matches        - Get match history`);
  console.log(`  GET    /api/matches/:id    - Get single match`);
  console.log(`  GET    /api/locations      - Get all locations`);
  console.log(`  GET    /api/stats/:locId   - Get location stats`);
  console.log(`  POST   /api/locations      - Create location`);
  console.log(`  DELETE /api/matches/:id    - Delete match`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🔴 Shutting down API service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🔴 Shutting down API service...');
  process.exit(0);
});
