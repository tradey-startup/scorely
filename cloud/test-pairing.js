/**
 * Test Script for Pairing Flow
 *
 * This script simulates opening a pairing session so bracelets can connect.
 *
 * Run with: node test-pairing.js
 * Make sure pairing-service.js is running first!
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

const SESSION_ID = 'TEST01';

console.log('🧪 Pairing Test Script\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 Instructions:');
console.log('1. Make sure pairing-service.js is running');
console.log('2. This script will open pairing for 60 seconds');
console.log('3. Press + and - together on your ESP32 bracelet');
console.log('4. Watch the pairing happen!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`📡 Connecting to MQTT broker...`);

const client = mqtt.connect(mqttConfig);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker\n');

  console.log(`🔓 Opening pairing for session: ${SESSION_ID}`);
  console.log(`⏱️  Pairing window: 60 seconds\n`);

  const command = {
    action: 'open_pairing',
    duration: 60000,
  };

  const topic = `session/${SESSION_ID}/command`;
  const payload = JSON.stringify(command);

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to publish command:', err);
      process.exit(1);
    } else {
      console.log('✅ Pairing window opened!');
      console.log(`Topic: ${topic}`);
      console.log(`Payload: ${payload}\n`);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👉 Now press + and - together on your bracelet!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      client.subscribe(`session/${SESSION_ID}/event`, (err) => {
        if (!err) {
          console.log('📡 Subscribed to session events');
          console.log('🎯 Waiting for score events from paired bracelets...\n');
        }
      });
    }
  });
});

client.on('message', (topic, message) => {
  if (topic.includes('/event')) {
    const event = JSON.parse(message.toString());
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚡ EVENT RECEIVED FROM BRACELET!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(event, null, 2));
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT Connection error:', error.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('\n⏱️  60 seconds elapsed - pairing window should be closed now');
  console.log('💡 You can run this script again to open a new pairing window\n');
}, 60000);
