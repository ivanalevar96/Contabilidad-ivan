import { useState } from 'react';
import PersonasAdmin from './PersonasAdmin';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

const COLORS = ['#fb7185', '#f59e0b', '#a78bfa', '#34d399', '#22d3ee', '#f472b6', '#60a5fa', '#facc15', '#94a3b8'];

export default function TarjetasAdmin({ f }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('tarjeta');
  const [color, setColor] = useState(COLORS[0]);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const activas = f.state.tarjetas.filter((t) => !t.archivada);
  const archivadas = f.state.tarjetas.filter((t) => t.archivada);

  const add = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    f.addTarjeta({ nombre: nombre.trim(), tipo, color });
    setNombre(''); setColor(COLORS[(Math.random() * COLORS.length) | 0]);
    setShowAdd(false);
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
      try { f.importJson(JSON.parse(String(reader.result))); }
      catch { setDialog({ title: 'Error al importar', message: 'El archivo no es un JSON válido.', hideCancel: true }); }
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
            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input type="color" value={t.color || '#64748b'} onChange={(e) => f.updateTarjeta(t.id, { color: e.target.value })} className="h-7 w-10 rounded bg-transparent flex-shrink-0" />
                <input className="input flex-1 min-w-0" value={t.nombre} onChange={(e) => f.updateTarjeta(t.id, { nombre: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <select className="input flex-1 sm:w-32" value={t.tipo} onChange={(e) => f.updateTarjeta(t.id, { tipo: e.target.value })}>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="persona">Persona</option>
                </select>
                <button
                  className="btn-ghost flex-shrink-0"
                  onClick={() => setDialog({
                    title: 'Archivar tarjeta',
                    message: `"${t.nombre}" dejará de ofrecerse para nuevas compras.\nEl historial se conserva intacto.`,
                    confirmLabel: 'Archivar',
                    onConfirm: () => f.archiveTarjeta(t.id),
                  })}
                >Archivar</button>
              </div>
            </div>
          ))}
          {activas.length === 0 && (
            <div className="text-sm text-slate-400">No tienes tarjetas activas. Agrega una abajo.</div>
          )}
        </div>

        <button className="btn-primary mt-4 w-full" onClick={() => setShowAdd(true)}>+ Agregar tarjeta o persona</button>
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
                  <span className="h-7 w-10 rounded flex-shrink-0" style={{ background: t.color || '#64748b' }} />
                  <span className="flex-1 text-slate-300 min-w-0 truncate">{t.nombre}<span className="text-slate-500 text-xs ml-2">{t.tipo === 'persona' ? 'persona' : 'tarjeta'}</span></span>
                  <button className="btn-ghost flex-shrink-0" onClick={() => f.unarchiveTarjeta(t.id)}>Restaurar</button>
                  <button
                    className="btn-danger flex-shrink-0"
                    onClick={() => setDialog({
                      title: 'Eliminar definitivamente',
                      message: `Se eliminará "${t.nombre}" y TODO su historial de compras y pagos.\n\nEsta acción no se puede deshacer.`,
                      confirmLabel: 'Eliminar',
                      danger: true,
                      onConfirm: () => f.removeTarjeta(t.id),
                    })}
                  >Eliminar</button>
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
          <button
            className="btn-danger"
            onClick={() => setDialog({
              title: 'Reset completo',
              message: '¿Borrar TODOS los datos locales? Esta acción no se puede deshacer.',
              confirmLabel: 'Borrar todo',
              danger: true,
              onConfirm: () => f.resetAll(),
            })}
          >Reset completo</button>
          <span className="text-xs text-slate-400 ml-auto">Datos sincronizados en la nube</span>
        </div>
      </section>

      {/* Modal: nueva tarjeta o persona */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva tarjeta o persona" size="sm">
        <form onSubmit={add} className="p-5 space-y-4">
          <div>
            <div className="label mb-1.5">Nombre</div>
            <input className="input" placeholder="Ej: Visa, Banco Estado, Juan…" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </div>
          <div>
            <div className="label mb-1.5">Tipo</div>
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="tarjeta">Tarjeta / Cuenta</option>
              <option value="persona">Persona</option>
            </select>
          </div>
          <div>
            <div className="label mb-2">Color</div>
            <div className="flex flex-wrap gap-2 items-center">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded bg-transparent cursor-pointer" title="Color personalizado" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={!nombre.trim()}>Agregar</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        danger={dialog?.danger}
        hideCancel={dialog?.hideCancel}
        onConfirm={dialog?.onConfirm}
      />
    </div>
  );
}
