import * as mqtt from 'mqtt';
import { getMqttConfig, MQTT_TOPICS } from '../config/mqtt.config';
import { StateSnapshot } from '../types/session.types';

/**
 * MQTT Service - Singleton pattern
 * Manages connection to MQTT broker and provides methods to publish messages
 */
class MqttService {
  private client: mqtt.MqttClient | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Connect to MQTT broker
   */
  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.isConnected && this.client) {
      return Promise.resolve();
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Start new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      const config = getMqttConfig();

      console.log('[MQTT] Connecting to broker...', {
        host: config.host,
        port: config.port,
        protocol: config.protocol,
      });

      this.client = mqtt.connect({
        host: config.host,
        port: config.port,
        protocol: config.protocol,
        username: config.username,
        password: config.password,
        clientId: config.clientId,
        clean: config.clean,
        reconnectPeriod: config.reconnectPeriod,
        connectTimeout: config.connectTimeout,
        rejectUnauthorized: config.rejectUnauthorized,
      });

      this.client.on('connect', () => {
        console.log('[MQTT] Connected successfully');
        this.isConnected = true;
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('[MQTT] Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.client.on('close', () => {
        console.log('[MQTT] Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        console.log('[MQTT] Reconnecting...');
      });

      this.client.on('offline', () => {
        console.log('[MQTT] Client offline');
        this.isConnected = false;
      });
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, {}, () => {
          console.log('[MQTT] Disconnected');
          this.isConnected = false;
          this.client = null;
          this.connectionPromise = null;
          resolve();
        });
      });
    }
  }

  /**
   * Publish a message to a topic
   */
  async publish(
    topic: string,
    message: object | string,
    options: mqtt.IClientPublishOptions = {}
  ): Promise<void> {
    await this.connect();

    if (!this.client) {
      throw new Error('[MQTT] Client not connected');
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, payload, options, (error) => {
        if (error) {
          console.error(`[MQTT] Failed to publish to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`[MQTT] Published to ${topic}:`, payload);
          resolve();
        }
      });
    });
  }

  /**
   * Publish state snapshot (retained message)
   * This ensures new clients receive the latest state immediately
   */
  async publishStateSnapshot(sessionId: string, snapshot: StateSnapshot): Promise<void> {
    const topic = MQTT_TOPICS.sessionState(sessionId);

    await this.publish(topic, snapshot, {
      qos: 1,
      retain: true, // CRITICAL: Retained message ensures persistence
    });
  }

  /**
   * Subscribe to a topic
   */
  async subscribe(
    topic: string | string[],
    callback: (topic: string, message: Buffer) => void
  ): Promise<void> {
    await this.connect();

    if (!this.client) {
      throw new Error('[MQTT] Client not connected');
    }

    // Set up message handler before subscribing
    if (!this.client.listenerCount('message')) {
      this.client.on('message', callback);
    }

    return new Promise((resolve, reject) => {
      this.client!.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          console.error(`[MQTT] Failed to subscribe to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const mqttService = new MqttService();
