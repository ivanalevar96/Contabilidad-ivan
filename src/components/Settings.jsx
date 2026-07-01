import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { IconCheck } from './icons';

const PROVIDER_LABEL = { email: 'Contraseña', google: 'Google' };

export default function Settings() {
  const { user, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const providers = (user?.identities ?? []).map((i) => i.provider);
  const hasPassword = providers.includes('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }
    toast.success(hasPassword ? 'Contraseña actualizada.' : 'Contraseña creada.');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-4">Cuenta</h2>

        <div className="mb-5">
          <div className="label mb-1">Correo</div>
          <div className="text-sm text-text-2">{user?.email}</div>
        </div>

        <div>
          <div className="label mb-2">Métodos de acceso conectados</div>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-accent-tint text-accent"
              >
                <IconCheck size={12} />
                {PROVIDER_LABEL[p] ?? p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold mb-1">
          {hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}
        </h2>
        <p className="text-[13px] text-text-2 mb-5">
          {hasPassword
            ? 'Define una nueva contraseña para tu cuenta.'
            : 'Actualmente solo inicias sesión con Google. Crea una contraseña para poder entrar también con tu correo.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-[340px]">
          <div>
            <div className="label mb-1.5">Nueva contraseña</div>
            <input
              type="password"
              className="input !h-[42px]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div>
            <div className="label mb-1.5">Confirmar contraseña</div>
            <input
              type="password"
              className="input !h-[42px]"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-negative text-sm rounded-[10px] px-3 py-2" style={{ background: 'color-mix(in srgb, var(--negative) 10%, transparent)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary !h-[42px] disabled:opacity-50">
            {submitting ? 'Guardando…' : hasPassword ? 'Actualizar contraseña' : 'Crear contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
