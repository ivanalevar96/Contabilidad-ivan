import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendLogo, IconArrowRight, IconGoogle } from './icons';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setInfo('');
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center px-8 bg-bg text-text">
      <div className="w-full max-w-[392px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-accent grid place-items-center text-white">
            <TrendLogo size={20} />
          </div>
          <div>
            <div className="font-semibold text-base tracking-[-0.01em]">Balance</div>
            <div className="text-xs text-text-3">Gestión financiera personal</div>
          </div>
        </div>

        <div className="card p-[30px]">
          <h1 className="text-xl font-semibold tracking-[-0.02em] mb-1">
            {mode === 'login' ? 'Ingresa a tu cuenta' : 'Crea tu cuenta'}
          </h1>
          <p className="text-[13.5px] text-text-2 mb-6">Tus datos se sincronizan de forma segura en la nube.</p>

          {/* Tabs login/registro */}
          <div className="inline-flex gap-[3px] bg-surface-2 border border-border rounded-[10px] p-1 mb-5 w-full">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setInfo(''); }}
              className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${mode === 'login' ? 'bg-surface text-text shadow-card' : 'text-text-2'}`}
            >Iniciar sesión</button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setInfo(''); }}
              className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${mode === 'register' ? 'bg-surface text-text shadow-card' : 'text-text-2'}`}
            >Registrarse</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="label mb-1.5">Correo</div>
              <input
                type="email"
                className="input !h-[42px]"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="label mb-1.5">Contraseña</div>
              <input
                type="password"
                className="input !h-[42px]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="text-negative text-sm rounded-[10px] px-3 py-2" style={{ background: 'color-mix(in srgb, var(--negative) 10%, transparent)' }}>
                {error}
              </p>
            )}
            {info && (
              <p className="text-accent text-sm rounded-[10px] px-3 py-2" style={{ background: 'var(--accent-tint)' }}>
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full !h-[44px] disabled:opacity-50"
            >
              {submitting ? 'Cargando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
              {!submitting && <IconArrowRight size={17} />}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-text-3">o continúa con</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting || googleLoading}
            className="btn-ghost w-full !h-[44px] gap-2.5 disabled:opacity-50"
          >
            <IconGoogle size={17} />
            {googleLoading ? 'Redirigiendo…' : 'Continuar con Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
