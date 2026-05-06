import { fmt, monthLabel } from '../utils/format';

const YM_RX = /^\d{4}-(0[1-9]|1[0-2])$/;

export default function TarjetaBloque({ bloque, ym, toggleRevisado, removeCompra, removePagoPuntual, onEditCompra, updateCompra }) {
  const { tarjeta, items, total } = bloque;
  const color = tarjeta.color || '#64748b';

  const confirmRemoveCompra = (c) => {
    const tipo = c.esSubscripcion ? 'la subscripción' : 'la compra';
    const detalle = c.esSubscripcion
      ? `Monto mensual: ${fmt(c.valorCuota)}`
      : `Monto: ${fmt(c.valorConInteres || c.valorCompra)}\nCuotas: ${c.cantCuotas}`;
    const msg = `Eliminar ${tipo} "${c.descripcion}"?\n\n${detalle}\n\nEsta acción borra el registro de TODOS los meses donde aparece y no se puede deshacer.\n\n${c.esSubscripcion ? 'Si solo quieres dejar de pagarla a partir de un mes, mejor "Desactivar" — conserva el historial.' : ''}`;
    if (confirm(msg)) removeCompra(c.id);
  };

  const confirmRemovePuntual = (p) => {
    if (confirm(`Eliminar el pago puntual "${p.descripcion}" por ${fmt(p.monto)}?`)) {
      removePagoPuntual(p.id);
    }
  };

  const desactivarSub = (c) => {
    const periodos = Array.isArray(c.periodos) ? c.periodos : [];
    const idxAbierto = periodos.findIndex((p) => !p.fin);
    if (idxAbierto < 0) { alert('No hay ciclo activo para desactivar.'); return; }
    const ans = prompt(
      `Desactivar "${c.descripcion}".\n\nIngresa el último mes en que aparecerá (formato YYYY-MM).\nMeses anteriores y otros ciclos quedan intactos.`,
      ym
    );
    if (ans == null) return;
    const v = ans.trim();
    if (!YM_RX.test(v)) { alert('Formato inválido. Usa YYYY-MM, ej. 2026-05.'); return; }
    const inicioAbierto = periodos[idxAbierto].inicio;
    if (v < inicioAbierto) {
      alert(`El mes de cierre (${v}) no puede ser anterior al inicio del ciclo (${inicioAbierto}).`);
      return;
    }
    const nuevos = periodos.map((p, i) => i === idxAbierto ? { ...p, fin: v } : p);
    updateCompra?.(c.id, { periodos: nuevos });
  };

  const reactivarSub = (c) => {
    const periodos = Array.isArray(c.periodos) ? c.periodos : [];
    const ultimoFin = periodos.length ? periodos[periodos.length - 1].fin : null;
    const ans = prompt(
      `Reactivar "${c.descripcion}".\n\nIngresa el mes desde el que vuelve a estar activa (formato YYYY-MM).\nDebe ser posterior al último ciclo cerrado${ultimoFin ? ` (${ultimoFin})` : ''}.`,
      ym
    );
    if (ans == null) return;
    const v = ans.trim();
    if (!YM_RX.test(v)) { alert('Formato inválido. Usa YYYY-MM, ej. 2026-04.'); return; }
    if (ultimoFin && v <= ultimoFin) {
      alert(`El nuevo ciclo (${v}) debe comenzar después del último cierre (${ultimoFin}).`);
      return;
    }
    const nuevos = [...periodos, { inicio: v, fin: null }];
    updateCompra?.(c.id, { periodos: nuevos });
  };

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
                        <button className="text-rose-400 hover:text-rose-300" onClick={() => confirmRemovePuntual(it.puntual)} title="Eliminar pago puntual">✕</button>
                      </td>
                    </tr>
                  );
                }
                const c = it.compra;
                const isRev = !!c.revisado?.[ym];
                const isSub = !!c.esSubscripcion;
                const periodos = Array.isArray(c.periodos) ? c.periodos : [];
                const cicloActivoAbierto = periodos.some((p) => !p.fin);
                const periodoEnCurso = it.periodo; // del cuotaDelMes
                const cicloIdx = periodoEnCurso ? periodos.findIndex((p) => p.inicio === periodoEnCurso.inicio && p.fin === periodoEnCurso.fin) : -1;
                return (
                  <tr key={c.id + idx} className="hover:bg-slate-900/40">
                    <td className="td">
                      <div className="font-medium text-slate-100 flex items-center gap-2 flex-wrap">
                        {isSub && <span className="chip bg-violet-500/20 text-violet-300">🔄 subscripción</span>}
                        {isSub && periodos.length > 1 && cicloIdx >= 0 && (
                          <span className="chip bg-slate-700 text-slate-300">ciclo {cicloIdx + 1}/{periodos.length}</span>
                        )}
                        {isSub && periodoEnCurso?.fin && (
                          <span className="chip bg-amber-500/20 text-amber-300">termina {monthLabel(periodoEnCurso.fin)}</span>
                        )}
                        <span>{c.descripcion}</span>
                      </div>
                      {c.esCompartida && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          <span className="chip bg-cyan-500/20 text-cyan-300 mr-1">compartida</span>
                          {c.divididaEntre}{c.valorPorPersona ? ` · ${fmt(c.valorPorPersona)} c/u` : ''}
                        </div>
                      )}
                    </td>
                    <td className="td text-right">{isSub ? <span className="text-slate-500">—</span> : fmt(c.valorCompra)}</td>
                    <td className="td text-right">{isSub ? <span className="text-slate-500">—</span> : fmt(c.valorConInteres)}</td>
                    <td className="td text-center">{isSub ? <span className="text-slate-500">∞</span> : c.cantCuotas}</td>
                    <td className="td text-center">
                      {isSub
                        ? <span className="chip bg-violet-500/15 text-violet-300">mes #{it.numCuota}</span>
                        : <span className="chip bg-slate-800 text-slate-200">{it.numCuota}/{c.cantCuotas}</span>}
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
                      <div className="flex items-center justify-end gap-2">
                        {isSub && updateCompra && (
                          cicloActivoAbierto
                            ? <button className="text-amber-400 hover:text-amber-300 transition-colors" onClick={() => desactivarSub(c)} title="Desactivar subscripción a partir de un mes">⏸</button>
                            : <button className="text-emerald-400 hover:text-emerald-300 transition-colors" onClick={() => reactivarSub(c)} title="Reactivar subscripción en un nuevo ciclo">⟳</button>
                        )}
                        {onEditCompra && (
                          <button
                            className="text-slate-400 hover:text-cyan-300 transition-colors"
                            onClick={() => onEditCompra(c)}
                            title={isSub ? 'Editar subscripción' : 'Editar compra'}
                          >✎</button>
                        )}
                        <button
                          className="text-rose-400 hover:text-rose-300"
                          onClick={() => confirmRemoveCompra(c)}
                          title={isSub ? 'Eliminar subscripción de TODOS los meses' : 'Eliminar compra de todos los meses'}
                        >✕</button>
                      </div>
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
