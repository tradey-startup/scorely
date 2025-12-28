/**
 * STEP 5 Multi-Bracelet Test Script
 *
 * Tests the system with multiple bracelets paired simultaneously:
 * - Event deduplication
 * - Rate limiting
 * - Team assignment balancing
 * - Concurrent events handling
 *
 * Run with: node test-multi-bracelet.js [SESSION_ID]
 * Example: node test-multi-bracelet.js ABC123
 */

const mqtt = require('mqtt');
const readline = require('readline');

const mqttConfig = {
  host: '25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'admin',
  password: 'Scorely_test1',
  rejectUnauthorized: true,
};

// Get SESSION_ID from command line argument or use default
const SESSION_ID = process.argv[2] || '6BGTB0';

console.log('🧪 STEP 5: Multi-Bracelet Test Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Prerequisites:');
console.log('1. session-service.js is running');
console.log('2. pairing-service.js is running');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎯 Testing Session: ${SESSION_ID}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📡 Connecting to MQTT broker...');
const client = mqtt.connect(mqttConfig);

// Virtual bracelets for testing
const virtualBracelets = [
  { deviceId: 'virtual_bracelet_01', team: null },
  { deviceId: 'virtual_bracelet_02', team: null },
  { deviceId: 'virtual_bracelet_03', team: null },
  { deviceId: 'virtual_bracelet_04', team: null },
];

