import { useState } from 'react';

export default function PagoPuntualForm({ tarjetas, mesYM, onAdd, onClose }) {
  const [tarjetaId, setTarjetaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!tarjetaId || !descripcion || !monto) return;
    onAdd({ tarjetaId, descripcion, monto: Number(monto) || 0, mesYM });
    onClose?.();
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 bg-panel2">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Tarjeta / cuenta</label>
          <select className="input mt-1" value={tarjetaId} onChange={(e) => setTarjetaId(e.target.value)} required>
            <option value="">Seleccionar…</option>
            {tarjetas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descripción</label>
          <input className="input mt-1" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        </div>
        <div>
          <label className="label">Monto</label>
          <input type="number" className="input mt-1" value={monto} onChange={(e) => setMonto(e.target.value)} required />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Agregar pago</button>
      </div>
    </form>
  );
}
