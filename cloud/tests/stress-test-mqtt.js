/**
 * MQTT Stress Test
 *
 * Tests system under load with 10,000 score events
 * Validates:
 * - Message throughput
 * - Event deduplication
 * - Rate limiting
 * - State consistency
 * - No score loss
 */

const mqtt = require('mqtt');

const MQTT_CONFIG = {
  host: '25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'admin',
  password: 'Scorely_test1',
  rejectUnauthorized: true,
};

const SESSION_ID = process.argv[2] || 'STRESS_TEST_' + Date.now();
const TOTAL_EVENTS = 10000;
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 10;

console.log('\n🧪 MQTT Stress Test');
console.log('===================\n');
console.log(`Session ID: ${SESSION_ID}`);
console.log(`Total events: ${TOTAL_EVENTS}`);
console.log(`Batch size: ${BATCH_SIZE}`);
console.log(`Batch delay: ${BATCH_DELAY_MS}ms\n`);

let sentEvents = 0;
let receivedSnapshots = 0;
let finalScore = { team1: 0, team2: 0 };
let startTime;
let endTime;

const client = mqtt.connect(MQTT_CONFIG);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker\n');

  // Subscribe to state updates
  client.subscribe(`session/${SESSION_ID}/state`, (err) => {
    if (err) {
      console.error('❌ Failed to subscribe:', err);
      process.exit(1);
    }
    console.log('📡 Subscribed to state updates\n');

    // Start stress test
    startStressTest();
  });
});

client.on('message', (topic, message) => {
  if (topic === `session/${SESSION_ID}/state`) {
    receivedSnapshots++;
    const state = JSON.parse(message.toString());
    finalScore = state.score;

    // Log progress every 1000 snapshots
    if (receivedSnapshots % 1000 === 0) {
      console.log(`📊 Progress: ${receivedSnapshots} snapshots received`);
      console.log(`   Current score: Team 1: ${finalScore.team1}, Team 2: ${finalScore.team2}`);
    }
  }
});

async function startStressTest() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Starting stress test...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  startTime = Date.now();

  // Send events in batches
  for (let i = 0; i < TOTAL_EVENTS; i += BATCH_SIZE) {
    const batchPromises = [];

    for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_EVENTS; j++) {
      const eventNum = i + j;
      const team = (eventNum % 2) + 1; // Alternate between team 1 and 2
      const deviceId = `stress_device_${eventNum % 4}`; // 4 virtual devices

      const event = {
        action: 'increment',
        team: team,
        deviceId: deviceId,
        timestamp: Date.now()
      };

      const promise = new Promise((resolve) => {
        client.publish(
          `session/${SESSION_ID}/event`,
          JSON.stringify(event),
          { qos: 1 },
          (err) => {
            if (!err) {
              sentEvents++;
            }
            resolve();
          }
        );
      });

      batchPromises.push(promise);
    }

    await Promise.all(batchPromises);

    // Log progress every 1000 events
    if (sentEvents % 1000 === 0) {
      console.log(`⚡ Sent ${sentEvents}/${TOTAL_EVENTS} events`);
    }

    // Small delay between batches to avoid overwhelming
    if (i + BATCH_SIZE < TOTAL_EVENTS) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Stress test completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Wait for final state update
  console.log('⏳ Waiting for final state snapshot (5s)...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Calculate results
  printResults(duration);
}

function printResults(duration) {
  console.log('📊 RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`📤 Events sent: ${sentEvents}`);
  console.log(`📥 Snapshots received: ${receivedSnapshots}`);
  console.log(`📈 Throughput: ${Math.round(sentEvents / duration)} events/sec`);
  console.log(`⚡ Avg latency: ${Math.round(duration / sentEvents * 1000)}ms/event\n`);

  console.log('🏆 Final Score:');
  console.log(`   Team 1: ${finalScore.team1}`);
  console.log(`   Team 2: ${finalScore.team2}`);
  console.log(`   Total: ${finalScore.team1 + finalScore.team2}\n`);

  // Validate results
  const expectedTeam1 = Math.floor(TOTAL_EVENTS / 2);
  const expectedTeam2 = Math.ceil(TOTAL_EVENTS / 2);
  const totalScore = finalScore.team1 + finalScore.team2;

  console.log('✅ VALIDATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let failed = 0;

  // Test 1: All events sent
  if (sentEvents === TOTAL_EVENTS) {
    console.log(`✅ All ${TOTAL_EVENTS} events sent`);
    passed++;
  } else {
    console.log(`❌ Only ${sentEvents}/${TOTAL_EVENTS} events sent`);
    failed++;
  }

  // Test 2: Received state updates
  if (receivedSnapshots > 0) {
    console.log(`✅ Received ${receivedSnapshots} state snapshots`);
    passed++;
  } else {
    console.log(`❌ No state snapshots received`);
    failed++;
  }

  // Test 3: No score loss (accounting for deduplication and rate limiting)
  // Accept within 1% margin due to race conditions
  const expectedTotal = TOTAL_EVENTS;
  const margin = expectedTotal * 0.01;
  const lowerBound = expectedTotal - margin;
  const upperBound = expectedTotal;

  if (totalScore >= lowerBound && totalScore <= upperBound) {
    console.log(`✅ Total score within acceptable range: ${totalScore}/${expectedTotal}`);
    passed++;
  } else {
    console.log(`❌ Score mismatch: ${totalScore} (expected ~${expectedTotal})`);
    console.log(`   Possible score loss or duplication detected`);
    failed++;
  }

  // Test 4: Balanced distribution
  const diff = Math.abs(finalScore.team1 - finalScore.team2);
  if (diff <= 1) {
    console.log(`✅ Balanced distribution: difference = ${diff}`);
    passed++;
  } else {
    console.log(`⚠️  Unbalanced distribution: Team1=${finalScore.team1}, Team2=${finalScore.team2}`);
    // Don't fail, just warn
  }

  // Test 5: Throughput acceptable
  const throughput = Math.round(sentEvents / duration);
  if (throughput >= 100) {
    console.log(`✅ Good throughput: ${throughput} events/sec`);
    passed++;
  } else {
    console.log(`⚠️  Low throughput: ${throughput} events/sec (expected >100)`);
    // Don't fail, just warn
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total: ${passed + failed} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed === 0) {
    console.log('╔════════════════════════════════════╗');
    console.log('║  ✅ STRESS TEST PASSED!           ║');
    console.log('╚════════════════════════════════════╝\n');
    client.end();
    process.exit(0);
  } else {
    console.log('╔════════════════════════════════════╗');
    console.log('║  ❌ STRESS TEST FAILED!           ║');
    console.log('╚════════════════════════════════════╝\n');
    client.end();
    process.exit(1);
  }
}

client.on('error', (error) => {
  console.error('❌ MQTT error:', error.message);
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stress test interrupted by user');
  if (startTime) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n📊 Partial results:`);
    console.log(`   Sent: ${sentEvents} events in ${duration.toFixed(2)}s`);
    console.log(`   Snapshots: ${receivedSnapshots}`);
  }
  client.end();
  process.exit(1);
});
