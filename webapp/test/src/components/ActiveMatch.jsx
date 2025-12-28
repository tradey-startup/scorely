import { useSession } from '../context/SessionContext';

function ActiveMatch({ onEndMatch }) {
  const { sessionId, sessionState, startSession, endSession, resetScores, pairedDevices } = useSession();

  const handleStart = () => {
    startSession();
  };

  const handleEnd = () => {
    endSession();
    if (onEndMatch) onEndMatch();
  };

  const handleReset = () => {
    if (window.confirm('Sei sicuro di voler resettare il punteggio?')) {
      resetScores();
    }
  };

  const isWaiting = sessionState.status === 'waiting';
  const isRunning = sessionState.status === 'running';
  const isEnded = sessionState.status === 'ended';

  return (
    <div className="space-y-8">
      {/* Session Info */}
      <div className="text-center space-y-2">
        <div className="inline-block bg-white/10 px-6 py-3 rounded-full">
          <span className="text-white/70 text-sm">Sessione: </span>
          <span className="text-white font-mono font-bold text-lg">{sessionId}</span>
        </div>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className={`px-4 py-2 rounded-full font-semibold ${
            isWaiting ? 'bg-yellow-600/20 text-yellow-400' :
            isRunning ? 'bg-green-600/20 text-green-400' :
            'bg-red-600/20 text-red-400'
          }`}>
            {isWaiting ? '⏸️ In Attesa' : isRunning ? '▶️ In Corso' : '⏹️ Terminata'}
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-full text-white/70">
            📱 {pairedDevices?.length || 0} braccialetti
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-linear-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="grid grid-cols-2 divide-x divide-white/10">
          {/* Team 1 */}
          <div className="p-8 md:p-12 bg-linear-to-br from-blue-600/10 to-transparent">
            <div className="text-center space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-blue-400">Team 1</h3>
              <div className="text-8xl md:text-9xl font-black text-white tabular-nums">
                {sessionState.team1}
              </div>
              <div className="space-y-2">
                <p className="text-white/50 text-sm">Braccialetti collegati:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {pairedDevices?.filter(d => d.team === 1).map(device => (
                    <div key={device.deviceId} className="bg-blue-600/20 px-3 py-1 rounded-full text-xs font-mono text-blue-300">
                      {device.deviceId.slice(-8)}
                    </div>
                  ))}
                  {(!pairedDevices || pairedDevices.filter(d => d.team === 1).length === 0) && (
                    <p className="text-white/30 text-xs">Nessuno</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Team 2 */}
          <div className="p-8 md:p-12 bg-linear-to-bl from-purple-600/10 to-transparent">
            <div className="text-center space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-purple-400">Team 2</h3>
              <div className="text-8xl md:text-9xl font-black text-white tabular-nums">
                {sessionState.team2}
              </div>
              <div className="space-y-2">
                <p className="text-white/50 text-sm">Braccialetti collegati:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {pairedDevices?.filter(d => d.team === 2).map(device => (
                    <div key={device.deviceId} className="bg-purple-600/20 px-3 py-1 rounded-full text-xs font-mono text-purple-300">
                      {device.deviceId.slice(-8)}
                    </div>
                  ))}
                  {(!pairedDevices || pairedDevices.filter(d => d.team === 2).length === 0) && (
                    <p className="text-white/30 text-xs">Nessuno</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isWaiting && (
          <button
            onClick={handleStart}
            className="col-span-full py-6 px-8 bg-linear-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:scale-105 transition-transform shadow-2xl"
          >
            ▶️ Inizia Partita
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={handleEnd}
              className="py-4 px-6 bg-red-600 text-white text-lg font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl"
            >
              ⏹️ Termina
            </button>
            <button
              onClick={handleReset}
              className="py-4 px-6 bg-orange-600 text-white text-lg font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl"
            >
              🔄 Reset
            </button>
            <div className="flex items-center justify-center bg-green-600/20 border-2 border-green-500 rounded-2xl px-6 py-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">Partita in corso</span>
              </div>
            </div>
          </>
        )}

        {isEnded && (
          <>
            <button
              onClick={handleReset}
              className="py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl"
            >
              🔄 Nuova Partita
            </button>
            <div className="col-span-2 flex items-center justify-center bg-red-600/20 border-2 border-red-500 rounded-2xl px-6 py-4">
              <div className="text-center">
                <p className="text-red-400 font-semibold text-lg">Partita Terminata</p>
                <p className="text-white/70 text-sm mt-1">
                  Vincitore: {sessionState.team1 > sessionState.team2 ? 'Team 1' : sessionState.team2 > sessionState.team1 ? 'Team 2' : 'Pareggio'}
                  {sessionState.team1 !== sessionState.team2 && ` (${Math.max(sessionState.team1, sessionState.team2)}-${Math.min(sessionState.team1, sessionState.team2)})`}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Live Events Indicator */}
      {isRunning && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white/70 text-sm">In attesa di eventi dai braccialetti...</span>
            </div>
            {sessionState.timestamp && (
              <span className="text-white/50 text-xs">
                Ultimo aggiornamento: {new Date(sessionState.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveMatch;
