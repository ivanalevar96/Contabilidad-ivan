import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fmt, monthLabel, fmtMonto, parseMonto } from '../utils/format';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import {
  IconPlus, IconPencil, IconChart, IconChevronDown, IconPiggyBank, IconRefresh,
} from './icons';

const COLORS = ['#0d9488', '#0f766e', '#c9a04a', '#64748b', '#94a3b8', '#fb7185', '#f59e0b', '#a78bfa', '#60a5fa'];

const TIPOS = [
  { value: 'prepago', label: 'Cuenta prepago' },
  { value: 'apv', label: 'APV' },
  { value: 'ahorro_vivienda', label: 'Ahorro a la vivienda' },
  { value: 'otro', label: 'Otro' },
];

const tipoLabel = (tipo) => TIPOS.find((t) => t.value === tipo)?.label || 'Otro';

export default function AhorrosTab({ ym, resumenAhorros = [], f }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aportandoId, setAportandoId] = useState(null);
  const [ajustandoId, setAjustandoId] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);

  const activas = resumenAhorros.filter((r) => !r.cuenta.archivada);
  const archivadas = resumenAhorros.filter((r) => r.cuenta.archivada);

  const totalEsteMes = activas.reduce((a, r) => a + r.aporteEsteMes, 0);
  const totalAcumulado = activas.reduce((a, r) => a + r.saldoAcumulado, 0);

  const saveCuenta = (payload) => {
    if (editing) {
      f.updateCuentaAhorro(editing.id, payload);
      toast.success(`${payload.nombre} actualizada`);
    } else {
      f.addCuentaAhorro(payload);
      toast.success(`${payload.nombre} agregada`);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-text-3 num px-1">
        <span>{activas.length} cuenta{activas.length !== 1 ? 's' : ''} de ahorro</span>
        <div className="flex items-center gap-3">
          <span>Aportado este mes <strong className="text-text">{fmt(totalEsteMes)}</strong></span>
          <span>Acumulado <strong className="text-positive">{fmt(totalAcumulado)}</strong></span>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary !h-9 !px-3.5" onClick={() => { setEditing(null); setShowForm(true); }}>
          <IconPlus size={15} /> Nueva cuenta
        </button>
      </div>

      {activas.length === 0 ? (
        <div className="card p-6 text-sm text-text-3">
          Aún no tienes cuentas de ahorro. Agrega una con el botón "Nueva cuenta".
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activas.map((r) => (
            <CuentaCard
              key={r.cuenta.id}
              r={r}
              ym={ym}
              onEdit={() => { setEditing(r.cuenta); setShowForm(true); }}
              onAportar={() => setAportandoId(r.cuenta.id)}
              onAjustar={() => setAjustandoId(r.cuenta.id)}
              onDetalle={() => setDetalleId(r.cuenta.id)}
              onArchivar={() => setDialog({
                title: 'Archivar cuenta',
                message: `"${r.cuenta.nombre}" dejará de sumar aportes automáticos y no aparecerá en meses nuevos.\nEl historial se conserva intacto.`,
                confirmLabel: 'Archivar',
                onConfirm: () => f.archiveCuentaAhorro(r.cuenta.id),
              })}
            />
          ))}
        </div>
      )}

      {archivadas.length > 0 && (
        <section className="card p-6">
          <button
            className="w-full flex items-center justify-between text-[13.5px] font-semibold mb-3"
            onClick={() => setMostrarArchivadas((v) => !v)}
            type="button"
          >
            <span>Archivadas ({archivadas.length})</span>
            <span className="text-text-3 transition-transform" style={{ transform: mostrarArchivadas ? 'rotate(180deg)' : 'none' }}>
              <IconChevronDown size={16} />
            </span>
          </button>
          {mostrarArchivadas && (
            <div className="flex flex-col gap-2">
              {archivadas.map((r) => (
                <div key={r.cuenta.id} className="flex items-center gap-3 bg-surface-2 border border-border rounded-[11px] px-3.5 py-3 opacity-75">
                  <span className="h-[10px] w-[10px] rounded-full flex-shrink-0" style={{ background: r.cuenta.color }} />
                  <span className="flex-1 text-text-2 min-w-0 truncate">
                    {r.cuenta.nombre}
                    <span className="text-text-3 text-xs ml-2">{fmt(r.saldoAcumulado)} acumulado</span>
                  </span>
                  <button className="btn-ghost flex-shrink-0" onClick={() => f.unarchiveCuentaAhorro(r.cuenta.id)}>Restaurar</button>
                  <button
                    className="btn-danger flex-shrink-0"
                    onClick={() => setDialog({
                      title: 'Eliminar definitivamente',
                      message: `Se eliminará "${r.cuenta.nombre}" y TODO su historial de aportes.\n\nEsta acción no se puede deshacer.`,
                      confirmLabel: 'Eliminar',
                      danger: true,
                      onConfirm: () => f.removeCuentaAhorro(r.cuenta.id),
                    })}
                  >Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Editar cuenta de ahorro' : 'Nueva cuenta de ahorro'} size="sm">
        <CuentaForm initial={editing} ymDefault={ym} onSave={saveCuenta} onCancel={() => { setShowForm(false); setEditing(null); }} />
      </Modal>

      {(() => {
        const target = activas.find((r) => r.cuenta.id === aportandoId);
        return (
          <Modal open={!!aportandoId} onClose={() => setAportandoId(null)} title={target ? `Agregar aporte · ${target.cuenta.nombre}` : 'Agregar aporte'} size="sm">
            <div className="p-4">
              {target && (
                <AportarForm
                  onSave={(payload) => {
                    f.addAporteAhorro({ cuentaAhorroId: target.cuenta.id, mesYM: ym, tipo: 'manual', ...payload });
                    setAportandoId(null);
                    toast.success('Aporte agregado');
                  }}
                  onCancel={() => setAportandoId(null)}
                />
              )}
            </div>
          </Modal>
        );
      })()}

      {(() => {
        const target = activas.find((r) => r.cuenta.id === ajustandoId);
        return (
          <Modal open={!!ajustandoId} onClose={() => setAjustandoId(null)} title={target ? `Ajustar saldo · ${target.cuenta.nombre}` : 'Ajustar saldo'} size="sm">
            <div className="p-4">
              {target && (
                <AjustarForm
                  onSave={(payload) => {
                    f.addAporteAhorro({ cuentaAhorroId: target.cuenta.id, mesYM: ym, tipo: 'ajuste', ...payload });
                    setAjustandoId(null);
                    toast.success('Saldo ajustado');
                  }}
                  onCancel={() => setAjustandoId(null)}
                />
              )}
            </div>
          </Modal>
        );
      })()}

      {(() => {
        const target = resumenAhorros.find((r) => r.cuenta.id === detalleId);
        return (
          <Modal open={!!detalleId} onClose={() => setDetalleId(null)} title={target ? `Historial · ${target.cuenta.nombre}` : 'Historial'}>
            <div className="p-4">
              {target && (
                <DetalleCuenta
                  r={target}
                  onRemove={(id) => { f.removeAporteAhorro(id); toast.success('Movimiento eliminado'); }}
                />
              )}
            </div>
          </Modal>
        );
      })()}

      <ConfirmModal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        danger={dialog?.danger}
        onConfirm={dialog?.onConfirm}
      />
    </div>
  );
}

function CuentaCard({ r, ym, onEdit, onAportar, onAjustar, onDetalle, onArchivar }) {
  const { cuenta, aporteEsteMes, saldoAcumulado } = r;
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-[10px] flex-shrink-0 grid place-items-center text-white" style={{ background: cuenta.color }}>
          <IconPiggyBank size={17} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[14.5px] truncate">{cuenta.nombre}</div>
          <div className="text-xs text-text-3 truncate">
            {tipoLabel(cuenta.tipo)}{cuenta.entidad ? ` · ${cuenta.entidad}` : ''}
          </div>
        </div>
        <button className="text-text-3 hover:text-accent transition-colors flex-shrink-0" onClick={onEdit} title="Editar">
          <IconPencil size={15} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10.5px] text-text-3 uppercase tracking-wide">Saldo acumulado</div>
          <div className="num text-lg font-bold text-positive">{fmt(saldoAcumulado)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] text-text-3 uppercase tracking-wide flex items-center gap-1 justify-end">
            {cuenta.automatico && <IconRefresh size={11} />} Este mes
          </div>
          <div className="num text-[14.5px] font-semibold">{fmt(aporteEsteMes)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn-ghost !h-8 !px-3 text-xs gap-1" onClick={onAportar}><IconPlus size={13} /> Aportar</button>
        <button className="btn-ghost !h-8 !px-3 text-xs gap-1" onClick={onAjustar}>Ajustar saldo</button>
        <button className="btn-ghost !h-8 !px-3 text-xs gap-1" onClick={onDetalle}><IconChart size={13} /> Detalle</button>
        <div className="flex-1" />
        <button className="text-xs text-text-3 hover:text-negative transition-colors" onClick={onArchivar}>Archivar</button>
      </div>
    </div>
  );
}

function CuentaForm({ initial, ymDefault, onSave, onCancel }) {
  const isEditing = !!initial?.id;
  const [nombre, setNombre] = useState('');
  const [entidad, setEntidad] = useState('');
  const [tipo, setTipo] = useState('otro');
  const [color, setColor] = useState(COLORS[0]);
  const [automatico, setAutomatico] = useState(false);
  const [montoAutomatico, setMontoAutomatico] = useState('');
  const [mesInicioAutomatico, setMesInicioAutomatico] = useState(ymDefault);
  const [mesFinAutomatico, setMesFinAutomatico] = useState('');

  useEffect(() => {
    if (initial) {
      setNombre(initial.nombre || '');
      setEntidad(initial.entidad || '');
      setTipo(initial.tipo || 'otro');
      setColor(initial.color || COLORS[0]);
      setAutomatico(!!initial.automatico);
      setMontoAutomatico(initial.montoAutomatico ? fmtMonto(String(initial.montoAutomatico)) : '');
      setMesInicioAutomatico(initial.mesInicioAutomatico || ymDefault);
      setMesFinAutomatico(initial.mesFinAutomatico || '');
    } else {
      setNombre(''); setEntidad(''); setTipo('otro');
      setColor(COLORS[(Math.random() * COLORS.length) | 0]);
      setAutomatico(false); setMontoAutomatico('');
      setMesInicioAutomatico(ymDefault); setMesFinAutomatico('');
    }
  }, [initial, ymDefault]);

  const submit = (e) => {
    e.preventDefault();
    const nombreTrim = nombre.trim();
    if (!nombreTrim) return;
    if (automatico && !parseMonto(montoAutomatico)) return;

    onSave({
      nombre: nombreTrim,
      entidad: entidad.trim(),
      tipo,
      color,
      automatico,
      montoAutomatico: automatico ? parseMonto(montoAutomatico) : 0,
      mesInicioAutomatico: automatico ? (mesInicioAutomatico || ymDefault) : null,
      mesFinAutomatico: automatico ? (mesFinAutomatico || null) : null,
    });
  };

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <div className="label mb-1.5">Nombre</div>
          <input className="input" placeholder="Ej: Tenpo, APV BancoEstado…" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus required />
        </div>
        <div>
          <div className="label mb-1.5">Entidad <span className="text-text-3 normal-case font-normal">(opcional)</span></div>
          <input className="input" placeholder="Ej: Banco Estado" value={entidad} onChange={(e) => setEntidad(e.target.value)} />
        </div>
      </div>

      <div>
        <div className="label mb-1.5">Tipo</div>
        <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <div className="label mb-2">Color</div>
        <div className="flex flex-wrap gap-2 items-center">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ background: c, borderColor: color === c ? 'var(--text)' : 'transparent' }} />
          ))}
        </div>
      </div>

      <div className="rounded-[10px] border border-border p-3 bg-surface-2 space-y-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={automatico} onChange={(e) => setAutomatico(e.target.checked)} />
          <span className="text-sm">Aporte automático todos los meses</span>
        </label>
        {automatico && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <div className="label mb-1.5">Monto mensual</div>
              <input type="text" inputMode="numeric" className="input" placeholder="$" value={montoAutomatico} onChange={(e) => setMontoAutomatico(fmtMonto(e.target.value))} required={automatico} />
            </div>
            <div>
              <div className="label mb-1.5">Mes inicio</div>
              <input type="month" className="input" value={mesInicioAutomatico} onChange={(e) => setMesInicioAutomatico(e.target.value)} required={automatico} />
            </div>
            <div>
              <div className="label mb-1.5">Mes término <span className="text-text-3 normal-case font-normal">(opcional)</span></div>
              <input type="month" className="input" value={mesFinAutomatico} onChange={(e) => setMesFinAutomatico(e.target.value)} placeholder="—" />
              <div className="text-[11px] text-text-3 mt-1">Vacío = indefinido</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary">{isEditing ? 'Guardar cambios' : 'Agregar'}</button>
      </div>
    </form>
  );
}

