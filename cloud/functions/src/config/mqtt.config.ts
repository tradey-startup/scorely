/**
 * MQTT Configuration for HiveMQ Cloud
 *
 * IMPORTANT: Store credentials in Firebase Functions environment config
 *
 * To set environment variables:
 * firebase functions:config:set mqtt.host="YOUR_HIVEMQ_HOST" mqtt.port="8883" mqtt.username="YOUR_USERNAME" mqtt.password="YOUR_PASSWORD"
 */

export interface MqttConfig {
  host: string;
  port: number;
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss';
  username?: string;
  password?: string;
  clientId?: string;
  clean?: boolean;
  reconnectPeriod?: number;
  connectTimeout?: number;
  rejectUnauthorized?: boolean;
}

/**
 * Get MQTT configuration from environment variables
 */
export function getMqttConfig(): MqttConfig {
  // In production, use Firebase Functions config
  // In development/emulator, use .env file or hardcoded values for testing

  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

  if (isEmulator) {
    // Development configuration
    return {
      host: process.env.MQTT_HOST || 'localhost',
      port: parseInt(process.env.MQTT_PORT || '1883'),
      protocol: (process.env.MQTT_PROTOCOL as MqttConfig['protocol']) || 'mqtt',
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: `scorely_cloud_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30000,
    };
  }

  // Production configuration from Firebase Functions config
  // Access via functions.config().mqtt
  return {
    host: process.env.MQTT_HOST || '',
    port: parseInt(process.env.MQTT_PORT || '8883'),
    protocol: 'mqtts',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `scorely_cloud_${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    rejectUnauthorized: true,
  };
}

/**
 * MQTT Topic Templates
 */
export const MQTT_TOPICS = {
  // Session topics
  sessionEvent: (sessionId: string) => `session/${sessionId}/event`,
  sessionState: (sessionId: string) => `session/${sessionId}/state`,
  sessionCommand: (sessionId: string) => `session/${sessionId}/command`,

  // Pairing topics
  pairingRequest: () => 'pairing/request',
  pairingResponse: (deviceId: string) => `pairing/response/${deviceId}`,

  // Wildcard subscriptions
  allSessionEvents: () => 'session/+/event',
  allSessionCommands: () => 'session/+/command',
  allPairingRequests: () => 'pairing/request',
};
