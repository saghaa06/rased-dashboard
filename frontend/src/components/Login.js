import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Identifiants incorrects ou serveur indisponible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0a2b3e] via-[#14365a] to-[#0b2236] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-slate-200/60 shadow-[0_20px_60px_rgba(15,23,42,0.18)] p-6 sm:p-7">
          {/* Logo + Title */}
          <div className="flex flex-col items-center text-center gap-3">
            {(() => {
              try {
                // eslint-disable-next-line global-require
                const logo = require('../assets/logo.svg');
                return <img className="w-16 h-16 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]" src={logo} alt="RASED" />;
              } catch (e) {
                return (
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white/80 flex items-center justify-center text-slate-500 text-sm">
                    LOGO
                  </div>
                );
              }
            })()}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2b3e] leading-tight">
                RASED Manager
              </h2>
              <p className="mt-1 text-sm sm:text-[15px] text-slate-600">Connexion sécurisée</p>
            </div>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                required
                autoComplete="username"
                disabled={submitting}
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white outline-none transition focus:border-[#0a2b3e] focus:shadow-[0_0_0_4px_rgba(14,165,233,0.15)] disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                autoComplete="current-password"
                disabled={submitting}
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white outline-none transition focus:border-[#0a2b3e] focus:shadow-[0_0_0_4px_rgba(14,165,233,0.15)] disabled:opacity-60"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm font-semibold animate-[fadeIn_160ms_ease-out]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#0a2b3e] text-white font-extrabold tracking-wide transition transform hover:-translate-y-[1px] hover:bg-[#0d3551] disabled:opacity-70 disabled:transform-none"
              disabled={submitting}
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            {process.env.REACT_APP_API_BASE ? 'API connectée' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
