/**
 * Test Script for Web App + MQTT Integration
 *
 * This script simulates a complete game flow by publishing MQTT messages
 * that the web app should receive and display in real-time.
 *
 * Run with: node test-webapp.js
 * Make sure the webapp dev server is running on http://localhost:5173/
 */

const mqtt = require('mqtt');

// MQTT Configuration (same as cloud backend)
const mqttConfig = {
  host: '25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'admin',
  password: 'Scorely_test1',
  rejectUnauthorized: true,
};

console.log('🎮 Web App Integration Test\n');
console.log('📝 Instructions:');
console.log('   1. Open http://localhost:5173/ in your browser');
console.log('   2. Click "Crea Nuova Sessione" or enter session ID: TEST01');
console.log('   3. Watch the scoreboard update in real-time!\n');

const SESSION_ID = 'TEST01';

console.log(`🎯 Session ID: ${SESSION_ID}\n`);
console.log('📡 Connecting to MQTT broker...');

const client = mqtt.connect(mqttConfig);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker\n');

  runTest();
});

client.on('error', (error) => {
  console.error('❌ MQTT Connection error:', error.message);
  process.exit(1);
});

async function runTest() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST: Simulating a complete game');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Initial state (waiting)
  console.log('Step 1: Publishing initial state (waiting)...');
  await publishState({
    sessionId: SESSION_ID,
    team1: 0,
    team2: 0,
    status: 'waiting',
    timestamp: Date.now(),
  });
  await sleep(2000);

  // Step 2: Start game
  console.log('Step 2: Starting game (status → running)...');
  await publishState({
    sessionId: SESSION_ID,
    team1: 0,
    team2: 0,
    status: 'running',
    timestamp: Date.now(),
  });
  await sleep(2000);

  // Step 3: Simulate game with scores
  console.log('Step 3: Simulating game play...\n');

  const scores = [
    { team1: 1, team2: 0, msg: 'Team 1 scores! (1-0)' },
    { team1: 1, team2: 1, msg: 'Team 2 scores! (1-1)' },
    { team1: 2, team2: 1, msg: 'Team 1 scores! (2-1)' },
    { team1: 2, team2: 2, msg: 'Team 2 scores! (2-2)' },
    { team1: 3, team2: 2, msg: 'Team 1 scores! (3-2)' },
    { team1: 3, team2: 3, msg: 'Team 2 scores! (3-3)' },
    { team1: 4, team2: 3, msg: 'Team 1 scores! (4-3)' },
    { team1: 4, team2: 4, msg: 'Team 2 scores! (4-4)' },
    { team1: 5, team2: 4, msg: 'Team 1 WINS! (5-4)' },
  ];

  for (const score of scores) {
    console.log(`  ${score.msg}`);
    await publishState({
      sessionId: SESSION_ID,
      team1: score.team1,
      team2: score.team2,
      status: 'running',
      timestamp: Date.now(),
    });
    await sleep(1500);
  }

  // Step 4: End game
  console.log('\nStep 4: Ending game (status → ended)...');
  await publishState({
    sessionId: SESSION_ID,
    team1: 5,
    team2: 4,
    status: 'ended',
    timestamp: Date.now(),
  });
  await sleep(2000);

  // Done
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST COMPLETED SUCCESSFULLY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Test Summary:');
  console.log('  ✓ Published initial state (waiting)');
  console.log('  ✓ Started game (running)');
  console.log('  ✓ Simulated 9 score updates');
  console.log('  ✓ Ended game');
  console.log('  ✓ All states published with retain flag');
  console.log('\n🎉 The web app should have displayed all updates in real-time!\n');

  console.log('💡 Tip: You can join the session again in a new browser tab');
  console.log('   and it will immediately show the latest score (5-4, ended)\n');

  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    client.end();
    process.exit(0);
  }, 2000);
}

function publishState(state) {
  return new Promise((resolve, reject) => {
    const topic = `session/${SESSION_ID}/state`;
    const payload = JSON.stringify(state);

    client.publish(topic, payload, { qos: 1, retain: true }, (error) => {
      if (error) {
        console.error('❌ Failed to publish:', error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
