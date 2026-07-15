import { useCallback, useEffect, useState } from 'react';
import { Sidebar, type SidebarView } from './components/Sidebar';
import { TripCard } from './components/TripCard';
import { TripDetails } from './components/TripDetails';
import { MotorcyclesPage } from './components/MotorcyclesPage';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/ProfilePage';
import { type Trip, type Motorcycle } from './types';
import { RefreshCw, AlertTriangle, Route } from 'lucide-react';
import { apiFetch, clearToken, getToken, setUnauthorizedHandler, type AuthResponse } from './api/client';
import { applyTheme, getCurrentTheme, type Theme } from './theme';

interface CurrentUser {
  name: string;
  email: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [theme, setTheme] = useState<Theme>(getCurrentTheme);

  const [view, setView] = useState<SidebarView>('dashboard');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [motorcycleFilter, setMotorcycleFilter] = useState<string>('all');

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setCurrentUser(null);
    setTrips([]);
    setMotorcycles([]);
    setView('dashboard');
    setSelectedTripId(null);
  }, []);

  // Se já houver um token guardado (sessão anterior), tenta reidratar sem pedir login outra vez.
  // Um 401 aqui (token expirado/inválido) força o logout através do handler registado abaixo.
  useEffect(() => {
    setUnauthorizedHandler(handleLogout);

    const token = getToken();
    if (!token) {
      setIsAuthChecked(true);
      return;
    }

    // Não há um endpoint "/me" — mostramos um nome genérico até o utilizador voltar a entrar;
    // qualquer chamada à API valida o token na mesma.
    setCurrentUser({ name: 'Utilizador', email: '' });
    setIsAuthChecked(true);
  }, [handleLogout]);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/trips');
      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
      const data = await response.json();
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível ligar ao servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMotorcycles = useCallback(async () => {
    try {
      const response = await apiFetch('/api/motorcycles');
      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
      setMotorcycles(await response.json());
    } catch {
      // O filtro de motas é um extra do dashboard — uma falha aqui não deve impedir ver as viagens.
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchTrips();
    fetchMotorcycles();
  }, [currentUser, fetchTrips, fetchMotorcycles]);

  const handleAuthenticated = (auth: AuthResponse) => {
    setCurrentUser({ name: auth.name, email: auth.email });
  };

  const visibleTrips =
    motorcycleFilter === 'all' ? trips : trips.filter((trip) => trip.motorcycle.id === motorcycleFilter);

  if (!isAuthChecked) {
    return null;
  }

  if (!currentUser) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 font-sans antialiased m-0 p-0">
      <Sidebar
        activeView={view}
        onNavigate={(nextView) => {
          setView(nextView);
          setSelectedTripId(null);
        }}
        userName={currentUser.name}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 ml-64 p-8">
        {view === 'profile' ? (
          <ProfilePage onNavigateToMotorcycles={() => setView('motorcycles')} onLogout={handleLogout} />
        ) : view === 'motorcycles' ? (
          <MotorcyclesPage />
        ) : selectedTripId ? (
          <TripDetails tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />
        ) : (
          <>
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Bem-vindo ao teu centro de telemetria.</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={motorcycleFilter}
                  onChange={(e) => setMotorcycleFilter(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-xl px-4 py-2 cursor-pointer focus:outline-none"
                >
                  <option value="all">Todas as motas</option>
                  {motorcycles.map((motorcycle) => (
                    <option key={motorcycle.id} value={motorcycle.id}>
                      {motorcycle.nickname || `${motorcycle.make} ${motorcycle.model}`}
                    </option>
                  ))}
                </select>

                <button
                  onClick={fetchTrips}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-100 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span>Atualizar</span>
                </button>
              </div>
            </header>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw size={40} className="text-emerald-400 animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">A carregar viagens do servidor...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 text-red-600 dark:text-red-400 max-w-2xl mx-auto">
                <AlertTriangle size={32} />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Falha na Ligação</h3>
                  <p className="text-sm text-red-600/80 dark:text-red-300/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {visibleTrips.length === 0 ? (
                  <div className="text-center py-20 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-2xl max-w-xl mx-auto">
                    <Route size={48} className="text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhuma viagem encontrada</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      {motorcycleFilter === 'all'
                        ? 'Insere pontos via API para começar.'
                        : 'Esta mota ainda não tem viagens registadas.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} onClick={() => setSelectedTripId(trip.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
