/**
 * Session Service - State Management & Persistence
 *
 * This service is the core of STEP 4: Stato persistente & riconnessioni
 *
 * Responsibilities:
 * 1. Maintains session state in memory
 * 2. Publishes state snapshots as retained messages
 * 3. Handles score events and updates state
 * 4. Ensures no score loss on disconnections
 *
 * Run with: node session-service.js
 */

const mqtt = require('mqtt');

const mqttConfig = {
  host: '25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'admin',
  password: 'Scorely_test1',
  rejectUnauthorized: true,
};

console.log('🎮 Session Service Starting...\n');

const client = mqtt.connect(mqttConfig);

// In-memory session state (in produzione: Redis o DB)
const sessions = new Map();

// Event deduplication cache (STEP 5)
// Tracks recent events to prevent duplicates
const eventCache = new Map(); // key: deviceId+timestamp, value: expiration time
const EVENT_CACHE_TTL = 5000; // 5 seconds

// Rate limiting per device (STEP 5)
const deviceRateLimits = new Map(); // key: deviceId, value: {lastEvent, count}
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_EVENTS_PER_WINDOW = 10; // Max 10 events per second per device

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  // Subscribe to all session events
  client.subscribe('session/+/event', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to events:', err);
    } else {
      console.log('📡 Subscribed to: session/+/event');
    }
  });

  // Subscribe to session commands
  client.subscribe('session/+/command', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to commands:', err);
    } else {
      console.log('📡 Subscribed to: session/+/command');
    }
  });

  // STEP 5: Subscribe to pairing notifications
  client.subscribe('session/+/pairing', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to pairing:', err);
    } else {
      console.log('📡 Subscribed to: session/+/pairing');
    }
  });

  console.log('🎯 Session service ready!\n');
});

client.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());

  if (topic.includes('/event')) {
    handleScoreEvent(topic, payload);
  } else if (topic.includes('/command')) {
    handleSessionCommand(topic, payload);
  } else if (topic.includes('/pairing')) {
    handlePairingNotification(topic, payload);
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT error:', error.message);
});

/**
 * STEP 5: Handle pairing notifications from pairing service
 */
function handlePairingNotification(topic, payload) {
  const sessionId = topic.split('/')[1];

  if (payload.action === 'device_paired') {
    const deviceInfo = payload.device;
    console.log(`\n👥 New device paired to session ${sessionId}`);
    console.log(`   Device: ${deviceInfo.deviceId}`);
    console.log(`   Team: ${deviceInfo.team}`);

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      console.log(`⚠️  Session not found, creating new session`);
      session = {
        sessionId: sessionId,
        status: 'waiting',
        score: {
          team1: 0,
          team2: 0,
        },
        pairedDevices: [],
        startedAt: Date.now(),
        lastUpdate: Date.now(),
      };
      sessions.set(sessionId, session);
    }

    // Add device if not already in list
    if (!session.pairedDevices) {
      session.pairedDevices = [];
    }

    const exists = session.pairedDevices.some(d => d.deviceId === deviceInfo.deviceId);
    if (!exists) {
      session.pairedDevices.push(deviceInfo);
      console.log(`✅ Device added to session state`);
      console.log(`   Total paired devices: ${session.pairedDevices.length}`);

      // Publish updated state
      publishStateSnapshot(sessionId);
    } else {
      console.log(`⚠️  Device already in session state`);
    }
  }
}

/**
 * Handle session commands (start, stop, reset, request_state)
 */
function handleSessionCommand(topic, payload) {
  const sessionId = topic.split('/')[1];
  console.log(`\n📨 Command received for session: ${sessionId}`);
  console.log(`Action: ${payload.action}`);

  switch (payload.action) {
    case 'start':
      startSession(sessionId);
      break;
    case 'stop':
      stopSession(sessionId);
      break;
    case 'reset':
      resetSession(sessionId);
      break;
    case 'request_state':
      publishStateSnapshot(sessionId);
      break;
    default:
      console.log(`⚠️  Unknown command: ${payload.action}`);
  }
}

/**
 * Start a new session
 */
function startSession(sessionId) {
  console.log(`\n🟢 Starting session: ${sessionId}`);

  sessions.set(sessionId, {
    sessionId: sessionId,
    status: 'running',
    score: {
      team1: 0,
      team2: 0,
    },
    startedAt: Date.now(),
    lastUpdate: Date.now(),
  });

  publishStateSnapshot(sessionId);
  console.log(`✅ Session ${sessionId} started`);
}

/**
 * Stop a session
 */
function stopSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    console.log(`⚠️  Session ${sessionId} not found`);
    return;
  }

  console.log(`\n🔴 Stopping session: ${sessionId}`);
  session.status = 'ended';
  session.endedAt = Date.now();

  publishStateSnapshot(sessionId);
  console.log(`✅ Session ${sessionId} stopped`);
}

/**
 * Reset session score
 */
function resetSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    console.log(`⚠️  Session ${sessionId} not found`);
    return;
  }

  console.log(`\n🔄 Resetting session: ${sessionId}`);
  session.score.team1 = 0;
  session.score.team2 = 0;
  session.lastUpdate = Date.now();

  publishStateSnapshot(sessionId);
  console.log(`✅ Session ${sessionId} reset`);
}

