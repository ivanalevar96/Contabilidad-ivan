import { addMonths, monthLabel } from '../utils/format';

export default function TopBar({ view, setView, ym, setYM, year, setYear, user, onSignOut }) {
  return (
    <header className="sticky top-0 z-20 bg-ink/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-accent/20 grid place-items-center text-accent font-bold">$</div>
          <div>
            <div className="text-sm font-semibold">Finanzas</div>
            <div className="text-xs text-slate-400">Control mensual & anual</div>
          </div>
        </div>

        <nav className="ml-0 sm:ml-6 flex items-center gap-1 rounded-lg bg-slate-900/60 p-1 border border-slate-800">
          {[
            { k: 'mes',  label: 'Mes'  },
            { k: 'anio', label: 'Anual' },
            { k: 'conf', label: 'Tarjetas' },
          ].map((t) => (
            <button key={t.k}
              onClick={() => setView(t.k)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${view === t.k ? 'bg-accent text-slate-900' : 'text-slate-300 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {view === 'mes' && (
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={() => setYM(addMonths(ym, -1))} aria-label="Mes anterior">←</button>
            <input
              type="month"
              value={ym}
              onChange={(e) => setYM(e.target.value)}
              className="input w-[11rem]"
            />
            <button className="btn-ghost" onClick={() => setYM(addMonths(ym, 1))} aria-label="Mes siguiente">→</button>
            <div className="hidden sm:block text-sm text-slate-400 ml-2">{monthLabel(ym)}</div>
          </div>
        )}

        {view === 'anio' && (
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={() => setYear(year - 1)}>←</button>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || year)}
              className="input w-24 text-center" />
            <button className="btn-ghost" onClick={() => setYear(year + 1)}>→</button>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[150px]">{user.email}</span>
            <button onClick={onSignOut} className="btn-ghost text-xs" title="Cerrar sesión">Salir</button>
          </div>
        )}
      </div>
    </header>
  );
}
