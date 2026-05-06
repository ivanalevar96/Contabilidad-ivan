import { useState } from 'react';

const COLORS = [
  '#fb7185', '#f97316', '#f59e0b', '#a3e635',
  '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
];

export default function PersonasAdmin({ f }) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);

  const personas = f.state.personas || [];

  const add = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    f.addPersona({ nombre: nombre.trim(), color });
    setNombre('');
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
  };

  const commitEdit = (p, nombre, color) => {
    f.updatePersona(p.id, { nombre, color });
    setEditingId(null);
  };

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold mb-1">Personas para compras compartidas</h2>
      <p className="text-xs text-slate-400 mb-4">
        Agrega las personas con quienes dividís gastos. Podrás seleccionarlas al registrar una compra compartida.
      </p>

      <div className="grid gap-2 mb-4">
        {personas.length === 0 && (
          <div className="text-sm text-slate-500 py-2">
            Sin personas todavía. Agrega una abajo.
          </div>
        )}
        {personas.map((p) => (
          <PersonaRow
            key={p.id}
            persona={p}
            isEditing={editingId === p.id}
            onEdit={() => startEdit(p)}
            onSave={(nombre, color) => commitEdit(p, nombre, color)}
            onCancel={() => setEditingId(null)}
            onRemove={() => {
              if (confirm(`Eliminar a "${p.nombre}"? Se quitará de las compras compartidas donde aparezca.`)) {
                f.removePersona(p.id);
              }
            }}
          />
        ))}
      </div>

      <form onSubmit={add} className="flex items-center gap-2 flex-wrap">
        <input
          className="input flex-1 min-w-[160px]"
          placeholder="Nombre de la persona…"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-6 w-6 rounded-full border-2 transition"
              style={{
                background: c,
                borderColor: color === c ? 'white' : 'transparent',
              }}
              title={c}
            />
          ))}
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap">+ Agregar persona</button>
      </form>
    </section>
  );
}

function PersonaRow({ persona, isEditing, onEdit, onSave, onCancel, onRemove }) {
  const [nombre, setNombre] = useState(persona.nombre);
  const [color, setColor] = useState(persona.color);

  const COLORS = [
    '#fb7185', '#f97316', '#f59e0b', '#a3e635',
    '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
  ];

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-slate-900/60 border border-cyan-700/50 rounded-lg px-3 py-2 flex-wrap">
        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: color }} />
        <input
          className="input flex-1 min-w-[120px]"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
        />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-5 w-5 rounded-full border-2 transition"
              style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }}
            />
          ))}
        </div>
        <button className="btn-primary text-xs py-1 px-2" onClick={() => onSave(nombre.trim() || persona.nombre, color)}>Guardar</button>
        <button className="btn-ghost text-xs py-1 px-2" onClick={onCancel}>Cancelar</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: persona.color }} />
      <span className="flex-1 text-slate-100 text-sm">{persona.nombre}</span>
      <button className="text-slate-400 hover:text-cyan-300 transition-colors text-sm" onClick={onEdit} title="Editar">✎</button>
      <button className="text-rose-400 hover:text-rose-300 transition-colors text-sm" onClick={onRemove} title="Eliminar">✕</button>
    </div>
  );
}
