import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TripCard } from './components/TripCard';
import { TripDetails } from './components/TripDetails'; // <-- Importa o novo componente
import { type Trip } from './types';
import { RefreshCw, AlertTriangle, Route } from 'lucide-react';

function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null); // <-- Estado de navegação

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://192.168.50.167:5084/api/trips');
      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
      const data = await response.json();
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível ligar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans antialiased m-0 p-0">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        
        {/* Se houver uma viagem selecionada, renderiza a Página de Detalhes com os Gráficos */}
        {selectedTripId ? (
          <TripDetails 
            tripId={selectedTripId} 
            onBack={() => setSelectedTripId(null)} 
          />
        ) : (
          /* Caso contrário, mostra a listagem padrão (o que já tínhamos) */
          <>
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">Bem-vindo ao teu centro de telemetria.</p>
              </div>
              
              <button 
                onClick={fetchTrips}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Atualizar</span>
              </button>
            </header>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw size={40} className="text-emerald-400 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">A carregar viagens do servidor...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 text-red-400 max-w-2xl mx-auto">
                <AlertTriangle size={32} />
                <div>
                  <h3 className="font-bold text-white">Falha na Ligação</h3>
                  <p className="text-sm text-red-300/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {trips.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-2xl max-w-xl mx-auto">
                    <Route size={48} className="text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">Nenhuma viagem encontrada</h3>
                    <p className="text-slate-400 text-sm mt-1">Insere pontos via API para começar.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map((trip) => (
                      <TripCard 
                        key={trip.id} 
                        trip={trip} 
                        onClick={() => setSelectedTripId(trip.id)} // <-- Passa a função de clique
                      />
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