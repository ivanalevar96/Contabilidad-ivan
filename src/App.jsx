import { useState } from 'react';
import TopBar from './components/TopBar';
import MesView from './components/MesView';
import AnnualView from './components/AnnualView';
import TarjetasAdmin from './components/TarjetasAdmin';
import { useFinanzas } from './store';
import { currentYM, yearOf } from './utils/format';

export default function App() {
  const f = useFinanzas();
  const [view, setView] = useState('mes');
  const [ym, setYM] = useState(currentYM());
  const [year, setYear] = useState(yearOf(currentYM()));

  return (
    <div className="min-h-screen">
      <TopBar view={view} setView={setView} ym={ym} setYM={setYM} year={year} setYear={setYear} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === 'mes'  && <MesView ym={ym} f={f} />}
        {view === 'anio' && <AnnualView year={year} f={f} onPickMonth={(m) => { setYM(m); setView('mes'); }} />}
        {view === 'conf' && <TarjetasAdmin f={f} />}
      </main>
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 text-center text-xs text-slate-500">
        Finanzas · datos locales en tu navegador · usa Exportar para respaldo
      </footer>
    </div>
  );
}
