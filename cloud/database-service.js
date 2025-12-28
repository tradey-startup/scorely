/**
 * Database Service - Firebase Firestore Integration
 *
 * STEP 7: Storico Partite & Location
 *
 * Responsibilities:
 * 1. Save completed matches to Firestore
 * 2. Query match history by location
 * 3. Manage locations (CRUD)
 * 4. Provide statistics
 *
 * Run standalone: node database-service.js
 * Or import: const db = require('./database-service.js')
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// For local testing, use service account key
// For production, Firebase Functions will auto-initialize

let firestore;

function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      // Try to load service account from environment or file
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                                  './firebase-service-account.json';

      try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase initialized with service account');
      } catch (error) {
        // Fallback to default credentials (works on Cloud Functions)
        admin.initializeApp();
        console.log('✅ Firebase initialized with default credentials');
      }
    }

    firestore = admin.firestore();

    // Disable offline persistence for server-side
    firestore.settings({
      ignoreUndefinedProperties: true,
    });

    return firestore;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    throw error;
  }
}

// Initialize on module load
initializeFirebase();

/**
 * Firestore Collections Structure:
 *
 * /locations/{locationId}
 *   - name: string
 *   - address: string (optional)
 *   - active: boolean
 *   - createdAt: timestamp
 *
 * /matches/{matchId}
 *   - sessionId: string
 *   - locationId: string
 *   - startTime: timestamp
 *   - endTime: timestamp
 *   - duration: number (seconds)
 *   - finalScore: { team1: number, team2: number }
 *   - winner: 'team1' | 'team2' | 'draw'
 *   - pairedDevices: array of { deviceId, team }
 *   - totalEvents: number
 *   - createdAt: timestamp
 *
 * /sessions/{sessionId} (optional, for active sessions)
 *   - locationId: string
 *   - status: 'waiting' | 'running' | 'ended'
 *   - currentScore: { team1, team2 }
 *   - createdAt: timestamp
 *   - lastUpdated: timestamp
 */

// ============================================
// MATCH OPERATIONS
// ============================================

/**
 * Save a completed match to Firestore
 *
 * @param {Object} matchData - Match data to save
 * @param {string} matchData.sessionId - Session ID
 * @param {string} matchData.locationId - Location ID (default: 'default')
 * @param {number} matchData.startTime - Match start timestamp
 * @param {number} matchData.endTime - Match end timestamp
 * @param {Object} matchData.finalScore - Final score { team1, team2 }
 * @param {Array} matchData.pairedDevices - Array of paired devices
 * @param {number} matchData.totalEvents - Total score events
 * @returns {Promise<string>} - Match ID
 */
async function saveMatch(matchData) {
  try {
    const {
      sessionId,
      locationId = 'default',
      startTime,
      endTime,
      finalScore,
      pairedDevices = [],
      totalEvents = 0
    } = matchData;

    // Validate required fields
    if (!sessionId || !startTime || !endTime || !finalScore) {
      throw new Error('Missing required match data');
    }

    // Calculate duration in seconds
    const duration = Math.floor((endTime - startTime) / 1000);

    // Determine winner
    let winner = 'draw';
    if (finalScore.team1 > finalScore.team2) {
      winner = 'team1';
    } else if (finalScore.team2 > finalScore.team1) {
      winner = 'team2';
    }

    // Create match document
    const match = {
      sessionId,
      locationId,
      startTime: admin.firestore.Timestamp.fromMillis(startTime),
      endTime: admin.firestore.Timestamp.fromMillis(endTime),
      duration,
      finalScore,
      winner,
      pairedDevices,
      totalEvents,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save to Firestore
    const matchRef = await firestore.collection('matches').add(match);

    console.log(`✅ Match saved: ${matchRef.id} (${finalScore.team1}-${finalScore.team2}, winner: ${winner})`);

    return matchRef.id;
  } catch (error) {
    console.error('❌ Failed to save match:', error.message);
    throw error;
  }
}

/**
 * Get match by ID
 *
 * @param {string} matchId - Match ID
 * @returns {Promise<Object>} - Match data
 */
async function getMatchById(matchId) {
  try {
    const matchDoc = await firestore.collection('matches').doc(matchId).get();

    if (!matchDoc.exists) {
      throw new Error(`Match not found: ${matchId}`);
    }

    return {
      id: matchDoc.id,
      ...matchDoc.data(),
      // Convert Firestore timestamps to milliseconds
      startTime: matchDoc.data().startTime?.toMillis(),
      endTime: matchDoc.data().endTime?.toMillis(),
      createdAt: matchDoc.data().createdAt?.toMillis(),
    };
  } catch (error) {
    console.error(`❌ Failed to get match ${matchId}:`, error.message);
    throw error;
  }
}

/**
 * Get match history with filters and pagination
 *
 * @param {Object} options - Query options
 * @param {string} options.locationId - Filter by location
 * @param {number} options.limit - Max results (default: 50)
 * @param {number} options.offset - Skip first N results (default: 0)
 * @param {string} options.orderBy - Order by field (default: 'endTime')
 * @param {string} options.order - 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Array>} - Array of matches
 */
async function getMatchHistory(options = {}) {
  try {
    const {
      locationId,
      limit = 50,
      offset = 0,
      orderBy = 'endTime',
      order = 'desc'
    } = options;

    let query = firestore.collection('matches');

    // Filter by location if specified
    if (locationId) {
      query = query.where('locationId', '==', locationId);
    }

    // Order by
    query = query.orderBy(orderBy, order);

    // Pagination
    if (offset > 0) {
      // For offset, we need to get all docs up to offset+limit
      // This is not efficient for large offsets - consider using cursor-based pagination
      query = query.limit(offset + limit);
    } else {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    let matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps
      startTime: doc.data().startTime?.toMillis(),
      endTime: doc.data().endTime?.toMillis(),
      createdAt: doc.data().createdAt?.toMillis(),
    }));

    // Apply offset if needed
    if (offset > 0) {
      matches = matches.slice(offset);
    }

    console.log(`✅ Retrieved ${matches.length} matches (location: ${locationId || 'all'})`);

    return matches;
  } catch (error) {
    console.error('❌ Failed to get match history:', error.message);
    throw error;
  }
}

