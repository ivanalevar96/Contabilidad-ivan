import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setInfo('Cuenta creada. Revisa tu email para confirmar, o inicia sesión si la confirmación está desactivada.');
        }
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            💰 Finanzas
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Control de gastos y cuotas personales
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-ink overflow-hidden mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setInfo(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-accent/20 text-accent'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setInfo(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-accent/20 text-accent'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input w-full"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm bg-rose-400/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {info && (
            <p className="text-accent text-sm bg-accent/10 rounded-lg px-3 py-2">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 disabled:opacity-50"
          >
            {submitting
              ? 'Cargando...'
              : mode === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
