import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleSelector from './components/RoleSelector';
import SessionWizard from './components/SessionWizard';
import ActiveMatch from './components/ActiveMatch';
import MqttLogs from './components/MqttLogs';
import MatchHistory from './components/MatchHistory';

function AppContent() {
  const { sessionId, sessionState } = useSession();
  const { auth, logout, hasPermission } = useAuth();
  const [currentView, setCurrentView] = useState('wizard');
  const [showLogs, setShowLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState('match'); // 'match' or 'history'

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

  // If not authenticated, show role selector
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen p-6 md:p-12">
        <header className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4">
            SCORELY
          </h1>
          <p className="text-white/70 text-lg md:text-xl">
            Sistema di Punteggio Sportivo IoT
          </p>
        </header>
        <RoleSelector />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-6xl md:text-7xl font-black text-white mb-4">
          SCORELY
        </h1>
        <p className="text-white/70 text-lg md:text-xl mb-6">
          Sistema di Punteggio Sportivo IoT
        </p>

        {/* User Info & Logout */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full">
            <span className="text-white font-semibold">
              {auth.role === 'display' && '👁️ Display'}
              {auth.role === 'controller' && '🎮 Controller'}
              {auth.role === 'admin' && '👑 Admin'}
            </span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/30 text-red-200 hover:bg-red-500/50 rounded-full font-semibold transition-all"
          >
            🚪 Logout
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentPage('match')}
            className={`px-6 py-3 font-bold rounded-2xl transition-all ${
              currentPage === 'match'
                ? 'bg-white text-purple-900 shadow-xl'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🎮 Partita Live
          </button>
          {hasPermission('canViewHistory') && (
            <button
              onClick={() => setCurrentPage('history')}
              className={`px-6 py-3 font-bold rounded-2xl transition-all ${
                currentPage === 'history'
                  ? 'bg-white text-purple-900 shadow-xl'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              📊 Storico
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-12">
        {/* Match Page */}
        {currentPage === 'match' && (
          <>
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
          </>
        )}

        {/* History Page */}
        {currentPage === 'history' && <MatchHistory />}
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
    <AuthProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;
