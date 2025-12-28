/**
 * Database Service Test Script
 *
 * Quick test to verify Firebase Firestore is working
 *
 * Usage:
 * 1. Make sure Firebase Emulator is running OR service account is configured
 * 2. Run: node test-database.js
 */

// Use emulator by default for testing
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🧪 No Firebase credentials found - using Firestore Emulator');
  console.log('   Make sure emulator is running: firebase emulators:start --only firestore');
  console.log('   Or install: npm install -g firebase-tools\n');
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

const db = require('./database-service');

async function runTests() {
  console.log('🧪 Testing Database Service');
  console.log('============================\n');

  try {
    // Test 1: Create Location
    console.log('Test 1: Creating location...');
    await db.createLocation({
      id: 'campo_test',
      name: 'Campo Test',
      address: 'Via Test 123'
    });
    console.log('✅ Location created\n');

    // Test 2: Save Match
    console.log('Test 2: Saving match...');
    const matchId = await db.saveMatch({
      sessionId: 'TEST_' + Date.now(),
      locationId: 'campo_test',
      startTime: Date.now() - 600000, // 10 minutes ago
      endTime: Date.now(),
      finalScore: { team1: 12, team2: 9 },
      pairedDevices: [
        { deviceId: 'test_bracelet_1', team: 1 },
        { deviceId: 'test_bracelet_2', team: 1 },
        { deviceId: 'test_bracelet_3', team: 2 },
        { deviceId: 'test_bracelet_4', team: 2 }
      ],
      totalEvents: 21
    });
    console.log(`✅ Match saved with ID: ${matchId}\n`);

    // Test 3: Get Match by ID
    console.log('Test 3: Retrieving match by ID...');
    const match = await db.getMatchById(matchId);
    console.log('✅ Match retrieved:', {
      id: match.id,
      sessionId: match.sessionId,
      score: `${match.finalScore.team1}-${match.finalScore.team2}`,
      winner: match.winner,
      duration: `${match.duration}s`
    });
    console.log('');

    // Test 4: Get Match History
    console.log('Test 4: Getting match history...');
    const history = await db.getMatchHistory({
      locationId: 'campo_test',
      limit: 10
    });
    console.log(`✅ Retrieved ${history.length} matches\n`);

    // Test 5: Get Locations
    console.log('Test 5: Getting all locations...');
    const locations = await db.getLocations();
    console.log(`✅ Retrieved ${locations.length} locations:`);
    locations.forEach(loc => {
      console.log(`   - ${loc.id}: ${loc.name}`);
    });
    console.log('');

    // Test 6: Get Statistics
    console.log('Test 6: Getting location statistics...');
    const stats = await db.getLocationStats('campo_test', 30);
    console.log('✅ Statistics:', stats);
    console.log('');

    // Success!
    console.log('╔════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED!             ║');
    console.log('╚════════════════════════════════════╝');
    console.log('');
    console.log('Database service is working correctly! 🎉');
    console.log('');
    console.log('Next steps:');
    console.log('1. Integrate saveMatch() in session-service.js');
    console.log('2. Create API REST endpoints');
    console.log('3. Build UI for match history');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError details:', error);
    console.error('\nTroubleshooting:');
    console.error('1. If using emulator: Make sure it\'s running (firebase emulators:start --only firestore)');
    console.error('2. If using cloud: Check GOOGLE_APPLICATION_CREDENTIALS points to service account JSON');
    console.error('3. Check Firebase project is created and Firestore is enabled');
    process.exit(1);
  }
}

// Run tests
runTests();
