import { useEffect, useState } from 'react';
import { type Motorcycle } from '../types';
import { RefreshCw, AlertTriangle, Bike, Pencil, Trash2, Plus, X } from 'lucide-react';

const API_BASE_URL = 'http://192.168.50.167:5084';

interface MotorcycleFormValues {
  make: string;
  model: string;
  year: string;
  nickname: string;
}

const emptyForm: MotorcycleFormValues = { make: '', model: '', year: '', nickname: '' };

export function MotorcyclesPage() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MotorcycleFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMotorcycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/motorcycles`);
      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
      const data = await response.json();
      setMotorcycles(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível ligar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorcycles();
  }, []);

  const startAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const startEditing = (motorcycle: Motorcycle) => {
    setEditingId(motorcycle.id);
    setIsAdding(false);
    setForm({
      make: motorcycle.make,
      model: motorcycle.model,
      year: String(motorcycle.year),
      nickname: motorcycle.nickname,
    });
    setFormError(null);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    const parsedYear = parseInt(form.year, 10);

    if (!form.make.trim() || !form.model.trim()) {
      setFormError('Marca e modelo são obrigatórios.');
      return;
    }
    if (!Number.isFinite(parsedYear)) {
      setFormError('Indica um ano válido.');
      return;
    }

    const payload = {
      make: form.make.trim(),
      model: form.model.trim(),
      year: parsedYear,
      nickname: form.nickname.trim() || `${form.make.trim()} ${form.model.trim()}`,
    };

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        const response = await fetch(`${API_BASE_URL}/api/motorcycles/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
        const updated = await response.json();
        setMotorcycles((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      } else {
        const response = await fetch(`${API_BASE_URL}/api/motorcycles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
        const created = await response.json();
        setMotorcycles((prev) => [...prev, created]);
      }
      cancelForm();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao gravar a mota.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar esta mota? Só é possível se não tiver viagens associadas.')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/motorcycles/${id}`, { method: 'DELETE' });
      if (response.status === 409) {
        const body = await response.json().catch(() => null);
        alert(body?.error || 'Não é possível apagar uma mota com viagens associadas.');
        return;
      }
      if (!response.ok && response.status !== 204) throw new Error(`Erro na API: ${response.status}`);
      setMotorcycles((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Falha ao apagar a mota.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Motas</h1>
          <p className="text-slate-400 mt-1">Gere as motas associadas às tuas viagens.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMotorcycles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={startAdding}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Adicionar mota</span>
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={40} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">A carregar motas do servidor...</p>
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
        <div className="space-y-6">
          {(isAdding || editingId) && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{editingId ? 'Editar mota' : 'Nova mota'}</h3>
                <button onClick={cancelForm} className="text-slate-500 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.make}
                  onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                  placeholder="Marca (ex: CFMOTO)"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder="Modelo (ex: 450SR)"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  placeholder="Ano (ex: 2024)"
                  inputMode="numeric"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  value={form.nickname}
                  onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                  placeholder="Alcunha (opcional)"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {formError && <p className="text-red-400 text-sm mt-3">{formError}</p>}

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={cancelForm}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 min-w-[100px]"
                >
                  {isSaving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}

          {motorcycles.length === 0 && !isAdding ? (
            <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-2xl max-w-xl mx-auto">
              <Bike size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">Nenhuma mota registada</h3>
              <p className="text-slate-400 text-sm mt-1">Adiciona a tua primeira mota para começar a gravar viagens.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {motorcycles.map((motorcycle) => (
                <div
                  key={motorcycle.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Bike size={18} />
                      <span className="font-bold text-white">
                        {motorcycle.nickname || `${motorcycle.make} ${motorcycle.model}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditing(motorcycle)}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(motorcycle.id)}
                        disabled={deletingId === motorcycle.id}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        aria-label="Apagar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">{motorcycle.make} {motorcycle.model}</p>
                  <p className="text-xs text-slate-500 mt-1">Ano {motorcycle.year}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
