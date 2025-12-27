import { useSession } from '../context/SessionContext';

export default function MqttLogs() {
  const { mqttLogs, isConnected } = useSession();

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-bold">MQTT Debug Logs</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-white/70 text-sm">
              {isConnected ? 'Connesso' : 'Disconnesso'}
            </span>
          </div>
        </div>

        <div className="bg-black/50 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm">
          {mqttLogs.length === 0 ? (
            <div className="text-white/50 text-center py-8">Nessun log disponibile</div>
          ) : (
            <div className="space-y-1">
              {mqttLogs.map((log, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-white/50">[{log.timestamp}]</span>
                  <span className={getLogColor(log.type)}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
