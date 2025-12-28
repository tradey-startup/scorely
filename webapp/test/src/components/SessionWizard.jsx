import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSession } from '../context/SessionContext';

function SessionWizard() {
  const { sessionId, isConnected, pairedDevices, openPairing, createSession } = useSession();
  const [currentStep, setCurrentStep] = useState('welcome');
  const [pairingTimeLeft, setPairingTimeLeft] = useState(0);

  // Step flow: welcome → qr → pairing → ready

  useEffect(() => {
    // Auto-transition from qr to pairing when session is created
    if (currentStep === 'qr' && sessionId && isConnected) {
      const timer = setTimeout(() => {
        setCurrentStep('pairing');
        // Auto-open pairing window
        openPairing(60);
        setPairingTimeLeft(60);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, sessionId, isConnected, openPairing]);

  useEffect(() => {
    // Handle pairing countdown
    if (currentStep === 'pairing' && pairingTimeLeft > 0) {
      const timer = setInterval(() => {
        setPairingTimeLeft(prev => {
          if (prev <= 1) {
            setCurrentStep('ready');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentStep, pairingTimeLeft]);

  const handleStartSession = () => {
    createSession();
    setCurrentStep('qr');
  };

  const handleOpenPairing = () => {
    setPairingTimeLeft(60);
    openPairing(60);
  };

  const handleJoinExisting = () => {
    const inputSessionId = prompt('Inserisci il codice sessione (6 caratteri):');
    if (inputSessionId && inputSessionId.length === 6) {
      // TODO: implement joinSession
      alert(`Funzione Join Session per ${inputSessionId} - Da implementare`);
    }
  };

  // Welcome Screen
  if (currentStep === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-bold text-white">Benvenuto in Scorely</h2>
          <p className="text-white/70 text-xl max-w-md">
            Sistema di punteggio sportivo IoT con braccialetti ESP32
          </p>
        </div>

        <div className="space-y-4 w-full max-w-md">
          <button
            onClick={handleStartSession}
            disabled={!isConnected}
            className="w-full py-6 px-8 bg-linear-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
          >
            {isConnected ? '🎮 Crea Nuova Partita' : '⏳ Connessione in corso...'}
          </button>

          <button
            onClick={handleJoinExisting}
            className="w-full py-4 px-8 bg-white/10 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 transition-colors border border-white/20"
          >
            📋 Unisciti a Partita Esistente
          </button>
        </div>

        <div className="text-center text-white/50 text-sm">
          <p>Stato connessione: {isConnected ? '✅ Connesso' : '❌ Non connesso'}</p>
        </div>
      </div>
    );
  }

  // QR Code Screen
  if (currentStep === 'qr') {
    const sessionUrl = `${window.location.origin}?session=${sessionId}`;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-white">Sessione Creata!</h2>
          <p className="text-white/70 text-lg">
            ID Sessione: <span className="font-mono font-bold text-white text-2xl">{sessionId}</span>
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl flex items-center justify-center">
          <QRCodeSVG
            value={sessionUrl}
            size={280}
            level="H"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-white/70">Scansiona il QR code per unirti alla partita</p>
          <p className="text-white/50 text-sm font-mono">{sessionUrl}</p>
        </div>

        <div className="flex items-center space-x-2 text-white/70">
          <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
          <span>Preparazione sessione...</span>
        </div>
      </div>
    );
  }

  // Pairing Screen
  if (currentStep === 'pairing') {
    const progress = ((60 - pairingTimeLeft) / 60) * 100;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-bold text-white">Pairing Braccialetti</h2>
          <p className="text-white/70 text-xl">
            Premi <span className="font-bold text-white">+ e −</span> contemporaneamente sul braccialetto
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="relative w-64 h-64">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="112"
              stroke="currentColor"
              strokeWidth="16"
              fill="transparent"
              className="text-white/10"
            />
            <circle
              cx="128"
              cy="128"
              r="112"
              stroke="currentColor"
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={704}
              strokeDashoffset={704 - (704 * progress) / 100}
              className="text-blue-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-7xl font-bold text-white">{pairingTimeLeft}</div>
            <div className="text-white/70 text-lg">secondi</div>
          </div>
        </div>

        {/* Paired Devices */}
        <div className="w-full max-w-2xl space-y-4">
          <h3 className="text-2xl font-bold text-white text-center">
            Braccialetti Collegati: {pairedDevices?.length || 0}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Team 1 */}
            <div className="bg-blue-600/20 border-2 border-blue-500 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-blue-400 mb-4">Team 1</h4>
              <div className="space-y-2">
                {pairedDevices?.filter(d => d.team === 1).map(device => (
                  <div key={device.deviceId} className="flex items-center space-x-2 text-white">
                    <span className="text-2xl">📱</span>
                    <span className="font-mono text-sm">{device.deviceId}</span>
                  </div>
                ))}
                {(!pairedDevices || pairedDevices.filter(d => d.team === 1).length === 0) && (
                  <p className="text-white/50 text-sm">Nessun braccialetto</p>
                )}
              </div>
            </div>

            {/* Team 2 */}
            <div className="bg-purple-600/20 border-2 border-purple-500 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-purple-400 mb-4">Team 2</h4>
              <div className="space-y-2">
                {pairedDevices?.filter(d => d.team === 2).map(device => (
                  <div key={device.deviceId} className="flex items-center space-x-2 text-white">
                    <span className="text-2xl">📱</span>
                    <span className="font-mono text-sm">{device.deviceId}</span>
                  </div>
                ))}
                {(!pairedDevices || pairedDevices.filter(d => d.team === 2).length === 0) && (
                  <p className="text-white/50 text-sm">Nessun braccialetto</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentStep('ready')}
          className="py-4 px-8 bg-white/10 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 transition-colors border border-white/20"
        >
          Salta Pairing
        </button>
      </div>
    );
  }

  // Ready Screen
  if (currentStep === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-bold text-white">Tutto Pronto!</h2>
          <p className="text-white/70 text-xl">
            {pairedDevices?.length || 0} braccialetti collegati
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-400">{pairedDevices?.filter(d => d.team === 1).length || 0}</div>
            <div className="text-white/70">Team 1</div>
          </div>
          <div className="text-white/50 text-6xl">vs</div>
          <div className="text-center">
            <div className="text-6xl font-bold text-purple-400">{pairedDevices?.filter(d => d.team === 2).length || 0}</div>
            <div className="text-white/70">Team 2</div>
          </div>
        </div>

        <div className="space-y-4 w-full max-w-md">
          <button
            onClick={handleOpenPairing}
            className="w-full py-4 px-8 bg-linear-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-2xl hover:scale-105 transition-transform shadow-2xl"
          >
            🔗 Riapri Pairing (60s)
          </button>

          <button
            onClick={() => setCurrentStep('playing')}
            className="w-full py-6 px-8 bg-green-600 text-white text-xl font-bold rounded-2xl hover:scale-105 transition-transform shadow-2xl"
          >
            ▶️ Inizia Partita
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default SessionWizard;
