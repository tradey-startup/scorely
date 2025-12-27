/**
 * Session Status Types
 */
export type SessionStatus = 'waiting' | 'running' | 'ended';

/**
 * Team identifier (1 or 2)
 */
export type TeamId = 1 | 2;

/**
 * Score object containing points for both teams
 */
export interface Score {
  team1: number;
  team2: number;
}

/**
 * Session Document stored in Firestore
 * This is the single source of truth for game state
 */
export interface Session {
  sessionId: string;
  locationId: string;
  status: SessionStatus;
  score: Score;

  // Pairing window
  pairingOpen: boolean;
  pairingExpiresAt: number | null; // Unix timestamp in milliseconds

  // Paired devices
  pairedDevices: {
    team1: string[]; // Array of device IDs
    team2: string[]; // Array of device IDs
  };

  // Metadata
  createdAt: number; // Unix timestamp
  startedAt: number | null; // When status changed to 'running'
  endedAt: number | null; // When status changed to 'ended'

  // Optional metadata
  metadata?: {
    sport?: string;
    maxScore?: number;
    notes?: string;
  };
}

/**
 * Score Event - published to MQTT topic: session/{sessionId}/event
 */
export interface ScoreEvent {
  type: 'score';
  action: 'increment' | 'decrement' | 'reset';
  team: TeamId;
  deviceId: string;
  timestamp: number; // Unix timestamp in milliseconds
  eventId?: string; // Optional unique event ID for idempotency
}

/**
 * Control Event - published to MQTT topic: session/{sessionId}/command
 */
export interface ControlEvent {
  type: 'control';
  action: 'start' | 'pause' | 'end' | 'reset';
  timestamp: number;
  initiatedBy?: string; // Device or user ID
}

/**
 * State Snapshot - published to MQTT topic: session/{sessionId}/state (RETAINED)
 * This is sent to all clients to sync the current game state
 */
export interface StateSnapshot {
  sessionId: string;
  team1: number;
  team2: number;
  status: SessionStatus;
  timestamp: number; // When this snapshot was created
}

/**
 * Pairing Request - published to MQTT topic: pairing/request
 */
export interface PairingRequest {
  deviceId: string;
  sessionId: string;
  timestamp: number;
}

/**
 * Pairing Response - published to MQTT topic: pairing/response/{deviceId}
 */
export interface PairingResponse {
  status: 'ok' | 'error';
  sessionId?: string;
  topic?: string; // The topic the device should publish events to
  team?: TeamId;
  error?: string; // Error message if status is 'error'
}

/**
 * Match History Entry - saved when a session ends
 */
export interface MatchHistory {
  matchId: string;
  sessionId: string;
  locationId: string;
  finalScore: Score;
  startedAt: number;
  endedAt: number;
  duration: number; // Duration in milliseconds
  pairedDevices: {
    team1: string[];
    team2: string[];
  };
  metadata?: Session['metadata'];
}
