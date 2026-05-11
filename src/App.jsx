import { useState } from 'react';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import AuthGuard from './components/AuthGuard';
import TopBar from './components/TopBar';
import MesView from './components/MesView';
import AnnualView from './components/AnnualView';
import TarjetasAdmin from './components/TarjetasAdmin';
import { MesSkeleton } from './components/Skeleton';
import { useFinanzas } from './store';
import { currentYM, yearOf } from './utils/format';

export default function App() {
  const { user, signOut } = useAuth();
  const f = useFinanzas(user?.id);
  const [view, setView] = useState('mes');
  const [ym, setYM] = useState(currentYM());
  const [year, setYear] = useState(yearOf(currentYM()));

  return (
    <AuthGuard>
      <div className="min-h-screen">
        {f.syncError && (
          <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 text-center text-sm text-rose-300 flex items-center justify-center gap-3">
            <span>{f.syncError}</span>
            <button onClick={f.clearSyncError} className="text-rose-400 hover:text-white underline text-xs">Cerrar</button>
          </div>
        )}
        <TopBar
          view={view} setView={setView}
          ym={ym} setYM={setYM}
          year={year} setYear={setYear}
          user={user} onSignOut={signOut}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {f.loading ? (
            <MesSkeleton />
          ) : (
            <div key={view} className="animate-fadein">
              {view === 'mes'  && <MesView ym={ym} f={f} />}
              {view === 'anio' && <AnnualView year={year} f={f} onPickMonth={(m) => { setYM(m); setView('mes'); }} />}
              {view === 'conf' && <TarjetasAdmin f={f} />}
            </div>
          )}
        </main>
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 text-center text-xs text-slate-500">
          Finanzas · datos sincronizados en la nube · usa Exportar para respaldo
        </footer>
      </div>
      <Toaster position="bottom-right" theme="dark" richColors closeButton />
    </AuthGuard>
  );
}
