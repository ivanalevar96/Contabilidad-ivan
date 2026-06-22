import { useState, useEffect } from 'react';
import { fmt, monthLabel, fmtMonto, parseMonto } from '../utils/format';
import { IconPencil, IconPlus, IconUp } from './icons';
import Modal from './Modal';

export default function SueldoBlock({ ym, sueldoObj, resumen, setSueldo, addIngresoExtra, removeIngresoExtra }) {
  const [showEditSueldo, setShowEditSueldo] = useState(false);
  const [showAddExtra, setShowAddExtra] = useState(false);

  const extras = sueldoObj.ingresosExtra || [];

  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-[14px]">
        {/* Sueldo */}
        <div className="card p-6">
          <div className="text-[13.5px] font-semibold mb-1.5">Sueldo del mes</div>
          <div className="text-xs text-text-3 mb-4">Ingreso fijo · {monthLabel(ym)}</div>
          <div className="num text-[32px] font-semibold tracking-[-0.02em] text-positive">{fmt(sueldoObj.sueldo || 0)}</div>
          <button className="btn-ghost mt-[18px]" onClick={() => setShowEditSueldo(true)}>
            <IconPencil size={15} /> Editar sueldo
          </button>
        </div>

        {/* Total */}
        <div className="rounded-card border border-border p-6" style={{ background: 'var(--accent-tint)' }}>
          <div className="text-[13.5px] font-semibold mb-1.5">Total de ingresos</div>
          <div className="text-xs text-text-3 mb-4">Sueldo + extras</div>
          <div className="num text-[32px] font-semibold tracking-[-0.02em] text-accent">{fmt(resumen.ingresos)}</div>
          <div className="mt-[18px] text-[12.5px] text-text-2">
            {extras.length} ingreso{extras.length !== 1 ? 's' : ''} extra registrado{extras.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Ingresos extra */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-[13.5px] font-semibold">Ingresos extra</div>
          <button className="flex items-center gap-1.5 text-[13px] font-medium text-accent hover:opacity-80 transition-opacity" onClick={() => setShowAddExtra(true)}>
            <IconPlus size={15} /> Agregar
          </button>
        </div>
        <div className="flex flex-col gap-[7px]">
          {extras.length === 0 && <div className="text-sm text-text-3 py-1">Sin ingresos extra este mes.</div>}
          {extras.map((e) => (
            <div key={e.id} className="flex items-center gap-3 bg-surface-2 rounded-[10px] px-3.5 py-3">
              <div className="w-[30px] h-[30px] rounded-lg grid place-items-center flex-shrink-0" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>
                <IconUp size={15} />
              </div>
              <div className="flex-1 min-w-0 text-[13.5px] font-medium truncate">{e.desc}</div>
              <div className="num font-semibold text-[13.5px] text-positive">{fmt(e.monto)}</div>
              <button className="text-text-3 hover:text-negative transition-colors" onClick={() => removeIngresoExtra(ym, e.id)} aria-label="Eliminar">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: editar sueldo */}
      <EditSueldoModal
        open={showEditSueldo}
        onClose={() => setShowEditSueldo(false)}
        onSave={(monto) => {
          setSueldo(ym, monto);
          setShowEditSueldo(false);
        }}
        current={sueldoObj.sueldo || 0}
        mesLabel={monthLabel(ym)}
      />

      {/* Modal: nuevo ingreso extra */}
      <IngresoExtraModal
        open={showAddExtra}
        onClose={() => setShowAddExtra(false)}
        onSave={(desc, monto) => {
          addIngresoExtra(ym, desc || 'Ingreso extra', monto);
          setShowAddExtra(false);
        }}
        mesLabel={monthLabel(ym)}
      />
    </div>
  );
}

function EditSueldoModal({ open, onClose, onSave, current, mesLabel }) {
  const [monto, setMonto] = useState('');

  useEffect(() => {
    if (open) setMonto(current > 0 ? fmtMonto(String(current)) : '');
  }, [open, current]);

  const submit = (e) => {
    e.preventDefault();
    if (!parseMonto(monto)) return;
    onSave(parseMonto(monto));
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar sueldo" size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="text-xs text-text-3 -mt-1">Ingreso fijo para {mesLabel}.</div>
        <div>
          <div className="label mb-1.5">Monto</div>
          <input
            type="text"
            inputMode="numeric"
            className="input"
            placeholder="$"
            value={monto}
            onChange={(e) => setMonto(fmtMonto(e.target.value))}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={!parseMonto(monto)}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

function IngresoExtraModal({ open, onClose, onSave, mesLabel }) {
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');

  useEffect(() => {
    if (open) { setDesc(''); setMonto(''); }
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (!parseMonto(monto)) return;
    onSave(desc.trim(), parseMonto(monto));
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo ingreso extra" size="sm">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="text-xs text-text-3 -mt-1">Se sumará a los ingresos de {mesLabel}.</div>
        <div>
          <div className="label mb-1.5">Descripción</div>
          <input
            className="input"
            placeholder="Ej: Bono, freelance, reembolso…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <div className="label mb-1.5">Monto</div>
          <input
            type="text"
            inputMode="numeric"
            className="input"
            placeholder="$"
            value={monto}
            onChange={(e) => setMonto(fmtMonto(e.target.value))}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={!parseMonto(monto)}>Agregar</button>
        </div>
      </form>
    </Modal>
  );
}
