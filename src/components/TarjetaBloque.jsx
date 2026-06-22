import { useState } from 'react';
import { fmt, monthLabel } from '../utils/format';
import ConfirmModal from './ConfirmModal';
import PromptModal from './PromptModal';
import Modal from './Modal';
import { IconPencil, IconPause, IconRefresh, IconStop, IconTrash, IconCheck } from './icons';

/* ── Card de tarjeta (padre) ──────────────────────────── */
export default function TarjetaBloque({ bloque, ym, toggleRevisado, removeCompra, removePagoPuntual, onEditCompra, updateCompra }) {
  const { tarjeta, items, total } = bloque;
  const color = tarjeta.color || '#64748b';
  const [open, setOpen] = useState(false);
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
      validate: (v) => v < inicioAbierto ? `El mes de cierre (${v}) no puede ser anterior al inicio del ciclo (${inicioAbierto}).` : null,
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
      validate: (v) => ultimoFin && v <= ultimoFin ? `El nuevo ciclo (${v}) debe comenzar después del último cierre (${ultimoFin}).` : null,
      onConfirm: (v) => {
        const nuevos = [...periodos, { inicio: v, fin: null }];
        updateCompra?.(c.id, { periodos: nuevos });
      },
    });
  };

  const openFinalizar = (c) => {
    setSubPrompt({
      title: `Finalizar "${c.descripcion}"`,
      description: `Ingresa el último mes en que aparecerá la cuota (formato YYYY-MM).\nÚtil si prepagaste el crédito: las cuotas posteriores dejan de mostrarse.\nEl total de cuotas (${c.cantCuotas}) se conserva como referencia.`,
      defaultValue: ym,
      validate: (v) => v < c.mesInicio ? `El mes de corte (${v}) no puede ser anterior al inicio (${c.mesInicio}).` : null,
      onConfirm: (v) => updateCompra?.(c.id, { mesFinAnticipado: v }),
    });
  };

  const openReanudar = (c) => {
    setConfirmDialog({
      title: `Reanudar "${c.descripcion}"`,
      message: `Se volverán a mostrar todas las cuotas hasta la ${c.cantCuotas}.`,
      confirmLabel: 'Reanudar',
      onConfirm: () => updateCompra?.(c.id, { mesFinAnticipado: null }),
    });
  };

  const revisadosCount = items.filter((it) => it.compra && !!it.compra.revisado?.[ym]).length;
  const comprasCount = items.filter((it) => it.compra).length;

  return (
    <>
      {/* Card clickeable */}
      <button
        onClick={() => setOpen(true)}
        className="card text-left p-0 overflow-hidden hover:shadow-md hover:border-accent/40 transition-all duration-150 active:scale-[0.99] group w-full"
      >
        {/* Barra de color */}
        <div className="h-[4px] w-full" style={{ background: color }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[15px]">{tarjeta.nombre}</span>
              {tarjeta.tipo === 'persona' && (
                <span className="chip bg-surface-3 text-text-2">persona</span>
              )}
            </div>
            <span className="text-xs text-text-3 flex-shrink-0">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Total */}
          <div className="num text-[28px] font-semibold tracking-[-0.02em] text-text mb-4">
            {fmt(total)}
          </div>

          {/* Preview de los primeros 3 items */}
          <div className="space-y-2">
            {items.slice(0, 3).map((it, idx) => {
              const isPuntual = !!it.puntual;
              const desc = isPuntual ? it.puntual.descripcion : it.compra.descripcion;
              const monto = it.miParte ?? it.valorCuota;
              const isSub = !isPuntual && !!it.compra?.esSubscripcion;
              return (
                <div key={idx} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="text-text-2 truncate flex-1">{desc}</span>
                  <span className="num text-text-3 flex-shrink-0">
                    {isSub ? '∞' : isPuntual ? '—' : `${it.numCuota}/${it.compra.cantCuotas}`}
                  </span>
                  <span className="num font-semibold text-text flex-shrink-0">{fmt(monto)}</span>
                </div>
              );
            })}
            {items.length > 3 && (
              <div className="text-[12px] text-text-3">+{items.length - 3} más…</div>
            )}
          </div>

          {/* Footer: progreso revisados */}
          {comprasCount > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <div className="flex-1 h-1 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${(revisadosCount / comprasCount) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-text-3 flex-shrink-0">
                {revisadosCount}/{comprasCount} revisados
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Modal con detalle de items */}
      <TarjetaDetailModal
        open={open}
        onClose={() => setOpen(false)}
        bloque={bloque}
        ym={ym}
        toggleRevisado={toggleRevisado}
        onEditCompra={(c) => { setOpen(false); onEditCompra?.(c); }}
        onRemoveCompra={openRemoveCompra}
        onRemovePuntual={openRemovePuntual}
        onDesactivar={openDesactivar}
        onReactivar={openReactivar}
        onFinalizar={openFinalizar}
        onReanudar={openReanudar}
        updateCompra={updateCompra}
      />

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
    </>
  );
}

