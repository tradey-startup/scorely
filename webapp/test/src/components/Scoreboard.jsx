import { useSession } from '../context/SessionContext';

export default function Scoreboard() {
  const { sessionState } = useSession();

  const getStatusColor = () => {
    switch (sessionState.status) {
      case 'waiting':
        return 'bg-yellow-500';
      case 'running':
        return 'bg-green-500';
      case 'ended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (sessionState.status) {
      case 'waiting':
        return 'IN ATTESA';
      case 'running':
        return 'IN CORSO';
      case 'ended':
        return 'TERMINATA';
      default:
        return 'SCONOSCIUTO';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Status Badge */}
      <div className="flex justify-center mb-8">
        <div className={`${getStatusColor()} text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse`}>
          {getStatusText()}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-8">
        {/* Team 1 */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <div className="text-center">
            <h2 className="text-white text-4xl font-bold mb-6">SQUADRA 1</h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-white text-9xl font-black tabular-nums">
                {sessionState.team1}
              </div>
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-12 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <div className="text-center">
            <h2 className="text-white text-4xl font-bold mb-6">SQUADRA 2</h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-white text-9xl font-black tabular-nums">
                {sessionState.team2}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp (optional) */}
      {sessionState.timestamp && (
        <div className="text-center mt-6 text-white/60 text-sm">
          Ultimo aggiornamento: {new Date(sessionState.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
