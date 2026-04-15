import { useEffect, useState } from 'react';

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
};

export default function CompraForm({ tarjetas, mesInicio, onAdd, onClose, initial }) {
  const [form, setForm] = useState({ ...empty, mesInicio });
  const [customCuota, setCustomCuota] = useState(false);
  const [valorCuotaManual, setValorCuotaManual] = useState('');

  useEffect(() => {
    if (initial) setForm({ ...empty, ...initial });
    else setForm((f) => ({ ...f, mesInicio }));
  }, [initial, mesInicio]);

  const base = Number(form.valorConInteres || form.valorCompra || 0);
  const cantCuotas = Math.max(1, Number(form.cantCuotas || 1));
  const valorCuotaAuto = Math.round(base / cantCuotas);
  const valorCuota = customCuota && valorCuotaManual !== '' ? Number(valorCuotaManual) : valorCuotaAuto;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.tarjetaId || !form.descripcion) return;
    onAdd({
      ...form,
      valorCompra: Number(form.valorCompra) || 0,
      valorConInteres: Number(form.valorConInteres) || Number(form.valorCompra) || 0,
      cantCuotas,
      valorCuota,
      valorPorPersona: form.esCompartida ? Number(form.valorPorPersona) || null : null,
    });
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 bg-panel2">
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
          <input className="input mt-1" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} required placeholder="Ej: Monitor, Plan Entel…" />
        </div>
      </div>

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

      <div className="rounded-lg border border-slate-800 p-3 bg-slate-900/40">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.esCompartida} onChange={(e) => set('esCompartida', e.target.checked)} />
          <span className="text-sm">Compra compartida</span>
        </label>
        {form.esCompartida && (
          <div className="mt-2 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Dividida entre</label>
              <input className="input mt-1" value={form.divididaEntre} onChange={(e) => set('divididaEntre', e.target.value)} placeholder="Ej: Yo, Diego, Pedro" />
            </div>
            <div>
              <label className="label">Mi parte</label>
              <input type="number" className="input mt-1" value={form.valorPorPersona} onChange={(e) => set('valorPorPersona', e.target.value)} placeholder="$ por persona" />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Agregar</button>
      </div>
    </form>
  );
}
