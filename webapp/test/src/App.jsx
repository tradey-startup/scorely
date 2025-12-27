import { SessionProvider } from './context/SessionContext';
import Scoreboard from './components/Scoreboard';
import Controls from './components/Controls';
import MqttLogs from './components/MqttLogs';

function App() {
  return (
    <SessionProvider>
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
          {/* Scoreboard */}
          <Scoreboard />

          {/* Controls */}
          <Controls />

          {/* MQTT Logs */}
          <MqttLogs />
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-white/50 text-sm">
          <p>Powered by React + MQTT + Firebase</p>
        </footer>
      </div>
    </SessionProvider>
  );
}

export default App;
