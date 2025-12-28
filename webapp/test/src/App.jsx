import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import SessionWizard from './components/SessionWizard';
import ActiveMatch from './components/ActiveMatch';
import MqttLogs from './components/MqttLogs';

function AppContent() {
  const { sessionId, sessionState } = useSession();
  const [currentView, setCurrentView] = useState('wizard');
  const [showLogs, setShowLogs] = useState(false);

  // Auto-switch to match view when session starts
  useEffect(() => {
    if (sessionId && sessionState.status === 'running') {
      setCurrentView('match');
    }
  }, [sessionId, sessionState.status]);

  // Check for session ID in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSessionId = params.get('session');
    if (urlSessionId) {
      // TODO: implement joinSession from URL
      console.log('Session ID from URL:', urlSessionId);
    }
  }, []);

  const handleEndMatch = () => {
    setCurrentView('wizard');
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-6xl md:text-7xl font-black text-white mb-4">
          SCORELY
        </h1>
        <p className="text-white/70 text-lg md:text-xl">
          Sistema di Punteggio Sportivo IoT
        </p>
      </header>

      {/* Main Content */}
      <div className="space-y-12">
        {!sessionId && <SessionWizard />}

        {sessionId && currentView === 'match' && (
          <>
            <ActiveMatch onEndMatch={handleEndMatch} />

            {/* View Toggle for Debug Logs */}
            <div className="text-center">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
              >
                {showLogs ? '🙈 Nascondi Log MQTT' : '👁️ Mostra Log MQTT'}
              </button>
            </div>

            {/* MQTT Logs (collapsible) */}
            {showLogs && <MqttLogs />}
          </>
        )}

        {sessionId && currentView !== 'match' && <SessionWizard />}
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-white/50 text-sm">
        <p>Powered by React + MQTT + ESP32</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
