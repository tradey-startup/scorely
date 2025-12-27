import { Firestore } from 'firebase-admin/firestore';
import {
  Session,
  ScoreEvent,
  StateSnapshot,
  TeamId,
  MatchHistory,
} from '../types/session.types';
import { mqttService } from './mqtt.service';

/**
 * Session Service
 * Handles all session-related operations and state management
 */
export class SessionService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Create a new session
   */
  async createSession(locationId: string, metadata?: Session['metadata']): Promise<Session> {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: Session = {
      sessionId,
      locationId,
      status: 'waiting',
      score: {
        team1: 0,
        team2: 0,
      },
      pairingOpen: true,
      pairingExpiresAt: now + 60000, // 60 seconds from now
      pairedDevices: {
        team1: [],
        team2: [],
      },
      createdAt: now,
      startedAt: null,
      endedAt: null,
      metadata,
    };

    // Save to Firestore
    await this.db.collection('sessions').doc(sessionId).set(session);

    // Publish initial state snapshot
    await this.publishStateSnapshot(session);

    console.log(`[Session] Created new session: ${sessionId}`);
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const doc = await this.db.collection('sessions').doc(sessionId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as Session;
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    await this.db.collection('sessions').doc(sessionId).update(updates);
  }

  /**
   * Process a score event
   * This is the core logic that handles score updates
   */
  async processScoreEvent(sessionId: string, event: ScoreEvent): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      console.error(`[Session] Session not found: ${sessionId}`);
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check if session is in running state
    if (session.status !== 'running') {
      console.warn(`[Session] Cannot process score event: session ${sessionId} is ${session.status}`);
      return;
    }

    // Validate that the device is paired to this session
    const deviceTeam = this.getDeviceTeam(session, event.deviceId);
    if (!deviceTeam) {
      console.warn(`[Session] Device ${event.deviceId} is not paired to session ${sessionId}`);
      return;
    }

    // Validate that the device is sending events for its assigned team
    if (deviceTeam !== event.team) {
      console.warn(
        `[Session] Device ${event.deviceId} is paired to team ${deviceTeam} but sent event for team ${event.team}`
      );
      return;
    }

    // Calculate new score
    const newScore = { ...session.score };
    const teamKey = `team${event.team}` as keyof typeof newScore;

    switch (event.action) {
      case 'increment':
        newScore[teamKey] += 1;
        break;
      case 'decrement':
        newScore[teamKey] = Math.max(0, newScore[teamKey] - 1);
        break;
      case 'reset':
        newScore[teamKey] = 0;
        break;
    }

    // Update session in Firestore
    await this.updateSession(sessionId, { score: newScore });

    // Publish updated state snapshot
    session.score = newScore;
    await this.publishStateSnapshot(session);

    console.log(`[Session] Processed score event for ${sessionId}:`, {
      team: event.team,
      action: event.action,
      newScore,
    });
  }

  /**
   * Start a session
   */
  async startSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'waiting') {
      console.warn(`[Session] Cannot start session ${sessionId}: already ${session.status}`);
      return;
    }

    const now = Date.now();

    await this.updateSession(sessionId, {
      status: 'running',
      startedAt: now,
      pairingOpen: false, // Close pairing when game starts
    });

    // Publish updated state
    session.status = 'running';
    session.startedAt = now;
    await this.publishStateSnapshot(session);

    console.log(`[Session] Started session: ${sessionId}`);
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status === 'ended') {
      console.warn(`[Session] Session ${sessionId} is already ended`);
      return;
    }

    const now = Date.now();

    await this.updateSession(sessionId, {
      status: 'ended',
      endedAt: now,
      pairingOpen: false,
    });

    // Publish updated state
    session.status = 'ended';
    session.endedAt = now;
    await this.publishStateSnapshot(session);

    // Save to match history
    await this.saveToHistory(session);

    console.log(`[Session] Ended session: ${sessionId}`);
  }

  /**
   * Publish state snapshot to MQTT
   */
  private async publishStateSnapshot(session: Session): Promise<void> {
    const snapshot: StateSnapshot = {
      sessionId: session.sessionId,
      team1: session.score.team1,
      team2: session.score.team2,
      status: session.status,
      timestamp: Date.now(),
    };

    await mqttService.publishStateSnapshot(session.sessionId, snapshot);
  }

  /**
   * Get which team a device is paired to
   */
  private getDeviceTeam(session: Session, deviceId: string): TeamId | null {
    if (session.pairedDevices.team1.includes(deviceId)) {
      return 1;
    }
    if (session.pairedDevices.team2.includes(deviceId)) {
      return 2;
    }
    return null;
  }

  /**
   * Save completed session to match history
   */
  private async saveToHistory(session: Session): Promise<void> {
    if (!session.startedAt || !session.endedAt) {
      console.warn(`[Session] Cannot save to history: session ${session.sessionId} has no start/end time`);
      return;
    }

    const matchId = `match_${session.sessionId}_${session.endedAt}`;

    const history: MatchHistory = {
      matchId,
      sessionId: session.sessionId,
      locationId: session.locationId,
      finalScore: session.score,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.endedAt - session.startedAt,
      pairedDevices: session.pairedDevices,
      metadata: session.metadata,
    };

    await this.db.collection('match_history').doc(matchId).set(history);

    console.log(`[Session] Saved to history: ${matchId}`);
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Pair a device to a session
   */
  async pairDevice(sessionId: string, deviceId: string, team: TeamId): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.pairingOpen) {
      throw new Error(`Pairing is closed for session: ${sessionId}`);
    }

    if (session.pairingExpiresAt && Date.now() > session.pairingExpiresAt) {
      throw new Error(`Pairing window has expired for session: ${sessionId}`);
    }

    // Check if device is already paired
    const currentTeam = this.getDeviceTeam(session, deviceId);
    if (currentTeam) {
      console.log(`[Session] Device ${deviceId} is already paired to team ${currentTeam}`);
      return;
    }

    // Add device to team
    const teamKey = `team${team}` as 'team1' | 'team2';
    const updatedDevices = {
      ...session.pairedDevices,
      [teamKey]: [...session.pairedDevices[teamKey], deviceId],
    };

    await this.updateSession(sessionId, {
      pairedDevices: updatedDevices,
    });

    console.log(`[Session] Paired device ${deviceId} to team ${team} in session ${sessionId}`);
  }
}
