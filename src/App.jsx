import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Toaster, toast } from 'sonner';
import { useAuth } from './context/AuthContext';
import AuthGuard from './components/AuthGuard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { MesSkeleton } from './components/Skeleton';
import { useFinanzas } from './store';
import { currentYM, yearOf } from './utils/format';

const MesView = lazy(() => import('./components/MesView'));
const AnnualView = lazy(() => import('./components/AnnualView'));
const TarjetasAdmin = lazy(() => import('./components/TarjetasAdmin'));
const Settings = lazy(() => import('./components/Settings'));

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggle };
}

export default function App() {
  const { user, signOut, passwordRecovery, clearPasswordRecovery } = useAuth();
  const f = useFinanzas(user?.id);
  const { theme, toggle } = useTheme();
  const [view, setView] = useState('mes');
  const [ym, setYM] = useState(currentYM());
  const [year, setYear] = useState(yearOf(currentYM()));
  const [mesTab, setMesTab] = useState('resumen');
  const [registerSignal, setRegisterSignal] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navegar cierra el drawer en móvil.
  const navigate = useCallback((v) => { setView(v); setSidebarOpen(false); }, []);

  const onRegister = useCallback(() => {
    setView('mes');
    setMesTab('gastos');
    setRegisterSignal((s) => s + 1);
  }, []);

  useEffect(() => {
    if (!user || (user.identities?.length ?? 0) < 2) return;
    const key = `linked-notice-${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    toast.success('Tu cuenta de Google fue vinculada a tu cuenta existente.');
  }, [user]);

  useEffect(() => {
    if (!passwordRecovery) return;
    setView('settings');
    setSidebarOpen(false);
    toast.info('Ingresa tu nueva contraseña abajo para completar la recuperación.');
    clearPasswordRecovery();
  }, [passwordRecovery, clearPasswordRecovery]);

  const maxW = view === 'conf' || view === 'settings' ? 'max-w-[760px]' : 'max-w-[1080px]';

  return (
    <AuthGuard theme={theme}>
      <div className="h-screen flex bg-bg text-text">
        <Sidebar
          view={view} setView={navigate}
          theme={theme} toggleTheme={toggle}
          user={user} onSignOut={signOut}
          onOpenSettings={() => navigate('settings')}
          open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {f.syncError && (
            <div className="bg-[color-mix(in_srgb,var(--negative)_15%,transparent)] border-b border-border px-4 py-2 text-center text-sm text-negative flex items-center justify-center gap-3">
              <span>{f.syncError}</span>
              <button onClick={f.clearSyncError} className="underline text-xs hover:opacity-80">Cerrar</button>
            </div>
          )}

          <Header
            view={view}
            ym={ym} setYM={setYM}
            year={year} setYear={setYear}
            onRegister={onRegister}
            onMenu={() => setSidebarOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-7">
            <div className={`${maxW} mx-auto`}>
              {f.loading ? (
                <MesSkeleton />
              ) : (
                <Suspense fallback={<MesSkeleton />}>
                  <div key={view} className="animate-fadein">
                    {view === 'mes'  && <MesView ym={ym} f={f} tab={mesTab} setTab={setMesTab} registerSignal={registerSignal} />}
                    {view === 'anio' && <AnnualView year={year} f={f} onPickMonth={(m) => { setYM(m); setView('mes'); }} />}
                    {view === 'conf' && <TarjetasAdmin f={f} />}
                    {view === 'settings' && <Settings />}
                  </div>
                </Suspense>
              )}
            </div>
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" theme={theme} richColors closeButton />
    </AuthGuard>
  );
}