/**
 * Handle score events from bracelets
 */
function handleScoreEvent(topic, payload) {
  const sessionId = topic.split('/')[1];

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ SCORE EVENT RECEIVED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Session: ${sessionId}`);
  console.log(`Action: ${payload.action}`);
  console.log(`Team: ${payload.team}`);
  console.log(`Device: ${payload.deviceId}`);

  // STEP 5: Event deduplication check
  if (isDuplicateEvent(payload)) {
    console.log(`⚠️  DUPLICATE EVENT DETECTED - Ignoring`);
    console.log(`   Device: ${payload.deviceId}`);
    console.log(`   Timestamp: ${payload.timestamp}`);
    return;
  }

  // STEP 5: Rate limiting check
  if (isRateLimited(payload.deviceId)) {
    console.log(`⚠️  RATE LIMIT EXCEEDED - Ignoring`);
    console.log(`   Device: ${payload.deviceId}`);
    console.log(`   Too many events in short time`);
    return;
  }

  // Get or create session
  let session = sessions.get(sessionId);
  if (!session) {
    console.log(`⚠️  Session not found, creating new session`);
    session = {
      sessionId: sessionId,
      status: 'running',
      score: {
        team1: 0,
        team2: 0,
      },
      pairedDevices: [],
      startedAt: Date.now(),
      lastUpdate: Date.now(),
    };
    sessions.set(sessionId, session);
  }

  // Update score
  const teamKey = `team${payload.team}`;
  const oldScore = session.score[teamKey];

  if (payload.action === 'increment') {
    session.score[teamKey]++;
  } else if (payload.action === 'decrement') {
    session.score[teamKey] = Math.max(0, session.score[teamKey] - 1);
  }

  const newScore = session.score[teamKey];
  session.lastUpdate = Date.now();

  console.log(`\n📊 Score updated:`);
  console.log(`   Team ${payload.team}: ${oldScore} → ${newScore}`);
  console.log(`   Current state: Team 1: ${session.score.team1} - Team 2: ${session.score.team2}`);

  // Publish updated state snapshot (RETAINED)
  publishStateSnapshot(sessionId);
}

/**
 * STEP 5: Check if event is a duplicate
 * Events with the same deviceId + timestamp within TTL are considered duplicates
 */
function isDuplicateEvent(payload) {
  const eventKey = `${payload.deviceId}_${payload.timestamp}`;
  const now = Date.now();

  // Clean expired entries
  for (const [key, expiry] of eventCache.entries()) {
    if (now > expiry) {
      eventCache.delete(key);
    }
  }

  // Check if event already exists
  if (eventCache.has(eventKey)) {
    return true;
  }

  // Add to cache
  eventCache.set(eventKey, now + EVENT_CACHE_TTL);
  return false;
}

/**
 * STEP 5: Check if device is rate limited
 * Prevents spam by limiting events per device per time window
 */
function isRateLimited(deviceId) {
  const now = Date.now();
  const deviceLimit = deviceRateLimits.get(deviceId);

  if (!deviceLimit) {
    // First event from this device
    deviceRateLimits.set(deviceId, {
      lastEvent: now,
      count: 1,
      windowStart: now,
    });
    return false;
  }

  // Check if we're in a new window
  if (now - deviceLimit.windowStart > RATE_LIMIT_WINDOW) {
    // Reset counter for new window
    deviceRateLimits.set(deviceId, {
      lastEvent: now,
      count: 1,
      windowStart: now,
    });
    return false;
  }

  // We're in the same window, increment counter
  deviceLimit.count++;
  deviceLimit.lastEvent = now;

  // Check if limit exceeded
  if (deviceLimit.count > MAX_EVENTS_PER_WINDOW) {
    return true;
  }

  return false;
}

/**
 * Publish session state snapshot as RETAINED message
 * This ensures clients always receive the latest state on reconnection
 */
function publishStateSnapshot(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    console.log(`⚠️  Cannot publish state: session ${sessionId} not found`);
    return;
  }

  const snapshot = {
    sessionId: session.sessionId,
    status: session.status,
    score: {
      team1: session.score.team1,
      team2: session.score.team2,
    },
    pairedDevices: session.pairedDevices || [],
    lastUpdate: session.lastUpdate,
    timestamp: Date.now(),
  };

  const topic = `session/${sessionId}/state`;
  const payload = JSON.stringify(snapshot);

  // CRITICAL: Use QoS 1 and RETAIN flag
  client.publish(topic, payload, { qos: 1, retain: true }, (err) => {
    if (err) {
      console.error('❌ Failed to publish state snapshot:', err);
    } else {
      console.log(`\n📸 State snapshot published (RETAINED)`);
      console.log(`   Topic: ${topic}`);
      console.log(`   Payload: ${payload}`);
    }
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 HOW TO USE:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Start this service: node session-service.js');
console.log('2. Start a session by publishing to session/{sessionId}/command:');
console.log('   {"action": "start"}');
console.log('3. Score events will automatically update state');
console.log('4. State is published as RETAINED message on session/{sessionId}/state');
console.log('5. Clients can request state with: {"action": "request_state"}');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
