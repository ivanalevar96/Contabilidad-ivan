import { useRef, useState } from 'react';
import PersonasAdmin from './PersonasAdmin';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import PhotoUpload from './PhotoUpload';
import { IconPlus, IconDownload, IconUpload, IconTrash, IconChevronDown } from './icons';

const COLORS = ['#0d9488', '#0f766e', '#c9a04a', '#64748b', '#94a3b8', '#fb7185', '#f59e0b', '#a78bfa', '#60a5fa'];

function avatarTextColor(hex) {
  const h = (hex || '#64748b').replace('#', '');
  if (h.length !== 6) return '#fff';
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6 ? '#1e293b' : '#fff';
}

/* Avatar de tarjeta: foto o cuadrado de color con inicial */
export function TarjetaAvatar({ tarjeta, size = 32 }) {
  if (tarjeta.fotoUrl) {
    return (
      <img
        src={tarjeta.fotoUrl}
        alt={tarjeta.nombre}
        className="rounded-[8px] object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const bg = tarjeta.color || '#64748b';
  return (
    <span
      className="rounded-[8px] flex-shrink-0 grid place-items-center font-semibold"
      style={{ width: size, height: size, background: bg, color: avatarTextColor(bg), fontSize: size * 0.38 }}
    >
      {tarjeta.nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}

/* Mini avatar clicable para subir/cambiar foto inline en la fila */
function InlinePhotoUpload({ tarjeta, onUpdate }) {
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        onUpdate({ fotoUrl: canvas.toDataURL('image/jpeg', 0.82) });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="relative flex-shrink-0 group" style={{ width: 32, height: 32 }}>
      <div
        className="rounded-[8px] overflow-hidden w-full h-full grid place-items-center cursor-pointer"
        style={{ background: tarjeta.fotoUrl ? undefined : (tarjeta.color || '#64748b') }}
        onClick={() => inputRef.current?.click()}
        title="Cambiar foto"
      >
        {tarjeta.fotoUrl ? (
          <img src={tarjeta.fotoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-semibold text-[12px] select-none" style={{ color: avatarTextColor(tarjeta.color) }}>
            {tarjeta.nombre.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0 rounded-[8px] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
          <span className="text-white text-[9px] font-bold leading-none text-center px-0.5">
            {tarjeta.fotoUrl ? 'cambiar' : 'foto'}
          </span>
        </div>
      </div>
      {tarjeta.fotoUrl && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUpdate({ fotoUrl: null }); }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-negative text-white text-[9px] font-bold grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity z-10 leading-none"
          title="Quitar foto"
        >×</button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function TarjetasAdmin({ f }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('tarjeta');
  const [color, setColor] = useState(COLORS[0]);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const activas = f.state.tarjetas.filter((t) => !t.archivada);
  const archivadas = f.state.tarjetas.filter((t) => t.archivada);

  const add = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    f.addTarjeta({ nombre: nombre.trim(), tipo, color, fotoUrl: fotoUrl || null });
    setNombre('');
    setColor(COLORS[(Math.random() * COLORS.length) | 0]);
    setFotoUrl(null);
    setShowAdd(false);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(f.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finanzas-${new Date().toISOString().slice(0, 10)}.json`;
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
    <div className="flex flex-col gap-[var(--section-gap)]">
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[13.5px] font-semibold">Tarjetas y cuentas</div>
            <div className="text-xs text-text-3 mt-0.5">Medios de pago activos</div>
          </div>
          <button className="btn-primary !h-9 !px-3.5" onClick={() => { setNombre(''); setFotoUrl(null); setShowAdd(true); }}>
            <IconPlus size={15} /> Agregar
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {activas.map((t) => (
            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-surface-2 border border-border rounded-[11px] px-3.5 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar clicable para cambiar foto */}
                <InlinePhotoUpload tarjeta={t} onUpdate={(patch) => f.updateTarjeta(t.id, patch)} />
                <input type="color" value={t.color || '#64748b'} onChange={(e) => f.updateTarjeta(t.id, { color: e.target.value })} className="h-[22px] w-[30px] rounded-[5px] bg-transparent flex-shrink-0 cursor-pointer border-0 p-0" />
                <input className="input flex-1 min-w-0 !bg-surface" value={t.nombre} onChange={(e) => f.updateTarjeta(t.id, { nombre: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <select className="input flex-1 sm:w-32 !bg-surface" value={t.tipo} onChange={(e) => f.updateTarjeta(t.id, { tipo: e.target.value })}>
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
            <div className="text-sm text-text-3">No tienes tarjetas activas. Agrega una arriba.</div>
          )}
        </div>
      </section>

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
              {archivadas.map((t) => (
                <div key={t.id} className="flex items-center gap-3 bg-surface-2 border border-border rounded-[11px] px-3.5 py-3 opacity-75">
                  <TarjetaAvatar tarjeta={t} size={28} />
                  <span className="flex-1 text-text-2 min-w-0 truncate">
                    {t.nombre}
                    <span className="text-text-3 text-xs ml-2">{t.tipo === 'persona' ? 'persona' : 'tarjeta'}</span>
                  </span>
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

      <section className="card p-6">
        <div className="text-[13.5px] font-semibold mb-1">Datos</div>
        <div className="text-xs text-text-3 mb-4">Respaldo y sincronización en la nube</div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button className="btn-ghost" onClick={exportJson}><IconDownload size={15} /> Exportar JSON</button>
          <label className="btn-ghost cursor-pointer">
            <IconUpload size={15} /> Importar JSON
            <input type="file" accept="application/json" className="hidden" onChange={importJson} />
          </label>
          <div className="flex-1" />
          <button
            className="btn-danger"
            onClick={() => setDialog({
              title: 'Reset completo',
              message: '¿Borrar TODOS los datos locales? Esta acción no se puede deshacer.',
              confirmLabel: 'Borrar todo',
              danger: true,
              onConfirm: () => f.resetAll(),
            })}
          ><IconTrash size={15} /> Reset completo</button>
        </div>
      </section>

      {/* Modal: nueva tarjeta */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva tarjeta o cuenta" size="sm">
        <form onSubmit={add} className="p-5 space-y-4">
          <PhotoUpload
            value={fotoUrl}
            onChange={setFotoUrl}
            size={64}
            initials={nombre.trim().slice(0, 1).toUpperCase() || '?'}
            color={color}
          />
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
                  style={{ background: c, borderColor: color === c ? 'var(--text)' : 'transparent' }} />
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
