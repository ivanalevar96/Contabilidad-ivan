import { useState } from 'react';
import { fmt, monthLabel } from '../utils/format';
import ConfirmModal from './ConfirmModal';
import PromptModal from './PromptModal';

export default function TarjetaBloque({ bloque, ym, toggleRevisado, removeCompra, removePagoPuntual, onEditCompra, updateCompra }) {
  const { tarjeta, items, total } = bloque;
  const color = tarjeta.color || '#64748b';
  const [collapsed, setCollapsed] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [subPrompt, setSubPrompt] = useState(null);

  const openRemoveCompra = (c) => {
    const tipo = c.esSubscripcion ? 'subscripción' : 'compra';
    const detalle = c.esSubscripcion
      ? `Monto mensual: ${fmt(c.valorCuota)}`
      : `Monto: ${fmt(c.valorConInteres || c.valorCompra)} · Cuotas: ${c.cantCuotas}`;
    setConfirmDialog({
      title: `Eliminar ${tipo}`,
      message: `"${c.descripcion}"\n${detalle}\n\nSe borrará de TODOS los meses y no se puede deshacer.${c.esSubscripcion ? '\n\nSi solo quieres pausarla a partir de un mes, usa "Desactivar".' : ''}`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: () => removeCompra(c.id),
    });
  };

  const openRemovePuntual = (p) => {
    setConfirmDialog({
      title: 'Eliminar pago puntual',
      message: `"${p.descripcion}" · ${fmt(p.monto)}`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: () => removePagoPuntual(p.id),
    });
  };

  const openDesactivar = (c) => {
    const periodos = Array.isArray(c.periodos) ? c.periodos : [];
    const idxAbierto = periodos.findIndex((p) => !p.fin);
    if (idxAbierto < 0) {
      setConfirmDialog({ title: 'Sin ciclo activo', message: 'No hay ciclo activo para desactivar.', hideCancel: true });
      return;
    }
    const inicioAbierto = periodos[idxAbierto].inicio;
    setSubPrompt({
      title: `Desactivar "${c.descripcion}"`,
      description: `Ingresa el último mes en que aparecerá (formato YYYY-MM).\nMeses anteriores y otros ciclos quedan intactos.`,
      defaultValue: ym,
      validate: (v) => v < inicioAbierto
        ? `El mes de cierre (${v}) no puede ser anterior al inicio del ciclo (${inicioAbierto}).`
        : null,
      onConfirm: (v) => {
        const nuevos = periodos.map((p, i) => i === idxAbierto ? { ...p, fin: v } : p);
        updateCompra?.(c.id, { periodos: nuevos });
      },
    });
  };

  const openReactivar = (c) => {
    const periodos = Array.isArray(c.periodos) ? c.periodos : [];
    const ultimoFin = periodos.length ? periodos[periodos.length - 1].fin : null;
    setSubPrompt({
      title: `Reactivar "${c.descripcion}"`,
      description: `Ingresa el mes desde el que vuelve a estar activa (formato YYYY-MM).\nDebe ser posterior al último ciclo cerrado${ultimoFin ? ` (${ultimoFin})` : ''}.`,
      defaultValue: ym,
      validate: (v) => ultimoFin && v <= ultimoFin
        ? `El nuevo ciclo (${v}) debe comenzar después del último cierre (${ultimoFin}).`
        : null,
      onConfirm: (v) => {
        const nuevos = [...periodos, { inicio: v, fin: null }];
        updateCompra?.(c.id, { periodos: nuevos });
      },
    });
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between border-b border-slate-800 cursor-pointer select-none"
        style={{ background: `linear-gradient(90deg, ${color}33, transparent)` }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: color }} />
          <h3 className="font-semibold">{tarjeta.nombre}</h3>
          {tarjeta.tipo === 'persona' && <span className="chip bg-slate-800 text-slate-300">persona</span>}
          <span className="text-xs text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="text-slate-400 mr-2">Total</span>
            <span className="font-bold text-white">{fmt(total)}</span>
          </div>
          <span className="text-slate-400 text-xs transition-transform duration-200" style={{ display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 280ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
      <div className="min-h-0 overflow-hidden">
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
                        <button className="text-rose-400 hover:text-rose-300" onClick={() => openRemovePuntual(it.puntual)} title="Eliminar pago puntual">✕</button>
                      </td>
                    </tr>
                  );
                }
                const c = it.compra;
                const isRev = !!c.revisado?.[ym];
                const isSub = !!c.esSubscripcion;
                const periodos = Array.isArray(c.periodos) ? c.periodos : [];
                const cicloActivoAbierto = periodos.some((p) => !p.fin);
                const periodoEnCurso = it.periodo;
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
                    <td className="td text-right font-semibold">{fmt(it.miParte ?? it.valorCuota)}</td>
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
                            ? <button className="text-amber-400 hover:text-amber-300 transition-colors" onClick={() => openDesactivar(c)} title="Desactivar subscripción">⏸</button>
                            : <button className="text-emerald-400 hover:text-emerald-300 transition-colors" onClick={() => openReactivar(c)} title="Reactivar subscripción">⟳</button>
                        )}
                        {onEditCompra && (
                          <button
                            className="text-slate-400 hover:text-cyan-300 transition-colors"
                            onClick={() => onEditCompra(c)}
                            title={isSub ? 'Editar subscripción' : 'Editar compra'}
                          >✎</button>
                        )}
                        <button
                          className="text-rose-400 hover:text-rose-300 transition-colors"
                          onClick={() => openRemoveCompra(c)}
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
      </div>

      <ConfirmModal
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        hideCancel={confirmDialog?.hideCancel}
        onConfirm={confirmDialog?.onConfirm}
      />
      <PromptModal
        open={!!subPrompt}
        onClose={() => setSubPrompt(null)}
        title={subPrompt?.title}
        description={subPrompt?.description}
        defaultValue={subPrompt?.defaultValue ?? ym}
        validate={subPrompt?.validate}
        onConfirm={subPrompt?.onConfirm}
      />
    </div>
  );
}
