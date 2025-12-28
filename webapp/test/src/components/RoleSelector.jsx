/**
 * RoleSelector Component
 *
 * Allows users to select their role and authenticate
 * - DISPLAY: View only (no PIN required)
 * - CONTROLLER: Control match (PIN required)
 * - ADMIN: Full access to history and management (PIN required)
 */

import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ROLES = {
  DISPLAY: 'display',
  CONTROLLER: 'controller',
  ADMIN: 'admin'
};

const ROLE_INFO = {
  [ROLES.DISPLAY]: {
    title: '👁️ Modalità Display',
    description: 'Solo visualizzazione punteggio',
    icon: '📺',
    color: 'bg-blue-500',
    permissions: [
      '✅ Visualizza punteggio live',
      '❌ Non può controllare la partita',
      '❌ Non può vedere lo storico'
    ],
    requiresPIN: false
  },
  [ROLES.CONTROLLER]: {
    title: '🎮 Modalità Controller',
    description: 'Controllo completo della partita',
    icon: '🕹️',
    color: 'bg-green-500',
    permissions: [
      '✅ Visualizza punteggio live',
      '✅ Controlla la partita (start/stop/reset)',
      '✅ Gestisce pairing braccialetti',
      '❌ Non può vedere lo storico'
    ],
    requiresPIN: true,
    defaultPIN: '1234'
  },
  [ROLES.ADMIN]: {
    title: '⚙️ Modalità Admin',
    description: 'Accesso completo al sistema',
    icon: '👑',
    color: 'bg-purple-500',
    permissions: [
      '✅ Visualizza punteggio live',
      '✅ Controlla la partita',
      '✅ Visualizza storico partite',
      '✅ Gestisce location',
      '✅ Elimina partite'
    ],
    requiresPIN: true,
    defaultPIN: '9999'
  }
};

export default function RoleSelector({ onRoleSelected }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPINHint, setShowPINHint] = useState(false);

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setPin('');
    setError(null);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: selectedRole,
          pin: ROLE_INFO[selectedRole].requiresPIN ? pin : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and role
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_role', data.role);
        localStorage.setItem('auth_permissions', JSON.stringify(data.permissions));

        // Notify parent component
        if (onRoleSelected) {
          onRoleSelected({
            role: data.role,
            token: data.token,
            permissions: data.permissions
          });
        }
      } else {
        setError(data.error || 'Autenticazione fallita');
      }
    } catch (err) {
      setError('Errore di connessione al server: ' + err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    setSelectedRole(role);
    if (!ROLE_INFO[role].requiresPIN) {
      // Display role can login immediately
      setLoading(true);
      setTimeout(() => handleLogin(), 100);
    }
  };

  if (selectedRole) {
    const roleInfo = ROLE_INFO[selectedRole];

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{roleInfo.icon}</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {roleInfo.title}
            </h2>
            <p className="text-white/70">{roleInfo.description}</p>
          </div>

          {/* Permissions */}
          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-3">Permessi:</h3>
            <ul className="space-y-2">
              {roleInfo.permissions.map((perm, idx) => (
                <li key={idx} className="text-white/80">
                  {perm}
                </li>
              ))}
            </ul>
          </div>

          {/* PIN Input (if required) */}
          {roleInfo.requiresPIN && (
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                🔐 Inserisci PIN:
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="****"
                className="w-full px-6 py-4 rounded-xl bg-white/20 text-white text-2xl text-center tracking-widest border-2 border-white/30 focus:border-white/60 focus:outline-none placeholder-white/40"
                maxLength="4"
                disabled={loading}
                autoFocus
              />
              <div className="mt-2 text-center">
                <button
                  onClick={() => setShowPINHint(!showPINHint)}
                  className="text-white/60 hover:text-white/80 text-sm underline"
                >
                  {showPINHint ? '🙈 Nascondi' : '💡 Mostra'} PIN di default
                </button>
                {showPINHint && (
                  <div className="mt-2 text-yellow-300 font-mono text-lg">
                    PIN: {roleInfo.defaultPIN}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl">
              <p className="text-red-200 text-center">❌ {error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setSelectedRole(null);
                setPin('');
                setError(null);
              }}
              className="flex-1 px-6 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all"
              disabled={loading}
            >
              ← Indietro
            </button>
            <button
              onClick={handleLogin}
              disabled={loading || (roleInfo.requiresPIN && pin.length === 0)}
              className={`flex-1 px-6 py-4 font-bold rounded-2xl transition-all ${
                loading || (roleInfo.requiresPIN && pin.length === 0)
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : `${roleInfo.color} text-white hover:opacity-90 shadow-xl`
              }`}
            >
              {loading ? '🔄 Verifica...' : '✅ Conferma'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Role selection screen
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-3">
          🔐 Seleziona la tua Modalità
        </h2>
        <p className="text-white/70 text-lg">
          Scegli il livello di accesso appropriato
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(ROLE_INFO).map(([role, info]) => (
          <button
            key={role}
            onClick={() => handleRoleClick(role)}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 hover:bg-white/20 transition-all shadow-xl hover:shadow-2xl hover:scale-105 group"
          >
            {/* Icon */}
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
              {info.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2">
              {info.title.split(' ')[1]} {/* Remove emoji from title */}
            </h3>

            {/* Description */}
            <p className="text-white/70 text-sm mb-4">
              {info.description}
            </p>

            {/* PIN Badge */}
            {info.requiresPIN && (
              <div className="inline-block px-3 py-1 bg-yellow-500/30 text-yellow-200 rounded-full text-xs font-semibold">
                🔐 Richiede PIN
              </div>
            )}
            {!info.requiresPIN && (
              <div className="inline-block px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-xs font-semibold">
                ✅ Accesso Libero
              </div>
            )}

            {/* Quick Access for Display */}
            {!info.requiresPIN && (
              <div className="mt-4">
                <div
                  className={`px-4 py-2 ${info.color} text-white rounded-xl font-semibold opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  Click per entrare →
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info Footer */}
      <div className="mt-8 text-center">
        <div className="inline-block bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4">
          <p className="text-white/60 text-sm">
            💡 <strong>Suggerimento:</strong> Usa Display per schermi pubblici,
            Controller per gestire le partite, Admin per configurazione completa
          </p>
        </div>
      </div>
    </div>
  );
}
