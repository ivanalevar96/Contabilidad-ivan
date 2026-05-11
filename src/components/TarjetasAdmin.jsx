import { useState } from 'react';
import PersonasAdmin from './PersonasAdmin';

const COLORS = ['#fb7185', '#f59e0b', '#a78bfa', '#34d399', '#22d3ee', '#f472b6', '#60a5fa', '#facc15', '#94a3b8'];

export default function TarjetasAdmin({ f }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('tarjeta');
  const [color, setColor] = useState(COLORS[0]);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);

  const activas = f.state.tarjetas.filter((t) => !t.archivada);
  const archivadas = f.state.tarjetas.filter((t) => t.archivada);

  const add = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    f.addTarjeta({ nombre: nombre.trim(), tipo, color });
    setNombre(''); setColor(COLORS[(Math.random() * COLORS.length) | 0]);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(f.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finanzas-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { f.importJson(JSON.parse(String(reader.result))); } catch { alert('Archivo inválido'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-base font-semibold mb-3">Tarjetas y cuentas</h2>
        <div className="grid gap-2">
          {activas.map((t) => (
            <div key={t.id} className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
              <input type="color" value={t.color || '#64748b'} onChange={(e) => f.updateTarjeta(t.id, { color: e.target.value })} className="h-7 w-10 rounded bg-transparent" />
              <input className="input" value={t.nombre} onChange={(e) => f.updateTarjeta(t.id, { nombre: e.target.value })} />
              <select className="input w-36" value={t.tipo} onChange={(e) => f.updateTarjeta(t.id, { tipo: e.target.value })}>
                <option value="tarjeta">Tarjeta</option>
                <option value="persona">Persona</option>
              </select>
              <button className="btn-ghost" onClick={() => { if (confirm(`Archivar "${t.nombre}"? Dejará de ofrecerse para nuevas compras pero el historial se conserva.`)) f.archiveTarjeta(t.id); }}>Archivar</button>
            </div>
          ))}
          {activas.length === 0 && (
            <div className="text-sm text-slate-400">No tienes tarjetas activas. Agrega una abajo.</div>
          )}
        </div>

        <form onSubmit={add} className="mt-4 grid sm:grid-cols-[1fr_140px_auto_auto] gap-2">
          <input className="input" placeholder="Nueva tarjeta o persona…" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="tarjeta">Tarjeta</option>
            <option value="persona">Persona</option>
          </select>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-16 rounded bg-transparent" />
          <button className="btn-primary" type="submit">Agregar</button>
        </form>
      </section>

      {archivadas.length > 0 && (
        <section className="card p-5">
          <button
            className="w-full flex items-center justify-between text-base font-semibold mb-3"
            onClick={() => setMostrarArchivadas((v) => !v)}
            type="button"
          >
            <span>Archivadas ({archivadas.length})</span>
            <span className="text-slate-400 text-sm">{mostrarArchivadas ? '▲ ocultar' : '▼ mostrar'}</span>
          </button>
          {mostrarArchivadas && (
            <div className="grid gap-2">
              {archivadas.map((t) => (
                <div key={t.id} className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 opacity-75">
                  <span className="h-7 w-10 rounded" style={{ background: t.color || '#64748b' }} />
                  <span className="flex-1 text-slate-300">{t.nombre}<span className="text-slate-500 text-xs ml-2">{t.tipo === 'persona' ? 'persona' : 'tarjeta'}</span></span>
                  <button className="btn-ghost" onClick={() => f.unarchiveTarjeta(t.id)}>Restaurar</button>
                  <button className="btn-danger" onClick={() => { if (confirm(`Eliminar definitivamente "${t.nombre}" y TODO su historial de compras y pagos? Esta acción no se puede deshacer.`)) f.removeTarjeta(t.id); }}>Eliminar definitivo</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <PersonasAdmin f={f} />

      <section className="card p-5">
        <h2 className="text-base font-semibold mb-3">Datos</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-ghost" onClick={exportJson}>⬇ Exportar JSON</button>
          <label className="btn-ghost cursor-pointer">
            ⬆ Importar JSON
            <input type="file" accept="application/json" className="hidden" onChange={importJson} />
          </label>
          <button className="btn-danger" onClick={() => { if (confirm('Borrar TODOS los datos?')) f.resetAll(); }}>Reset completo</button>
          <span className="text-xs text-slate-400 ml-auto">Datos sincronizados en la nube</span>
        </div>
      </section>
    </div>
  );
}
