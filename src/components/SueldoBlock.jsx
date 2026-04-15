import { useState } from 'react';
import { fmt, monthLabel } from '../utils/format';

export default function SueldoBlock({ ym, sueldoObj, resumen, setSueldo, addIngresoExtra, removeIngresoExtra }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(sueldoObj.sueldo || 0);
  const [extraDesc, setExtraDesc] = useState('');
  const [extraMonto, setExtraMonto] = useState('');

  const onSave = () => {
    setSueldo(ym, val);
    setEditing(false);
  };

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Ingresos · <span className="text-slate-400 font-normal">{monthLabel(ym)}</span></h2>
        {!editing && (
          <button className="btn-ghost" onClick={() => { setVal(sueldoObj.sueldo || 0); setEditing(true); }}>Editar sueldo</button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-3 bg-emerald-500/5 border-emerald-500/20">
          <div className="label">Sueldo base</div>
          {editing ? (
            <div className="mt-2 flex gap-2">
              <input type="number" value={val} onChange={(e) => setVal(Number(e.target.value) || 0)} className="input" />
              <button className="btn-primary" onClick={onSave}>Guardar</button>
            </div>
          ) : (
            <div className="mt-1 text-xl font-bold text-emerald-300">{fmt(sueldoObj.sueldo || 0)}</div>
          )}
        </div>

        <div className="card p-3">
          <div className="label">Ingresos extra</div>
          <div className="mt-1 text-xl font-bold">{fmt(resumen.ingresoExtra)}</div>
          <div className="mt-2 space-y-1 max-h-24 overflow-auto">
            {(sueldoObj.ingresosExtra || []).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs bg-slate-900/70 rounded px-2 py-1">
                <span className="truncate">{e.desc}</span>
                <span className="flex items-center gap-2">
                  <span className="text-emerald-300">{fmt(e.monto)}</span>
                  <button className="text-rose-400 hover:text-rose-300" onClick={() => removeIngresoExtra(ym, e.id)}>✕</button>
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!extraMonto) return;
            addIngresoExtra(ym, extraDesc || 'Ingreso extra', extraMonto);
            setExtraDesc(''); setExtraMonto('');
          }} className="mt-2 flex gap-1">
            <input value={extraDesc} onChange={(e) => setExtraDesc(e.target.value)} placeholder="Descripción" className="input" />
            <input type="number" value={extraMonto} onChange={(e) => setExtraMonto(e.target.value)} placeholder="$" className="input w-28" />
            <button className="btn-primary" type="submit">+</button>
          </form>
        </div>

        <div className="card p-3 bg-cyan-500/5 border-cyan-500/20">
          <div className="label">Total ingresos</div>
          <div className="mt-1 text-xl font-bold text-cyan-300">{fmt(resumen.ingresos)}</div>
          <div className="mt-1 text-xs text-slate-400">Base + extras de {monthLabel(ym)}</div>
        </div>
      </div>
    </section>
  );
}
