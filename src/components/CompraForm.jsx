import { useEffect, useState } from 'react';
import { monthLabel } from '../utils/format';

const empty = {
  tarjetaId: '',
  descripcion: '',
  valorCompra: '',
  valorConInteres: '',
  cantCuotas: 1,
  mesInicio: '',
  esCompartida: false,
  divididaEntre: '',
  valorPorPersona: '',
  personasIds: [],
  esSubscripcion: false,
  mesFin: '',
  montoMensual: '',
};

export default function CompraForm({ tarjetas, personas = [], mesInicio, onAdd, onClose, initial }) {
  const isEditing = !!initial?.id;
  const [form, setForm] = useState({ ...empty, mesInicio });
  const [customCuota, setCustomCuota] = useState(!!initial?.id);
  const [valorCuotaManual, setValorCuotaManual] = useState(initial?.valorCuota ?? '');

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        mesFin: initial.mesFin || '',
        montoMensual: initial.esSubscripcion ? (initial.valorCuota ?? '') : '',
        personasIds: Array.isArray(initial.personasIds) ? initial.personasIds : [],
      });
      setCustomCuota(!!initial.id);
      setValorCuotaManual(initial.valorCuota ?? '');
    } else {
      setForm((f) => ({ ...f, mesInicio }));
    }
  }, [initial, mesInicio]);

  const isSub = !!form.esSubscripcion;
  const base = Number(form.valorConInteres || form.valorCompra || 0);
  const cantCuotas = Math.max(1, Number(form.cantCuotas || 1));
  const valorCuotaAuto = Math.round(base / cantCuotas);
  const valorCuotaCalc = customCuota && valorCuotaManual !== '' ? Number(valorCuotaManual) : valorCuotaAuto;
  const valorCuota = isSub ? Number(form.montoMensual) || 0 : valorCuotaCalc;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const togglePersona = (id) => {
    set('personasIds', form.personasIds.includes(id)
      ? form.personasIds.filter((pid) => pid !== id)
      : [...form.personasIds, id]
    );
  };

  // Nombre legible de personas seleccionadas (para el campo legacy divididaEntre)
  const personasSelNombres = (form.personasIds || [])
    .map((id) => personas.find((p) => p.id === id)?.nombre)
    .filter(Boolean)
    .join(', ');

  const submit = (e) => {
    e.preventDefault();
    if (!form.tarjetaId || !form.descripcion) return;
    if (isSub && !Number(form.montoMensual)) return;

    const personasIds = form.esCompartida ? (form.personasIds || []) : [];
    // divididaEntre: si hay personas seleccionadas usa sus nombres, sino conserva texto libre
    const divididaEntre = form.esCompartida
      ? (personasSelNombres || form.divididaEntre || '')
      : '';

    const compartidaFields = {
      esCompartida: form.esCompartida,
      divididaEntre,
      personasIds,
      valorPorPersona: form.esCompartida ? Number(form.valorPorPersona) || null : null,
    };

    const payload = isSub
      ? {
          tarjetaId: form.tarjetaId,
          descripcion: form.descripcion,
          mesInicio: form.mesInicio,
          mesFin: form.mesFin || null,
          esSubscripcion: true,
          // Si estamos creando, generamos el primer período. En edición conservamos los existentes.
          periodos: isEditing
            ? (initial?.periodos || [])
            : [{ inicio: form.mesInicio, fin: form.mesFin || null }],
          valorCompra: 0,
          valorConInteres: 0,
          cantCuotas: 1,
          valorCuota,
          ...compartidaFields,
        }
      : {
          tarjetaId: form.tarjetaId,
          descripcion: form.descripcion,
          mesInicio: form.mesInicio,
          esSubscripcion: false,
          mesFin: null,
          valorCompra: Number(form.valorCompra) || 0,
          valorConInteres: Number(form.valorConInteres) || Number(form.valorCompra) || 0,
          cantCuotas,
          valorCuota,
          ...compartidaFields,
        };

    onAdd(payload);
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 bg-panel2">
      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-1 w-fit">
        <button
          type="button"
          onClick={() => set('esSubscripcion', false)}
          disabled={isEditing}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${!isSub ? 'bg-accent text-slate-900' : 'text-slate-300 hover:text-white'} ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >💳 Compra en cuotas</button>
        <button
          type="button"
          onClick={() => set('esSubscripcion', true)}
          disabled={isEditing}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${isSub ? 'bg-accent text-slate-900' : 'text-slate-300 hover:text-white'} ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >🔄 Subscripción</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Tarjeta / cuenta</label>
          <select className="input mt-1" value={form.tarjetaId} onChange={(e) => set('tarjetaId', e.target.value)} required>
            <option value="">Seleccionar…</option>
            {tarjetas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}{t.tipo === 'persona' ? ' (persona)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Descripción</label>
          <input className="input mt-1" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} required placeholder={isSub ? 'Ej: Netflix, Spotify, Gym…' : 'Ej: Monitor, Plan Entel…'} />
        </div>
      </div>

      {isSub ? (
        <>
          <div className={`grid gap-3 ${isEditing ? 'sm:grid-cols-1' : 'sm:grid-cols-3'}`}>
            <div>
              <label className="label">Monto mensual</label>
              <input type="number" className="input mt-1" value={form.montoMensual} onChange={(e) => set('montoMensual', e.target.value)} placeholder="$" required />
            </div>
            {!isEditing && (
              <>
                <div>
                  <label className="label">Mes inicio</label>
                  <input type="month" className="input mt-1" value={form.mesInicio} onChange={(e) => set('mesInicio', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Último mes (opcional)</label>
                  <input type="month" className="input mt-1" value={form.mesFin} onChange={(e) => set('mesFin', e.target.value)} placeholder="—" />
                  <div className="text-[11px] text-slate-500 mt-1">Vacío = activa indefinidamente</div>
                </div>
              </>
            )}
          </div>

          {isEditing && Array.isArray(initial?.periodos) && initial.periodos.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <div className="label mb-2">Ciclos de actividad</div>
              <div className="space-y-1 text-sm">
                {initial.periodos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/60 rounded px-2 py-1">
                    <span className="text-slate-200">Ciclo {i + 1}</span>
                    <span className="text-slate-400 text-xs">
                      {monthLabel(p.inicio)} → {p.fin ? monthLabel(p.fin) : <span className="text-emerald-300">activo</span>}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Para abrir/cerrar ciclos usa los botones ⏸ Desactivar y ⟳ Reactivar en la fila.
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Valor compra</label>
              <input type="number" className="input mt-1" value={form.valorCompra} onChange={(e) => set('valorCompra', e.target.value)} />
            </div>
            <div>
              <label className="label">Valor + interés</label>
              <input type="number" className="input mt-1" value={form.valorConInteres} onChange={(e) => set('valorConInteres', e.target.value)} placeholder="opcional" />
            </div>
            <div>
              <label className="label">Cant. cuotas</label>
              <input type="number" min={1} className="input mt-1" value={form.cantCuotas} onChange={(e) => set('cantCuotas', e.target.value)} />
            </div>
            <div>
              <label className="label">Mes 1ra cuota</label>
              <input type="month" className="input mt-1" value={form.mesInicio} onChange={(e) => set('mesInicio', e.target.value)} required />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm bg-slate-900/60 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={customCuota} onChange={(e) => setCustomCuota(e.target.checked)} />
                <span className="text-slate-300">Definir valor cuota manualmente</span>
              </label>
              {customCuota && (
                <input type="number" className="input w-32" placeholder="$/cuota" value={valorCuotaManual} onChange={(e) => setValorCuotaManual(e.target.value)} />
              )}
            </div>
            <div className="text-right">
              <div className="label">Valor cuota</div>
              <div className="text-cyan-300 font-semibold">${valorCuota.toLocaleString('es-CL')}</div>
            </div>
          </div>
        </>
      )}

      <div className="rounded-lg border border-slate-800 p-3 bg-slate-900/40">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.esCompartida} onChange={(e) => set('esCompartida', e.target.checked)} />
          <span className="text-sm">{isSub ? 'Subscripción compartida' : 'Compra compartida'}</span>
        </label>
        {form.esCompartida && (
          <div className="mt-3 space-y-3">
            {personas.length > 0 ? (
              <div>
                <label className="label mb-2">Dividida entre</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {personas.map((p) => {
                    const sel = form.personasIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePersona(p.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border transition ${
                          sel
                            ? 'border-transparent text-slate-900'
                            : 'border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                        style={sel ? { background: p.color } : {}}
                      >
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ background: sel ? 'rgba(0,0,0,0.35)' : p.color }}
                        />
                        {p.nombre}
                        {sel && <span className="ml-0.5 opacity-70 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {form.personasIds.length === 0 && (
                  <div className="text-xs text-amber-400/80 mt-1">Selecciona al menos una persona.</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-900/60 rounded px-3 py-2">
                No hay personas configuradas. Ve a <strong>Configuración → Personas</strong> para agregarlas.
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Mi parte ($ por persona)</label>
                <input type="number" className="input mt-1" value={form.valorPorPersona} onChange={(e) => set('valorPorPersona', e.target.value)} placeholder="Opcional" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {isEditing && (
          <div className="text-xs text-amber-300/80">
            ⚠ Editando un registro existente. Los cambios afectan a todos los meses donde aparece.
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">{isEditing ? 'Guardar cambios' : 'Agregar'}</button>
        </div>
      </div>
    </form>
  );
}