/**
 * Delete match by ID
 *
 * @param {string} matchId - Match ID to delete
 * @returns {Promise<void>}
 */
async function deleteMatch(matchId) {
  try {
    await firestore.collection('matches').doc(matchId).delete();
    console.log(`✅ Match deleted: ${matchId}`);
  } catch (error) {
    console.error(`❌ Failed to delete match ${matchId}:`, error.message);
    throw error;
  }
}

// ============================================
// LOCATION OPERATIONS
// ============================================

/**
 * Create a new location
 *
 * @param {Object} locationData - Location data
 * @param {string} locationData.id - Location ID (e.g., 'campo_01')
 * @param {string} locationData.name - Display name
 * @param {string} locationData.address - Address (optional)
 * @returns {Promise<string>} - Location ID
 */
async function createLocation(locationData) {
  try {
    const { id, name, address = '' } = locationData;

    if (!id || !name) {
      throw new Error('Location ID and name are required');
    }

    const location = {
      name,
      address,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.collection('locations').doc(id).set(location);

    console.log(`✅ Location created: ${id} (${name})`);

    return id;
  } catch (error) {
    console.error('❌ Failed to create location:', error.message);
    throw error;
  }
}

/**
 * Get all active locations
 *
 * @returns {Promise<Array>} - Array of locations
 */
async function getLocations() {
  try {
    const snapshot = await firestore.collection('locations')
      .where('active', '==', true)
      .get();

    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis(),
    }));

    console.log(`✅ Retrieved ${locations.length} locations`);

    return locations;
  } catch (error) {
    console.error('❌ Failed to get locations:', error.message);
    throw error;
  }
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get statistics for a location
 *
 * @param {string} locationId - Location ID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Object>} - Statistics
 */
async function getLocationStats(locationId, days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    const snapshot = await firestore.collection('matches')
      .where('locationId', '==', locationId)
      .where('endTime', '>=', cutoffTimestamp)
      .get();

    const matches = snapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const stats = {
      totalMatches: matches.length,
      totalDuration: matches.reduce((sum, m) => sum + m.duration, 0),
      averageDuration: matches.length > 0
        ? Math.floor(matches.reduce((sum, m) => sum + m.duration, 0) / matches.length)
        : 0,
      totalScores: matches.reduce((sum, m) => sum + m.finalScore.team1 + m.finalScore.team2, 0),
      team1Wins: matches.filter(m => m.winner === 'team1').length,
      team2Wins: matches.filter(m => m.winner === 'team2').length,
      draws: matches.filter(m => m.winner === 'draw').length,
    };

    console.log(`✅ Stats for ${locationId} (last ${days} days):`, stats);

    return stats;
  } catch (error) {
    console.error(`❌ Failed to get stats for ${locationId}:`, error.message);
    throw error;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Firebase instance
  firestore,
  admin,

  // Match operations
  saveMatch,
  getMatchById,
  getMatchHistory,
  deleteMatch,

  // Location operations
  createLocation,
  getLocations,

  // Statistics
  getLocationStats,
};

// ============================================
// CLI MODE (if run directly)
// ============================================

if (require.main === module) {
  console.log('🗄️  Database Service - Firebase Firestore');
  console.log('==========================================\n');

  // Test connection
  console.log('Testing Firestore connection...');

  // Create default location if it doesn't exist
  createLocation({
    id: 'default',
    name: 'Campo Principale',
    address: 'Centro Sportivo'
  })
    .then(() => {
      console.log('\n✅ Database service ready!');
      console.log('\nAvailable functions:');
      console.log('- saveMatch(matchData)');
      console.log('- getMatchById(matchId)');
      console.log('- getMatchHistory(options)');
      console.log('- deleteMatch(matchId)');
      console.log('- createLocation(locationData)');
      console.log('- getLocations()');
      console.log('- getLocationStats(locationId, days)');
      console.log('\nImport this module to use in other services.');
    })
    .catch((error) => {
      console.error('\n❌ Database service failed to initialize:', error.message);
      console.error('\nMake sure you have:');
      console.error('1. Firebase project created');
      console.error('2. Service account key downloaded');
      console.error('3. GOOGLE_APPLICATION_CREDENTIALS env var set OR firebase-service-account.json in cloud/ directory');
      process.exit(1);
    });
}
