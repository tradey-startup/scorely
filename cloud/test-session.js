/**
 * Test Script for Complete Session Flow (STEP 4)
 *
 * This script tests the complete session lifecycle with state persistence:
 * 1. Start a session
 * 2. Open pairing
 * 3. Receive score events
 * 4. Monitor state snapshots
 * 5. Test reconnection scenarios
 *
 * Run with: node test-session.js
 * Make sure session-service.js and pairing-service.js are running!
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

const SESSION_ID = 'TEST01';

console.log('🧪 Complete Session Test Script (STEP 4)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Prerequisites:');
console.log('1. session-service.js is running');
console.log('2. pairing-service.js is running');
console.log('3. ESP32 bracelet is ready');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`📡 Connecting to MQTT broker...`);

const client = mqtt.connect(mqttConfig);

let sessionStarted = false;
let pairingOpened = false;

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker\n');

  // Subscribe to session state (RETAINED)
  const stateTopic = `session/${SESSION_ID}/state`;
  client.subscribe(stateTopic, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to state: ${stateTopic}`);
      console.log('   (Will receive RETAINED state on subscription)\n');
    }
  });

  // Subscribe to session events
  const eventTopic = `session/${SESSION_ID}/event`;
  client.subscribe(eventTopic, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to events: ${eventTopic}\n`);
    }
  });

  // Show menu after subscriptions
  setTimeout(() => {
    showMenu();
  }, 1000);
});

client.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());

  if (topic.endsWith('/state')) {
    handleStateUpdate(payload);
  } else if (topic.endsWith('/event')) {
    handleScoreEvent(payload);
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT Connection error:', error.message);
  process.exit(1);
});

function handleStateUpdate(state) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📸 STATE SNAPSHOT RECEIVED (RETAINED)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Session: ${state.sessionId}`);
  console.log(`Status: ${state.status}`);
  console.log(`Score: Team 1: ${state.score.team1} - Team 2: ${state.score.team2}`);
  console.log(`Last Update: ${new Date(state.lastUpdate).toLocaleTimeString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function handleScoreEvent(event) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ SCORE EVENT FROM BRACELET');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Device: ${event.deviceId}`);
  console.log(`Team: ${event.team}`);
  console.log(`Action: ${event.action}`);
  console.log(`Timestamp: ${new Date(event.timestamp).toLocaleTimeString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function showMenu() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 INTERACTIVE MENU');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1 - Start session');
  console.log('2 - Open pairing (60 seconds)');
  console.log('3 - Stop session');
  console.log('4 - Reset score');
  console.log('5 - Request current state');
  console.log('6 - Simulate disconnect/reconnect test');
  console.log('q - Quit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👉 Choose an option (or press buttons on bracelet):\n');
}

// Interactive menu
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '',
});

rl.on('line', (input) => {
  const choice = input.trim();

  switch (choice) {
    case '1':
      startSession();
      break;
    case '2':
      openPairing();
      break;
    case '3':
      stopSession();
      break;
    case '4':
      resetSession();
      break;
    case '5':
      requestState();
      break;
    case '6':
      testReconnection();
      break;
    case 'q':
      console.log('\n👋 Closing connection...');
      client.end();
      process.exit(0);
      break;
    default:
      if (choice !== '') {
        console.log('❌ Invalid option\n');
      }
  }
});

function startSession() {
  console.log('\n🟢 Starting session...');

  const command = {
    action: 'start',
  };

  client.publish(`session/${SESSION_ID}/command`, JSON.stringify(command), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to start session:', err);
    } else {
      console.log('✅ Session start command sent');
      console.log('💡 Wait for state snapshot...\n');
      sessionStarted = true;
    }
  });
}

function openPairing() {
  if (!sessionStarted) {
    console.log('⚠️  Please start the session first (option 1)\n');
    return;
  }

  console.log('\n🔓 Opening pairing for 60 seconds...');

  const command = {
    action: 'open_pairing',
    duration: 60000,
  };

  client.publish(`session/${SESSION_ID}/command`, JSON.stringify(command), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to open pairing:', err);
    } else {
      console.log('✅ Pairing window opened!');
      console.log('👉 Now press + and - together on your bracelet!\n');
      pairingOpened = true;

      setTimeout(() => {
        console.log('⏱️  Pairing window closed after 60 seconds\n');
        pairingOpened = false;
      }, 60000);
    }
  });
}

function stopSession() {
  console.log('\n🔴 Stopping session...');

  const command = {
    action: 'stop',
  };

  client.publish(`session/${SESSION_ID}/command`, JSON.stringify(command), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to stop session:', err);
    } else {
      console.log('✅ Session stop command sent\n');
    }
  });
}

function resetSession() {
  console.log('\n🔄 Resetting session score...');

  const command = {
    action: 'reset',
  };

  client.publish(`session/${SESSION_ID}/command`, JSON.stringify(command), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to reset session:', err);
    } else {
      console.log('✅ Session reset command sent\n');
    }
  });
}

function requestState() {
  console.log('\n📸 Requesting current state...');

  const command = {
    action: 'request_state',
  };

  client.publish(`session/${SESSION_ID}/command`, JSON.stringify(command), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to request state:', err);
    } else {
      console.log('✅ State request sent\n');
    }
  });
}

function testReconnection() {
  console.log('\n🔄 RECONNECTION TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Disconnect from MQTT broker');
  console.log('2. Wait 3 seconds');
  console.log('3. Reconnect and request state');
  console.log('4. Verify state is preserved\n');

  console.log('🔌 Disconnecting...');
  client.end(false, {}, () => {
    console.log('✅ Disconnected\n');

    setTimeout(() => {
      console.log('🔌 Reconnecting...');
      client.reconnect();

      client.once('connect', () => {
        console.log('✅ Reconnected!\n');

        // Re-subscribe
        client.subscribe(`session/${SESSION_ID}/state`);
        client.subscribe(`session/${SESSION_ID}/event`);

        console.log('📸 Receiving RETAINED state snapshot...');
        console.log('💡 The state should be preserved from before disconnect!\n');
      });
    }, 3000);
  });
}
