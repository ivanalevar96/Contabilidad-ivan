import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { IconPlus, IconPencil } from './icons';

const COLORS = [
  '#0d9488', '#0f766e', '#c9a04a', '#64748b',
  '#94a3b8', '#fb7185', '#f59e0b', '#a78bfa', '#60a5fa',
];

const PREFIX = '+569';
const PHONE_RX = /^\+569\d{8}$/;

function sanitizeNombre(v) {
  return v.replace(/\s{2,}/g, ' ').slice(0, 50);
}

function handlePhoneInput(raw) {
  if (!raw.startsWith(PREFIX)) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    return PREFIX + digits;
  }
  const after = raw.slice(PREFIX.length).replace(/\D/g, '').slice(0, 8);
  return PREFIX + after;
}

function phoneValue(tel) {
  return (!tel || tel === PREFIX) ? null : tel;
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
          style={{ background: c, borderColor: value === c ? 'var(--text)' : 'transparent' }}
        />
      ))}
    </div>
  );
}

export default function PersonasAdmin({ f }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [telefono, setTelefono] = useState(PREFIX);
  const [nombreError, setNombreError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');

  const personas = f.state.personas || [];

  const resetAdd = () => {
    setNombre('');
    setTelefono(PREFIX);
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setNombreError('');
    setTelefonoError('');
  };

  const handleAdd = (e) => {
    e.preventDefault();
    let valid = true;

    const nombreTrim = nombre.trim();
    if (nombreTrim.length < 2) {
      setNombreError('Mínimo 2 caracteres.');
      valid = false;
    }

    const tel = phoneValue(telefono);
    if (tel && !PHONE_RX.test(tel)) {
      setTelefonoError('Completa los 8 dígitos (ej: +569 1234 5678).');
      valid = false;
    }

    if (!valid) return;

    f.addPersona({ nombre: nombreTrim, color, telefono: tel });
    resetAdd();
    setShowAdd(false);
    toast.success(`${nombreTrim} agregado/a`);
  };

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[13.5px] font-semibold">Personas para compras compartidas</h2>
        <button className="btn-primary !h-9 !px-3.5" onClick={() => { resetAdd(); setShowAdd(true); }}><IconPlus size={15} /> Agregar</button>
      </div>
      <p className="text-xs text-text-3 mb-4">
        Agrega las personas con quienes dividís gastos. Podrás seleccionarlas al registrar una compra compartida.
      </p>

      <div className="flex flex-col gap-2">
        {personas.length === 0 && (
          <div className="text-sm text-text-3 py-2">Sin personas todavía.</div>
        )}
        {personas.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-surface-2 border border-border rounded-[11px] px-3.5 py-3">
            <span className="h-[30px] w-[30px] rounded-full flex-shrink-0 grid place-items-center text-[12px] font-semibold text-white" style={{ background: p.color }}>
              {p.nombre.slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-text text-[13.5px] font-medium">{p.nombre}</div>
              {p.telefono && <div className="text-xs text-text-3">{p.telefono}</div>}
            </div>
            <button className="text-text-3 hover:text-accent transition-colors" onClick={() => setEditingPersona(p)} title="Editar"><IconPencil size={15} /></button>
            <button className="text-text-3 hover:text-negative transition-colors" onClick={() => setRemoveConfirm(p)} title="Eliminar">✕</button>
          </div>
        ))}
      </div>

      {/* Modal: nueva persona */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nueva persona" size="sm">
        <form onSubmit={handleAdd} className="p-5 space-y-4">
          <div>
            <div className="label mb-1.5">Nombre</div>
            <input
              className={`input ${nombreError ? '!border-negative' : ''}`}
              placeholder="Ej: Cynthia, Juan…"
              value={nombre}
              onChange={(e) => { setNombre(sanitizeNombre(e.target.value)); setNombreError(''); }}
              autoFocus
            />
            {nombreError && <p className="text-xs text-negative mt-1">{nombreError}</p>}
          </div>
          <div>
            <div className="label mb-1.5">Teléfono <span className="text-text-3 normal-case font-normal">(opcional)</span></div>
            <input
              type="tel"
              className={`input ${telefonoError ? '!border-negative' : ''}`}
              value={telefono}
              onChange={(e) => { setTelefono(handlePhoneInput(e.target.value)); setTelefonoError(''); }}
            />
            {telefonoError
              ? <p className="text-xs text-negative mt-1">{telefonoError}</p>
              : <p className="text-xs text-text-3 mt-1">Ingresa los 8 dígitos después del prefijo +569</p>
            }
          </div>
          <div>
            <div className="label mb-2">Color</div>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Agregar</button>
          </div>
        </form>
      </Modal>

      {/* Modal: editar persona */}
      <EditPersonaModal
        open={!!editingPersona}
        persona={editingPersona}
        onClose={() => setEditingPersona(null)}
        onSave={(n, c, t) => {
          f.updatePersona(editingPersona.id, { nombre: n, color: c, telefono: t });
          setEditingPersona(null);
          toast.success(`${n} actualizado/a`);
        }}
      />

      {/* Confirm: eliminar persona */}
      <ConfirmModal
        open={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Eliminar persona"
        message={`Se eliminará "${removeConfirm?.nombre}" y se quitará de las compras compartidas donde aparezca.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          const nombre = removeConfirm.nombre;
          f.removePersona(removeConfirm.id);
          toast.success(`${nombre} eliminado/a`);
        }}
      />
    </section>
  );
}

function EditPersonaModal({ open, persona, onClose, onSave }) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [telefono, setTelefono] = useState(PREFIX);
  const [nombreError, setNombreError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');

  useEffect(() => {
    if (open && persona) {
      setNombre(persona.nombre);
      setColor(persona.color || COLORS[0]);
      setTelefono(persona.telefono || PREFIX);
      setNombreError('');
      setTelefonoError('');
    }
  }, [open, persona]);

  const handleSave = (e) => {
    e.preventDefault();
    let valid = true;

    const nombreTrim = nombre.trim();
    if (nombreTrim.length < 2) {
      setNombreError('Mínimo 2 caracteres.');
      valid = false;
    }

    const tel = phoneValue(telefono);
    if (tel && !PHONE_RX.test(tel)) {
      setTelefonoError('Completa los 8 dígitos (ej: +569 1234 5678).');
      valid = false;
    }

    if (!valid) return;
    onSave(nombreTrim, color, tel);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar persona" size="sm">
      <form onSubmit={handleSave} className="p-5 space-y-4">
        <div>
          <div className="label mb-1.5">Nombre</div>
          <input
            className={`input ${nombreError ? '!border-negative' : ''}`}
            value={nombre}
            onChange={(e) => { setNombre(sanitizeNombre(e.target.value)); setNombreError(''); }}
            autoFocus
          />
          {nombreError && <p className="text-xs text-negative mt-1">{nombreError}</p>}
        </div>
        <div>
          <div className="label mb-1.5">Teléfono <span className="text-text-3 normal-case font-normal">(opcional)</span></div>
          <input
            type="tel"
            className={`input ${telefonoError ? '!border-negative' : ''}`}
            value={telefono}
            onChange={(e) => { setTelefono(handlePhoneInput(e.target.value)); setTelefonoError(''); }}
          />
          {telefonoError
            ? <p className="text-xs text-negative mt-1">{telefonoError}</p>
            : <p className="text-xs text-text-3 mt-1">Ingresa los 8 dígitos después del prefijo +569</p>
          }
        </div>
        <div>
          <div className="label mb-2">Color</div>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
