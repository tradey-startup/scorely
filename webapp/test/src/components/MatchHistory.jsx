/**
 * MatchHistory Component
 *
 * Displays historical match data with filtering and statistics
 * Fetches data from API service (api-service.js)
 */

import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MatchHistory() {
  const [matches, setMatches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [limit, setLimit] = useState(20);
  const [statsDays, setStatsDays] = useState(30);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch matches when filters change
  useEffect(() => {
    fetchMatches();
  }, [selectedLocation, limit]);

  // Fetch stats when location or days change
  useEffect(() => {
    if (selectedLocation && selectedLocation !== 'all') {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [selectedLocation, statsDays]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`);
      const data = await response.json();

      if (data.success) {
        setLocations(data.locations || []);
      } else {
        console.error('Failed to fetch locations:', data.error);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        orderBy: 'endTime',
        order: 'desc'
      });

      if (selectedLocation && selectedLocation !== 'all') {
        params.append('locationId', selectedLocation);
      }

      const response = await fetch(`${API_BASE_URL}/api/matches?${params}`);
      const data = await response.json();

      if (data.success) {
        setMatches(data.matches || []);
      } else {
        setError(data.error || 'Failed to fetch matches');
      }
    } catch (err) {
      setError('Error connecting to API service: ' + err.message);
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/stats/${selectedLocation}?days=${statsDays}`
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.error);
        setStats(null);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getWinnerBadge = (winner) => {
    if (winner === 'team1') {
      return <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">Team 1</span>;
    } else if (winner === 'team2') {
      return <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">Team 2</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-400 text-white rounded-full text-sm font-semibold">Pareggio</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black text-white mb-2">
            📊 Storico Partite
          </h1>
          <p className="text-white/70 text-lg">
            Visualizza lo storico completo delle partite giocate
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">🔍 Filtri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div>
              <label className="block text-white/80 font-semibold mb-2">
                📍 Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border-2 border-white/30 focus:border-white/60 focus:outline-none"
              >
                <option value="all">Tutte le Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Filter */}
            <div>
              <label className="block text-white/80 font-semibold mb-2">
                📄 Numero Partite
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border-2 border-white/30 focus:border-white/60 focus:outline-none"
              >
                <option value={10}>10 partite</option>
                <option value={20}>20 partite</option>
                <option value={50}>50 partite</option>
                <option value={100}>100 partite</option>
              </select>
            </div>

            {/* Stats Days Filter */}
            {selectedLocation !== 'all' && (
              <div>
                <label className="block text-white/80 font-semibold mb-2">
                  📈 Periodo Statistiche
                </label>
                <select
                  value={statsDays}
                  onChange={(e) => setStatsDays(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border-2 border-white/30 focus:border-white/60 focus:outline-none"
                >
                  <option value={7}>Ultimi 7 giorni</option>
                  <option value={30}>Ultimi 30 giorni</option>
                  <option value={90}>Ultimi 90 giorni</option>
                  <option value={365}>Ultimo anno</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Panel */}
        {stats && selectedLocation !== 'all' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">📈 Statistiche</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-white/60 text-sm mb-1">Partite Totali</div>
                <div className="text-3xl font-bold text-white">{stats.totalMatches || 0}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-white/60 text-sm mb-1">Durata Media</div>
                <div className="text-3xl font-bold text-white">
                  {Math.round(stats.averageDuration || 0)}s
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-white/60 text-sm mb-1">Vittorie Team 1</div>
                <div className="text-3xl font-bold text-blue-400">{stats.team1Wins || 0}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-white/60 text-sm mb-1">Vittorie Team 2</div>
                <div className="text-3xl font-bold text-red-400">{stats.team2Wins || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
            <p className="text-white text-xl">Caricamento partite...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-3xl p-8 text-center">
            <p className="text-white text-xl mb-2">❌ Errore</p>
            <p className="text-white/80">{error}</p>
            <button
              onClick={fetchMatches}
              className="mt-4 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
            >
              🔄 Riprova
            </button>
          </div>
        )}

        {/* Matches List */}
        {!loading && !error && matches.length === 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center">
            <p className="text-white text-2xl mb-2">📭 Nessuna partita trovata</p>
            <p className="text-white/60">
              Nessuna partita è stata ancora salvata nel database.
            </p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              🎮 Partite ({matches.length})
            </h2>
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl hover:bg-white/15 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Match Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white/60 text-sm font-mono">
                        #{match.sessionId}
                      </span>
                      {match.locationId && (
                        <span className="px-2 py-1 bg-purple-500/30 text-purple-200 rounded-lg text-xs">
                          📍 {match.locationId}
                        </span>
                      )}
                    </div>
                    <div className="text-white/80 text-sm">
                      📅 {formatDate(match.endTime)}
                    </div>
                    <div className="text-white/80 text-sm">
                      ⏱️ Durata: {formatDuration(match.duration)}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-white/60 text-xs mb-1">Team 1</div>
                      <div className="text-4xl font-black text-blue-400">
                        {match.finalScore?.team1 || 0}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white/40">-</div>
                    <div className="text-center">
                      <div className="text-white/60 text-xs mb-1">Team 2</div>
                      <div className="text-4xl font-black text-red-400">
                        {match.finalScore?.team2 || 0}
                      </div>
                    </div>
                  </div>

                  {/* Winner */}
                  <div className="text-center">
                    <div className="text-white/60 text-xs mb-2">Vincitore</div>
                    {getWinnerBadge(match.winner)}
                  </div>

                  {/* Stats */}
                  <div className="text-center">
                    <div className="text-white/60 text-xs mb-1">Dispositivi</div>
                    <div className="text-2xl font-bold text-white">
                      {match.pairedDevices?.length || 0}
                    </div>
                    <div className="text-white/60 text-xs mt-1">
                      {match.totalEvents || 0} eventi
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        {!loading && (
          <div className="mt-8 text-center">
            <button
              onClick={fetchMatches}
              className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl transition-all shadow-xl"
            >
              🔄 Aggiorna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