function AportarForm({ onSave, onCancel }) {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const submit = () => {
    const m = parseMonto(monto);
    if (!m) return;
    onSave({ monto: m, descripcion: descripcion.trim() });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="label mb-1.5">Monto</div>
        <input type="text" inputMode="numeric" className="input" placeholder="$" value={monto} onChange={(e) => setMonto(fmtMonto(e.target.value))} autoFocus />
      </div>
      <div>
        <div className="label mb-1.5">Descripción (opcional)</div>
        <input type="text" className="input" placeholder="Ej: depósito extra" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn-primary" onClick={submit}>Guardar</button>
      </div>
    </div>
  );
}

function AjustarForm({ onSave, onCancel }) {
  const [signo, setSigno] = useState(1);
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');

  const submit = () => {
    const m = parseMonto(monto);
    if (!m) return;
    onSave({ monto: m * signo, descripcion: nota.trim() });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-3">
        Usa esto para reflejar intereses ganados u otras correcciones de saldo. No se descuenta del ingreso del mes.
      </p>
      <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface-2 p-1 w-fit">
        <button type="button" onClick={() => setSigno(1)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${signo === 1 ? 'bg-positive text-white' : 'text-text-2 hover:text-text'}`}
        >+ Sumar</button>
        <button type="button" onClick={() => setSigno(-1)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${signo === -1 ? 'bg-negative text-white' : 'text-text-2 hover:text-text'}`}
        >− Restar</button>
      </div>
      <div>
        <div className="label mb-1.5">Monto</div>
        <input type="text" inputMode="numeric" className="input" placeholder="$" value={monto} onChange={(e) => setMonto(fmtMonto(e.target.value))} autoFocus />
      </div>
      <div>
        <div className="label mb-1.5">Nota (opcional)</div>
        <input type="text" className="input" placeholder="Ej: interés de julio" value={nota} onChange={(e) => setNota(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn-primary" onClick={submit}>Guardar</button>
      </div>
    </div>
  );
}

function DetalleCuenta({ r, onRemove }) {
  const { cuenta, historial } = r;
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {cuenta.automatico && (
        <div className="text-xs text-text-2 bg-surface-2 rounded-[10px] px-3 py-2.5">
          Aporte automático de {fmt(cuenta.montoAutomatico)}/mes desde {monthLabel(cuenta.mesInicioAutomatico)}
          {cuenta.mesFinAutomatico ? ` hasta ${monthLabel(cuenta.mesFinAutomatico)}` : ' (indefinido)'}.
        </div>
      )}
      {historial.length === 0 ? (
        <div className="text-sm text-text-3">Sin aportes ni ajustes manuales todavía.</div>
      ) : (
        <div className="space-y-1">
          {historial.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-[13px] gap-2">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className={`num font-medium flex-shrink-0 ${a.monto < 0 ? 'text-negative' : 'text-text'}`}>{fmt(a.monto)}</span>
                <span className="text-text-3 flex-shrink-0">{monthLabel(a.mesYM)}</span>
                <span className="text-text-3 text-xs flex-shrink-0">· {a.tipo === 'ajuste' ? 'ajuste' : 'manual'}</span>
                {a.descripcion && <span className="text-text-2 truncate">· {a.descripcion}</span>}
              </span>
              <button className="text-text-3 hover:text-negative transition-colors flex-shrink-0" onClick={() => onRemove(a.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
