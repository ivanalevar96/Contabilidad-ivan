import { fmt } from '../utils/format';

export default function TarjetaBloque({ bloque, ym, toggleRevisado, removeCompra, removePagoPuntual }) {
  const { tarjeta, items, total } = bloque;
  const color = tarjeta.color || '#64748b';

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800"
           style={{ background: `linear-gradient(90deg, ${color}33, transparent)` }}>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: color }} />
          <h3 className="font-semibold">{tarjeta.nombre}</h3>
          {tarjeta.tipo === 'persona' && <span className="chip bg-slate-800 text-slate-300">persona</span>}
        </div>
        <div className="text-sm">
          <span className="text-slate-400 mr-2">Total a pagar</span>
          <span className="font-bold text-white">{fmt(total)}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-4 text-sm text-slate-400">Sin cuotas para este mes.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-slate-900/60">
                <th className="th">Descripción</th>
                <th className="th text-right">V. compra</th>
                <th className="th text-right">V. +interés</th>
                <th className="th text-center">Cuotas</th>
                <th className="th text-center"># Cuota</th>
                <th className="th text-right">V. cuota</th>
                <th className="th text-center">Rev.</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                if (it.puntual) {
                  return (
                    <tr key={'p-' + it.puntual.id} className="hover:bg-slate-900/40">
                      <td className="td">
                        <span className="chip bg-amber-500/20 text-amber-300 mr-2">puntual</span>
                        {it.puntual.descripcion}
                      </td>
                      <td className="td text-right text-slate-400">—</td>
                      <td className="td text-right text-slate-400">—</td>
                      <td className="td text-center text-slate-400">—</td>
                      <td className="td text-center">1/1</td>
                      <td className="td text-right font-semibold">{fmt(it.valorCuota)}</td>
                      <td className="td text-center text-slate-400">—</td>
                      <td className="td text-right">
                        <button className="text-rose-400 hover:text-rose-300" onClick={() => removePagoPuntual(it.puntual.id)}>✕</button>
                      </td>
                    </tr>
                  );
                }
                const c = it.compra;
                const isRev = !!c.revisado?.[ym];
                return (
                  <tr key={c.id + idx} className="hover:bg-slate-900/40">
                    <td className="td">
                      <div className="font-medium text-slate-100">{c.descripcion}</div>
                      {c.esCompartida && (
                        <div className="text-xs text-slate-400">
                          <span className="chip bg-cyan-500/20 text-cyan-300 mr-1">compartida</span>
                          {c.divididaEntre}{c.valorPorPersona ? ` · ${fmt(c.valorPorPersona)} c/u` : ''}
                        </div>
                      )}
                    </td>
                    <td className="td text-right">{fmt(c.valorCompra)}</td>
                    <td className="td text-right">{fmt(c.valorConInteres)}</td>
                    <td className="td text-center">{c.cantCuotas}</td>
                    <td className="td text-center">
                      <span className="chip bg-slate-800 text-slate-200">{it.numCuota}/{c.cantCuotas}</span>
                    </td>
                    <td className="td text-right font-semibold">{fmt(it.valorCuota)}</td>
                    <td className="td text-center">
                      <button onClick={() => toggleRevisado(c.id, ym)}
                        className={`h-5 w-5 rounded border ${isRev ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-slate-600'} transition`}
                        aria-label="Revisado">
                        {isRev && <span className="block text-slate-900 text-xs leading-none">✓</span>}
                      </button>
                    </td>
                    <td className="td text-right">
                      <button className="text-rose-400 hover:text-rose-300" onClick={() => removeCompra(c.id)} title="Eliminar compra de todos los meses">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
