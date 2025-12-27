/**
 * Pairing Service - MQTT Backend
 *
 * This service handles the pairing flow:
 * 1. Listens for pairing requests from bracelets
 * 2. Assigns them to the active session
 * 3. Sends back the session topic and team number
 *
 * Run with: node pairing-service.js
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

console.log('🔗 Pairing Service Starting...\n');

const client = mqtt.connect(mqttConfig);

const activeSessions = new Map();

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  client.subscribe('pairing/request', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe:', err);
    } else {
      console.log('📡 Subscribed to: pairing/request');
      console.log('🎯 Waiting for pairing requests...\n');
    }
  });

  client.subscribe('session/+/command', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to commands:', err);
    } else {
      console.log('📡 Subscribed to: session/+/command');
    }
  });
});

client.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());

  if (topic === 'pairing/request') {
    handlePairingRequest(payload);
  } else if (topic.includes('/command')) {
    handleSessionCommand(topic, payload);
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT error:', error.message);
});

function handleSessionCommand(topic, payload) {
  const sessionId = topic.split('/')[1];

  if (payload.action === 'open_pairing') {
    console.log(`\n🔓 Opening pairing for session: ${sessionId}`);

    activeSessions.set(sessionId, {
      sessionId: sessionId,
      pairingOpen: true,
      pairingExpiresAt: Date.now() + (payload.duration || 60000),
      pairedDevices: activeSessions.get(sessionId)?.pairedDevices || [],
    });

    console.log(`⏱️  Pairing will expire in ${(payload.duration || 60000) / 1000}s`);
    console.log(`📊 Current active sessions: ${activeSessions.size}`);

    setTimeout(() => {
      const session = activeSessions.get(sessionId);
      if (session && session.pairingOpen) {
        session.pairingOpen = false;
        console.log(`\n🔒 Pairing closed for session: ${sessionId}`);
      }
    }, payload.duration || 60000);
  }
}

function handlePairingRequest(payload) {
  const { deviceId, timestamp } = payload;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 PAIRING REQUEST RECEIVED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Device ID: ${deviceId}`);
  console.log(`Timestamp: ${timestamp}`);

  let targetSession = null;
  for (const [sessionId, session] of activeSessions) {
    if (session.pairingOpen && Date.now() < session.pairingExpiresAt) {
      targetSession = session;
      break;
    }
  }

  if (!targetSession) {
    console.log('❌ No active session with open pairing');
    console.log('💡 Tip: Send a command to open pairing first');

    sendPairingResponse(deviceId, {
      status: 'error',
      message: 'No active pairing session',
    });
    return;
  }

  const isAlreadyPaired = targetSession.pairedDevices.some(d => d.deviceId === deviceId);

  if (isAlreadyPaired) {
    const device = targetSession.pairedDevices.find(d => d.deviceId === deviceId);
    console.log(`⚠️  Device already paired to Team ${device.team}`);

    sendPairingResponse(deviceId, {
      status: 'ok',
      topic: `session/${targetSession.sessionId}/event`,
      team: device.team,
      sessionId: targetSession.sessionId,
    });
    return;
  }

  const team1Count = targetSession.pairedDevices.filter(d => d.team === 1).length;
  const team2Count = targetSession.pairedDevices.filter(d => d.team === 2).length;
  const assignedTeam = team1Count <= team2Count ? 1 : 2;

  targetSession.pairedDevices.push({
    deviceId: deviceId,
    team: assignedTeam,
    pairedAt: Date.now(),
  });

  console.log(`✅ PAIRING SUCCESSFUL`);
  console.log(`Session: ${targetSession.sessionId}`);
  console.log(`Team: ${assignedTeam}`);
  console.log(`Devices paired: ${targetSession.pairedDevices.length}`);
  console.log(`  Team 1: ${team1Count + (assignedTeam === 1 ? 1 : 0)} devices`);
  console.log(`  Team 2: ${team2Count + (assignedTeam === 2 ? 1 : 0)} devices`);

  const response = {
    status: 'ok',
    topic: `session/${targetSession.sessionId}/event`,
    team: assignedTeam,
    sessionId: targetSession.sessionId,
  };

  sendPairingResponse(deviceId, response);
}

function sendPairingResponse(deviceId, response) {
  const topic = `pairing/response/${deviceId}`;
  const payload = JSON.stringify(response);

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to send pairing response:', err);
    } else {
      console.log(`📤 Response sent to ${deviceId}`);
      console.log(`Topic: ${topic}`);
      console.log(`Payload: ${payload}`);
    }
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 HOW TO TEST:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Run this service: node pairing-service.js');
console.log('2. Open pairing by publishing to session/{sessionId}/command:');
console.log('   {');
console.log('     "action": "open_pairing",');
console.log('     "duration": 60000');
console.log('   }');
console.log('3. Press + and - together on the bracelet for 2 seconds');
console.log('4. The bracelet will be paired automatically!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
