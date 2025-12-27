/**
 * MQTT Configuration for Web App
 *
 * Uses WebSocket Secure (wss://) to connect to HiveMQ Cloud
 */

export const MQTT_CONFIG = {
  // HiveMQ Cloud WebSocket endpoint (port 8884 for WSS)
  brokerUrl: 'wss://25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud:8884/mqtt',

  options: {
    username: 'admin',
    password: 'Scorely_test1',
    clientId: `scorely_webapp_${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30000,
  }
};

/**
 * MQTT Topic helpers
 */
export const MQTT_TOPICS = {
  sessionState: (sessionId) => `session/${sessionId}/state`,
  sessionEvent: (sessionId) => `session/${sessionId}/event`,
  sessionCommand: (sessionId) => `session/${sessionId}/command`,
};