/* ── Modal detalle de tarjeta ─────────────────────────── */
function TarjetaDetailModal({ open, onClose, bloque, ym, toggleRevisado, onEditCompra, onRemoveCompra, onRemovePuntual, onDesactivar, onReactivar, onFinalizar, onReanudar, updateCompra }) {
  const { tarjeta, items, total } = bloque;
  const color = tarjeta.color || '#64748b';

  const iconBtn = 'w-8 h-8 rounded-lg grid place-items-center text-text-3 hover:bg-surface-3 hover:text-text transition-colors flex-shrink-0';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tarjeta.nombre}
      size="lg"
    >
      <div className="px-5 pb-5">
        {/* Sub-header: total */}
        <div className="flex items-center gap-3 mb-5 -mt-1">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          {tarjeta.tipo === 'persona' && <span className="chip bg-surface-3 text-text-2">persona</span>}
          <span className="text-text-3 text-sm">Total este mes</span>
          <span className="num font-semibold text-text">{fmt(total)}</span>
        </div>

        {/* Lista de items */}
        <div className="flex flex-col gap-2">
          {items.map((it, idx) => {
            const isPuntual = !!it.puntual;
            const c = it.compra;
            const isSub = !isPuntual && !!c?.esSubscripcion;
            const isRev = !isPuntual && !!c?.revisado?.[ym];
            const periodos = !isPuntual && Array.isArray(c?.periodos) ? c.periodos : [];
            const cicloActivoAbierto = periodos.some((p) => !p.fin);
            const monto = it.miParte ?? it.valorCuota;
            const desc = isPuntual ? it.puntual.descripcion : c.descripcion;

            return (
              <div
                key={isPuntual ? 'p-' + it.puntual.id : c.id + idx}
                className={`rounded-[12px] border border-border p-4 transition-colors ${isRev ? 'bg-surface-2 opacity-70' : 'bg-surface'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Revisado toggle */}
                  {!isPuntual && (
                    <button
                      onClick={() => toggleRevisado(c.id, ym)}
                      className={`mt-0.5 h-[18px] w-[18px] rounded-[5px] border grid place-items-center flex-shrink-0 transition-colors ${
                        isRev ? 'bg-accent border-accent text-white' : 'border-border-strong text-transparent hover:border-accent'
                      }`}
                      aria-label="Revisado"
                    >
                      <IconCheck size={11} />
                    </button>
                  )}
                  {isPuntual && <div className="w-[18px] flex-shrink-0" />}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {isPuntual && <span className="chip bg-surface-3 text-text-2">puntual</span>}
                      {isSub && <span className="chip bg-accent-tint text-accent">subscripción</span>}
                      {!isPuntual && c.esCompartida && <span className="chip bg-surface-3 text-text-2">compartida</span>}
                      {!isPuntual && c.mesFinAnticipado && (
                        <span className="chip" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>
                          finaliza {monthLabel(c.mesFinAnticipado)}
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-[13.5px] text-text">{desc}</div>
                    {!isPuntual && c.esCompartida && (
                      <div className="text-[12px] text-text-3 mt-0.5">
                        {c.divididaEntre}{c.valorPorPersona ? ` · ${fmt(c.valorPorPersona)} c/u` : ''}
                      </div>
                    )}
                  </div>

                  {/* Monto + cuota */}
                  <div className="text-right flex-shrink-0">
                    <div className="num font-semibold text-[14px] text-text">{fmt(monto)}</div>
                    <div className="text-[11.5px] text-text-3 num mt-0.5">
                      {isPuntual ? 'pago único' : isSub ? `mes #${it.numCuota}` : `${it.numCuota} / ${c.cantCuotas}`}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {isSub && updateCompra && (
                      cicloActivoAbierto
                        ? <button className={iconBtn} onClick={() => onDesactivar(c)} title="Desactivar"><IconPause size={15} /></button>
                        : <button className={iconBtn} onClick={() => onReactivar(c)} title="Reactivar"><IconRefresh size={15} /></button>
                    )}
                    {!isPuntual && !isSub && updateCompra && (
                      c.mesFinAnticipado
                        ? <button className={iconBtn} onClick={() => onReanudar(c)} title="Reanudar cuotas"><IconRefresh size={15} /></button>
                        : <button className={iconBtn} onClick={() => onFinalizar(c)} title="Finalizar anticipadamente"><IconStop size={15} /></button>
                    )}
                    {!isPuntual && onEditCompra && (
                      <button className={iconBtn} onClick={() => onEditCompra(c)} title="Editar"><IconPencil size={15} /></button>
                    )}
                    <button
                      className={iconBtn + ' hover:!text-negative hover:!bg-negative/10'}
                      onClick={() => isPuntual ? onRemovePuntual(it.puntual) : onRemoveCompra(c)}
                      title="Eliminar"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