let currentState = {
  team1: 0,
  team2: 0,
  status: 'waiting',
  pairedDevices: [],
};

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker\n');

  // Subscribe to state updates
  client.subscribe(`session/${SESSION_ID}/state`, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to state: session/${SESSION_ID}/state`);
      console.log('   (Will receive RETAINED state on subscription)\n');
    }
  });

  // Subscribe to pairing responses for virtual bracelets
  virtualBracelets.forEach((bracelet) => {
    client.subscribe(`pairing/response/${bracelet.deviceId}`, (err) => {
      if (!err) {
        console.log(`📡 Subscribed to: pairing/response/${bracelet.deviceId}`);
      }
    });
  });

  console.log('\n');
  showMenu();
});

client.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());

  if (topic.includes('/state')) {
    handleStateUpdate(payload);
  } else if (topic.includes('pairing/response/')) {
    handlePairingResponse(topic, payload);
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT error:', error.message);
});

function handleStateUpdate(payload) {
  currentState = payload;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📸 STATE SNAPSHOT RECEIVED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Session: ${payload.sessionId}`);
  console.log(`Status: ${payload.status}`);
  console.log(`Score: Team 1: ${payload.score.team1} - Team 2: ${payload.score.team2}`);

  if (payload.pairedDevices && payload.pairedDevices.length > 0) {
    console.log(`\n👥 Paired Devices (${payload.pairedDevices.length}):`);
    const team1Devices = payload.pairedDevices.filter(d => d.team === 1);
    const team2Devices = payload.pairedDevices.filter(d => d.team === 2);

    console.log(`   Team 1 (${team1Devices.length}):`);
    team1Devices.forEach(d => {
      console.log(`     - ${d.deviceId}`);
    });

    console.log(`   Team 2 (${team2Devices.length}):`);
    team2Devices.forEach(d => {
      console.log(`     - ${d.deviceId}`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  showMenu();
}

function handlePairingResponse(topic, payload) {
  const deviceId = topic.split('/')[2];

  if (payload.status === 'ok') {
    const bracelet = virtualBracelets.find(b => b.deviceId === deviceId);
    if (bracelet) {
      bracelet.team = payload.team;
      console.log(`\n✅ Virtual bracelet ${deviceId} paired to Team ${payload.team}`);
    }
  } else {
    console.log(`\n❌ Pairing failed for ${deviceId}: ${payload.message}`);
  }
}

function showMenu() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 MULTI-BRACELET TEST MENU');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1 - Start session');
  console.log('2 - Open pairing (60 seconds)');
  console.log('3 - Pair all 4 virtual bracelets');
  console.log('4 - Simulate concurrent score events (all bracelets)');
  console.log('5 - Test duplicate event prevention');
  console.log('6 - Test rate limiting (spam events)');
  console.log('7 - Simulate Team 1 scoring');
  console.log('8 - Simulate Team 2 scoring');
  console.log('9 - Reset score');
  console.log('s - Show current state');
  console.log('q - Quit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👉 Choose an option:');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (input) => {
  const choice = input.trim().toLowerCase();

  switch (choice) {
    case '1':
      startSession();
      break;
    case '2':
      openPairing();
      break;
    case '3':
      pairAllVirtualBracelets();
      break;
    case '4':
      simulateConcurrentEvents();
      break;
    case '5':
      testDuplicatePrevention();
      break;
    case '6':
      testRateLimiting();
      break;
    case '7':
      simulateTeamScore(1);
      break;
    case '8':
      simulateTeamScore(2);
      break;
    case '9':
      resetScore();
      break;
    case 's':
      requestState();
      break;
    case 'q':
      console.log('\n👋 Goodbye!');
      client.end();
      process.exit(0);
      break;
    default:
      console.log('Invalid option, please try again\n');
      showMenu();
  }
});

function startSession() {
  console.log('\n🟢 Starting session...');
  const payload = JSON.stringify({ action: 'start' });
  client.publish(`session/${SESSION_ID}/command`, payload, { qos: 1 });
}

function openPairing() {
  console.log('\n🔓 Opening pairing for 60 seconds...');
  const payload = JSON.stringify({
    action: 'open_pairing',
    duration: 60000,
  });
  client.publish(`session/${SESSION_ID}/command`, payload, { qos: 1 });
  console.log('✅ Pairing window opened!');
  console.log('👉 Now choose option 3 to pair virtual bracelets!\n');
}

function pairAllVirtualBracelets() {
  console.log('\n👥 Pairing all 4 virtual bracelets...\n');

  virtualBracelets.forEach((bracelet, index) => {
    setTimeout(() => {
      const payload = JSON.stringify({
        deviceId: bracelet.deviceId,
        timestamp: Date.now(),
      });

      client.publish('pairing/request', payload, { qos: 1 });
      console.log(`📤 Pairing request sent for ${bracelet.deviceId}`);
    }, index * 500); // Stagger requests by 500ms
  });

  console.log('\n⏳ Waiting for pairing responses...\n');
}

function simulateConcurrentEvents() {
  console.log('\n⚡ Simulating concurrent score events from all bracelets...\n');

  const pairedBracelets = virtualBracelets.filter(b => b.team !== null);

  if (pairedBracelets.length === 0) {
    console.log('❌ No bracelets paired yet! Pair them first (option 3).\n');
    showMenu();
    return;
  }

  pairedBracelets.forEach((bracelet, index) => {
    setTimeout(() => {
      sendScoreEvent(bracelet.deviceId, bracelet.team, 'increment');
    }, index * 100); // Send events 100ms apart
  });

  console.log(`📤 Sent ${pairedBracelets.length} concurrent events\n`);
}

function testDuplicatePrevention() {
  console.log('\n🔄 Testing duplicate event prevention...\n');

  const pairedBracelets = virtualBracelets.filter(b => b.team !== null);

  if (pairedBracelets.length === 0) {
    console.log('❌ No bracelets paired yet! Pair them first (option 3).\n');
    showMenu();
    return;
  }

  const bracelet = pairedBracelets[0];
  const timestamp = Date.now();

  console.log(`📤 Sending same event 3 times with identical timestamp...`);
  console.log(`   Device: ${bracelet.deviceId}`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Expected: Only 1 should be processed\n`);

  // Send same event 3 times
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      sendScoreEvent(bracelet.deviceId, bracelet.team, 'increment', timestamp);
      console.log(`   Attempt ${i + 1}/3 sent`);
    }, i * 100);
  }
}

function testRateLimiting() {
  console.log('\n🚀 Testing rate limiting (sending 15 events rapidly)...\n');

  const pairedBracelets = virtualBracelets.filter(b => b.team !== null);

  if (pairedBracelets.length === 0) {
    console.log('❌ No bracelets paired yet! Pair them first (option 3).\n');
    showMenu();
    return;
  }

  const bracelet = pairedBracelets[0];

  console.log(`📤 Sending 15 events in 500ms from ${bracelet.deviceId}`);
  console.log(`   Rate limit: 10 events/second`);
  console.log(`   Expected: First 10 processed, rest rejected\n`);

  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      sendScoreEvent(bracelet.deviceId, bracelet.team, 'increment');
      console.log(`   Event ${i + 1}/15 sent`);
    }, i * 30); // 30ms interval = ~33 events/second
  }
}

function simulateTeamScore(team) {
  console.log(`\n⚽ Simulating Team ${team} scoring...\n`);

  const teamBracelets = virtualBracelets.filter(b => b.team === team);

  if (teamBracelets.length === 0) {
    console.log(`❌ No bracelets paired to Team ${team}!\n`);
    showMenu();
    return;
  }

  // Pick random bracelet from team
  const bracelet = teamBracelets[Math.floor(Math.random() * teamBracelets.length)];
  sendScoreEvent(bracelet.deviceId, team, 'increment');
  console.log(`✅ Score event sent from ${bracelet.deviceId}\n`);
}

function resetScore() {
  console.log('\n🔄 Resetting score...');
  const payload = JSON.stringify({ action: 'reset' });
  client.publish(`session/${SESSION_ID}/command`, payload, { qos: 1 });
}

function requestState() {
  console.log('\n📡 Requesting current state...');
  const payload = JSON.stringify({ action: 'request_state' });
  client.publish(`session/${SESSION_ID}/command`, payload, { qos: 1 });
}

function sendScoreEvent(deviceId, team, action, timestamp = null) {
  const payload = JSON.stringify({
    type: 'score',
    action: action,
    team: team,
    deviceId: deviceId,
    timestamp: timestamp || Date.now(),
  });

  client.publish(`session/${SESSION_ID}/event`, payload, { qos: 1 });
}

process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  client.end();
  process.exit(0);
});
