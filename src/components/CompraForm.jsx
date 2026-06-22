import { useEffect, useState } from 'react';
import { monthLabel, fmtMonto, parseMonto } from '../utils/format';

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
  const [valorCuotaManual, setValorCuotaManual] = useState(
    initial?.valorCuota ? fmtMonto(String(initial.valorCuota)) : ''
  );

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        mesFin: initial.mesFin || '',
        montoMensual: initial.esSubscripcion ? fmtMonto(String(initial.valorCuota ?? '')) : '',
        valorCompra: fmtMonto(String(initial.valorCompra ?? '')),
        valorConInteres: fmtMonto(String(initial.valorConInteres ?? '')),
        valorPorPersona: fmtMonto(String(initial.valorPorPersona ?? '')),
        personasIds: Array.isArray(initial.personasIds) ? initial.personasIds : [],
      });
      setCustomCuota(!!initial.id);
      setValorCuotaManual(initial.valorCuota ? fmtMonto(String(initial.valorCuota)) : '');
    } else {
      setForm((f) => ({ ...f, mesInicio }));
    }
  }, [initial, mesInicio]);

  const isSub = !!form.esSubscripcion;
  const base = parseMonto(form.valorConInteres) || parseMonto(form.valorCompra) || 0;
  const cantCuotas = Math.max(1, Number(form.cantCuotas || 1));
  const valorCuotaAuto = Math.round(base / cantCuotas);
  const valorCuotaCalc = customCuota && valorCuotaManual !== '' ? parseMonto(valorCuotaManual) : valorCuotaAuto;
  const valorCuota = isSub ? parseMonto(form.montoMensual) : valorCuotaCalc;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const togglePersona = (id) => {
    set('personasIds', form.personasIds.includes(id)
      ? form.personasIds.filter((pid) => pid !== id)
      : [...form.personasIds, id]
    );
  };

  const personasSelNombres = (form.personasIds || [])
    .map((id) => personas.find((p) => p.id === id)?.nombre)
    .filter(Boolean)
    .join(', ');

  const submit = (e) => {
    e.preventDefault();
    if (!form.tarjetaId || !form.descripcion) return;
    if (isSub && !parseMonto(form.montoMensual)) return;

    const personasIds = form.esCompartida ? (form.personasIds || []) : [];
    const divididaEntre = form.esCompartida
      ? (personasSelNombres || form.divididaEntre || '')
      : '';

    const compartidaFields = {
      esCompartida: form.esCompartida,
      divididaEntre,
      personasIds,
      valorPorPersona: form.esCompartida ? parseMonto(form.valorPorPersona) || null : null,
    };

    const payload = isSub
      ? {
          tarjetaId: form.tarjetaId,
          descripcion: form.descripcion,
          mesInicio: form.mesInicio,
          mesFin: form.mesFin || null,
          esSubscripcion: true,
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
          valorCompra: parseMonto(form.valorCompra),
          valorConInteres: parseMonto(form.valorConInteres) || parseMonto(form.valorCompra) || 0,
          cantCuotas,
          valorCuota,
          ...compartidaFields,
        };

    onAdd(payload);
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-4">
      <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface-2 p-1 w-fit">
        <button
          type="button"
          onClick={() => set('esSubscripcion', false)}
          disabled={isEditing}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${!isSub ? 'bg-accent text-white' : 'text-text-2 hover:text-text'} ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >Compra en cuotas</button>
        <button
          type="button"
          onClick={() => set('esSubscripcion', true)}
          disabled={isEditing}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${isSub ? 'bg-accent text-white' : 'text-text-2 hover:text-text'} ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >Subscripción</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Tarjeta / cuenta</label>
          <select className="input mt-1.5" value={form.tarjetaId} onChange={(e) => set('tarjetaId', e.target.value)} required>
            <option value="">Seleccionar…</option>
            {tarjetas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}{t.tipo === 'persona' ? ' (persona)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Descripción</label>
          <input className="input mt-1.5" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} required placeholder={isSub ? 'Ej: Netflix, Spotify, Gym…' : 'Ej: Monitor, Plan Entel…'} />
        </div>
      </div>

      {isSub ? (
        <>
          <div className={`grid gap-3 ${isEditing ? 'sm:grid-cols-1' : 'sm:grid-cols-3'}`}>
            <div>
              <label className="label">Monto mensual</label>
              <input type="text" inputMode="numeric" className="input mt-1.5" value={form.montoMensual} onChange={(e) => set('montoMensual', fmtMonto(e.target.value))} placeholder="$" required />
            </div>
            {!isEditing && (
              <>
                <div>
                  <label className="label">Mes inicio</label>
                  <input type="month" className="input mt-1.5" value={form.mesInicio} onChange={(e) => set('mesInicio', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Último mes (opcional)</label>
                  <input type="month" className="input mt-1.5" value={form.mesFin} onChange={(e) => set('mesFin', e.target.value)} placeholder="—" />
                  <div className="text-[11px] text-text-3 mt-1">Vacío = activa indefinidamente</div>
                </div>
              </>
            )}
          </div>

          {isEditing && Array.isArray(initial?.periodos) && initial.periodos.length > 0 && (
            <div className="rounded-[10px] border border-border bg-surface-2 p-3">
              <div className="label mb-2">Ciclos de actividad</div>
              <div className="space-y-1 text-sm">
                {initial.periodos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface rounded px-2 py-1">
                    <span className="text-text">Ciclo {i + 1}</span>
                    <span className="text-text-2 text-xs">
                      {monthLabel(p.inicio)} → {p.fin ? monthLabel(p.fin) : <span className="text-positive">activo</span>}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-text-3 mt-2">
                Para abrir/cerrar ciclos usa los botones de pausar y reactivar en la fila.
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Valor compra</label>
              <input type="text" inputMode="numeric" className="input mt-1.5" value={form.valorCompra} onChange={(e) => set('valorCompra', fmtMonto(e.target.value))} placeholder="$" />
            </div>
            <div>
              <label className="label">Valor + interés</label>
              <input type="text" inputMode="numeric" className="input mt-1.5" value={form.valorConInteres} onChange={(e) => set('valorConInteres', fmtMonto(e.target.value))} placeholder="opcional" />
            </div>
            <div>
              <label className="label">Cant. cuotas</label>
              <input type="number" min={1} className="input mt-1.5" value={form.cantCuotas} onChange={(e) => set('cantCuotas', e.target.value)} />
            </div>
            <div>
              <label className="label">Mes 1ra cuota</label>
              <input type="month" className="input mt-1.5" value={form.mesInicio} onChange={(e) => set('mesInicio', e.target.value)} required />
            </div>
          </div>

          <div className="text-sm bg-surface-2 rounded-[10px] p-3 border border-border space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={customCuota} onChange={(e) => setCustomCuota(e.target.checked)} />
                <span className="text-text-2">Definir valor cuota manualmente</span>
              </label>
              <div className="text-right flex-shrink-0">
                <div className="label text-[10px]">Valor cuota</div>
                <div className="num text-accent font-semibold">${valorCuota.toLocaleString('es-CL')}</div>
              </div>
            </div>
            {customCuota && (
              <input type="text" inputMode="numeric" className="input" placeholder="$/cuota" value={valorCuotaManual} onChange={(e) => setValorCuotaManual(fmtMonto(e.target.value))} />
            )}
          </div>
        </>
      )}

      <div className="rounded-[10px] border border-border p-3 bg-surface-2">
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
                            ? 'border-transparent text-white'
                            : 'border-border-strong text-text-2 hover:border-text-3'
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
                  <div className="text-xs text-negative mt-1">Selecciona al menos una persona.</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-text-2 bg-surface rounded px-3 py-2">
                No hay personas configuradas. Ve a <strong>Tarjetas y cuentas → Personas</strong> para agregarlas.
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Parte de cada persona asociada</label>
                <input type="text" inputMode="numeric" className="input mt-1.5" value={form.valorPorPersona} onChange={(e) => set('valorPorPersona', fmtMonto(e.target.value))} placeholder="$ por persona" />
                <div className="text-[11px] text-text-3 mt-1">Lo que paga cada uno de los asociados. Tu parte = cuota − (este monto × cant. personas).</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {isEditing && (
          <div className="text-xs text-text-2">
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
