import { useAuth } from '../context/AuthContext';
import AuthPage from './AuthPage';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-3 text-sm">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return children;
}
