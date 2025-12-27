import { createContext, useContext, useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { MQTT_CONFIG, MQTT_TOPICS } from '../config/mqtt';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [sessionState, setSessionState] = useState({
    team1: 0,
    team2: 0,
    status: 'waiting',
    timestamp: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [mqttLogs, setMqttLogs] = useState([]);

  const clientRef = useRef(null);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setMqttLogs(prev => [...prev.slice(-50), { timestamp, message, type }]);
  };

  // Connect to MQTT broker
  useEffect(() => {
    addLog('Connecting to MQTT broker...', 'info');

    const client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);
    clientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      addLog('✅ Connected to MQTT broker', 'success');
    });

    client.on('error', (error) => {
      setConnectionError(error.message);
      addLog(`❌ Connection error: ${error.message}`, 'error');
    });

    client.on('close', () => {
      setIsConnected(false);
      addLog('⚠️ Connection closed', 'warning');
    });

    client.on('reconnect', () => {
      addLog('🔄 Reconnecting...', 'info');
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        addLog(`📨 Received: ${topic}`, 'info');

        // Handle state snapshot
        if (topic.includes('/state')) {
          setSessionState({
            team1: payload.team1,
            team2: payload.team2,
            status: payload.status,
            timestamp: payload.timestamp,
          });
          addLog(`📊 State updated: ${payload.team1}-${payload.team2} (${payload.status})`, 'success');
        }
      } catch (error) {
        addLog(`❌ Failed to parse message: ${error.message}`, 'error');
      }
    });

    // Cleanup on unmount
    return () => {
      if (client) {
        client.end();
        addLog('Disconnected from MQTT broker', 'info');
      }
    };
  }, []);

  // Subscribe to session when sessionId changes
  useEffect(() => {
    if (!clientRef.current || !isConnected || !sessionId) return;

    const stateTopic = MQTT_TOPICS.sessionState(sessionId);

    clientRef.current.subscribe(stateTopic, { qos: 1 }, (error) => {
      if (error) {
        addLog(`❌ Failed to subscribe to ${stateTopic}: ${error.message}`, 'error');
      } else {
        addLog(`✅ Subscribed to ${stateTopic}`, 'success');
      }
    });

    // Cleanup: unsubscribe when sessionId changes
    return () => {
      if (clientRef.current && isConnected) {
        clientRef.current.unsubscribe(stateTopic, () => {
          addLog(`Unsubscribed from ${stateTopic}`, 'info');
        });
      }
    };
  }, [sessionId, isConnected]);

  // Publish state snapshot (for testing or manual updates)
  const publishState = (newState) => {
    if (!clientRef.current || !isConnected || !sessionId) {
      addLog('❌ Cannot publish: not connected or no session', 'error');
      return;
    }

    const stateTopic = MQTT_TOPICS.sessionState(sessionId);
    const payload = {
      sessionId,
      ...newState,
      timestamp: Date.now(),
    };

    clientRef.current.publish(
      stateTopic,
      JSON.stringify(payload),
      { qos: 1, retain: true },
      (error) => {
        if (error) {
          addLog(`❌ Failed to publish state: ${error.message}`, 'error');
        } else {
          addLog('✅ State published', 'success');
        }
      }
    );
  };

  // Start session
  const startSession = () => {
    publishState({
      team1: sessionState.team1,
      team2: sessionState.team2,
      status: 'running',
    });
  };

  // End session
  const endSession = () => {
    publishState({
      team1: sessionState.team1,
      team2: sessionState.team2,
      status: 'ended',
    });
  };

  // Reset scores
  const resetScores = () => {
    publishState({
      team1: 0,
      team2: 0,
      status: sessionState.status,
    });
  };

  // Increment team score (for manual testing)
  const incrementScore = (team) => {
    const newState = { ...sessionState };
    if (team === 1) {
      newState.team1 += 1;
    } else if (team === 2) {
      newState.team2 += 1;
    }
    publishState(newState);
  };

  // Join session
  const joinSession = (newSessionId) => {
    setSessionId(newSessionId);
    setSessionState({ team1: 0, team2: 0, status: 'waiting', timestamp: null });
    addLog(`🎮 Joined session: ${newSessionId}`, 'info');
  };

  // Create new session
  const createSession = () => {
    const newSessionId = generateSessionId();
    joinSession(newSessionId);

    // Publish initial state
    setTimeout(() => {
      publishState({
        team1: 0,
        team2: 0,
        status: 'waiting',
      });
    }, 500);
  };

  const value = {
    sessionId,
    sessionState,
    isConnected,
    connectionError,
    mqttLogs,
    joinSession,
    createSession,
    startSession,
    endSession,
    resetScores,
    incrementScore,
    publishState,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// Generate random session ID
function generateSessionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
