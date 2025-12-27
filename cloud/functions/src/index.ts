import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SessionService } from './services/session.service';
import { mqttService } from './services/mqtt.service';
import { MQTT_TOPICS } from './config/mqtt.config';
import {
  ScoreEvent,
  PairingResponse,
} from './types/session.types';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Session Service
const sessionService = new SessionService(db);

/**
 * HTTP Function: Create a new session
 *
 * POST /createSession
 * Body: { locationId: string, metadata?: object }
 */
export const createSession = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { locationId, metadata } = req.body;

    if (!locationId) {
      res.status(400).json({ error: 'locationId is required' });
      return;
    }

    const session = await sessionService.createSession(locationId, metadata);

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('[createSession] Error:', error);
    res.status(500).json({
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTP Function: Get session by ID
 *
 * GET /getSession?sessionId=ABC123
 */
export const getSession = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const session = await sessionService.getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('[getSession] Error:', error);
    res.status(500).json({
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTP Function: Start a session
 *
 * POST /startSession
 * Body: { sessionId: string }
 */
export const startSession = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    await sessionService.startSession(sessionId);

    res.status(200).json({
      success: true,
      message: `Session ${sessionId} started`,
    });
  } catch (error) {
    console.error('[startSession] Error:', error);
    res.status(500).json({
      error: 'Failed to start session',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTP Function: End a session
 *
 * POST /endSession
 * Body: { sessionId: string }
 */
export const endSession = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    await sessionService.endSession(sessionId);

    res.status(200).json({
      success: true,
      message: `Session ${sessionId} ended`,
    });
  } catch (error) {
    console.error('[endSession] Error:', error);
    res.status(500).json({
      error: 'Failed to end session',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTP Function: Pair device to session
 *
 * POST /pairDevice
 * Body: { sessionId: string, deviceId: string, team: 1 | 2 }
 */
export const pairDevice = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { sessionId, deviceId, team } = req.body;

    if (!sessionId || !deviceId || !team) {
      res.status(400).json({ error: 'sessionId, deviceId, and team are required' });
      return;
    }

    if (team !== 1 && team !== 2) {
      res.status(400).json({ error: 'team must be 1 or 2' });
      return;
    }

    await sessionService.pairDevice(sessionId, deviceId, team);

    // Send pairing response via MQTT
    const pairingResponse: PairingResponse = {
      status: 'ok',
      sessionId,
      topic: MQTT_TOPICS.sessionEvent(sessionId),
      team,
    };

    await mqttService.publish(
      MQTT_TOPICS.pairingResponse(deviceId),
      pairingResponse,
      { qos: 1, retain: false }
    );

    res.status(200).json({
      success: true,
      message: `Device ${deviceId} paired to team ${team} in session ${sessionId}`,
    });
  } catch (error) {
    console.error('[pairDevice] Error:', error);

    // Try to send error response via MQTT
    try {
      const { deviceId } = req.body;
      if (deviceId) {
        const errorResponse: PairingResponse = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
        await mqttService.publish(
          MQTT_TOPICS.pairingResponse(deviceId),
          errorResponse,
          { qos: 1, retain: false }
        );
      }
    } catch (mqttError) {
      console.error('[pairDevice] Failed to send error via MQTT:', mqttError);
    }

    res.status(500).json({
      error: 'Failed to pair device',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Background Function: Process MQTT Score Events
 *
 * This function is triggered by Firestore writes (optional)
 * OR you can set up an MQTT subscriber in a separate always-on service
 *
 * For now, we'll create an HTTP endpoint that processes score events
 * In production, you'd want this to be triggered by MQTT directly
 */
export const processScoreEvent = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { sessionId, event } = req.body;

    if (!sessionId || !event) {
      res.status(400).json({ error: 'sessionId and event are required' });
      return;
    }

    const scoreEvent: ScoreEvent = event;

    await sessionService.processScoreEvent(sessionId, scoreEvent);

    res.status(200).json({
      success: true,
      message: 'Score event processed',
    });
  } catch (error) {
    console.error('[processScoreEvent] Error:', error);
    res.status(500).json({
      error: 'Failed to process score event',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Scheduled Function: Clean up expired pairing windows
 * Runs every minute to close expired pairing windows
 */
export const cleanupExpiredPairing = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = Date.now();

    const expiredSessions = await db
      .collection('sessions')
      .where('pairingOpen', '==', true)
      .where('pairingExpiresAt', '<', now)
      .get();

    const batch = db.batch();

    expiredSessions.forEach((doc) => {
      batch.update(doc.ref, { pairingOpen: false });
    });

    await batch.commit();

    console.log(`[cleanupExpiredPairing] Closed ${expiredSessions.size} expired pairing windows`);
  });
