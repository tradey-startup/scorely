import { useState } from 'react';
import { useSession } from '../context/SessionContext';

export default function Controls() {
  const {
    sessionId,
    sessionState,
    joinSession,
    createSession,
    startSession,
    endSession,
    resetScores,
    incrementScore,
  } = useSession();

  const [inputSessionId, setInputSessionId] = useState('');

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (inputSessionId.trim()) {
      joinSession(inputSessionId.trim().toUpperCase());
      setInputSessionId('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Session Info */}
      {sessionId ? (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="text-center">
            <p className="text-white/70 text-sm mb-2">Session ID</p>
            <p className="text-white text-4xl font-black tracking-wider">{sessionId}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="text-center">
            <p className="text-white/70 text-lg">Nessuna sessione attiva</p>
          </div>
        </div>
      )}

      {/* Join or Create Session */}
      {!sessionId && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-white text-xl font-bold mb-4">Inizia o Unisciti</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create New Session */}
            <button
              onClick={createSession}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Crea Nuova Sessione
            </button>

            {/* Join Existing Session */}
            <form onSubmit={handleJoinSession} className="flex gap-2">
              <input
                type="text"
                value={inputSessionId}
                onChange={(e) => setInputSessionId(e.target.value)}
                placeholder="ABC123"
                className="flex-1 bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                maxLength={6}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Unisciti
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Game Controls */}
      {sessionId && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-white text-xl font-bold mb-4">Controlli Partita</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Start */}
            <button
              onClick={startSession}
              disabled={sessionState.status === 'running' || sessionState.status === 'ended'}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200"
            >
              ▶ Start
            </button>

            {/* End */}
            <button
              onClick={endSession}
              disabled={sessionState.status !== 'running'}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200"
            >
              ■ End
            </button>

            {/* Reset */}
            <button
              onClick={resetScores}
              disabled={sessionState.status === 'ended'}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200"
            >
              ↺ Reset
            </button>

            {/* Leave Session */}
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ← Esci
            </button>
          </div>
        </div>
      )}

      {/* Manual Score Controls (for testing) */}
      {sessionId && sessionState.status === 'running' && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-white text-xl font-bold mb-4">Test Punteggio Manuale</h3>
          <p className="text-white/70 text-sm mb-4">
            In produzione, i braccialetti ESP32 invieranno questi eventi automaticamente
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => incrementScore(1)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              + Squadra 1
            </button>

            <button
              onClick={() => incrementScore(2)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              + Squadra 2
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
