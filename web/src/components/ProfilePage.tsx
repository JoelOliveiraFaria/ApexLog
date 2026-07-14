import { useEffect, useState } from 'react';
import { CircleUserRound, RefreshCw, AlertTriangle, Bike, LogOut } from 'lucide-react';
import { getMyProfile, changeMyPassword, type UserProfile } from '../api/client';

interface ProfilePageProps {
  onNavigateToMotorcycles: () => void;
  onLogout: () => void;
}

export function ProfilePage({ onNavigateToMotorcycles, onLogout }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        setProfile(await getMyProfile());
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar o perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação não corresponde à nova password.');
      return;
    }

    setIsSaving(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setPasswordSuccess('Password alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Falha ao alterar a password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Perfil</h1>
        <p className="text-slate-400 mt-1">Os teus dados de conta.</p>
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={40} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">A carregar perfil...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4 text-red-400">
          <AlertTriangle size={32} />
          <div>
            <h3 className="font-bold text-white">Falha na Ligação</h3>
            <p className="text-sm text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && profile && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CircleUserRound size={28} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-white truncate">{profile.name}</p>
                <p className="text-sm text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Alterar password</h3>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Password atual"
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova password"
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova password"
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />

              {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-emerald-400">{passwordSuccess}</p>}

              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'A guardar...' : 'Guardar nova password'}
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Gerir motas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Adicionar, editar ou remover as tuas motas.</p>
            </div>
            <button
              onClick={onNavigateToMotorcycles}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Bike size={16} />
              <span>Ver motas</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}
