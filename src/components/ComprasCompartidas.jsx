import { useState } from 'react';
import { fmt } from '../utils/format';

export default function ComprasCompartidas({ compartidas, tarjetas, personas = [], updateCompra }) {
  const [editingId, setEditingId] = useState(null);

  if (!compartidas.length) {
    return (
      <div className="card p-4 text-sm text-slate-400">
        Sin compras compartidas este mes. Marca una compra como "compartida" al crearla.
      </div>
    );
  }

  const personaMap = Object.fromEntries(personas.map((p) => [p.id, p]));

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="bg-slate-900/60">
            <th className="th">Descripción</th>
            <th className="th">Tarjeta</th>
            <th className="th text-right">Monto</th>
            <th className="th text-center">Cuotas</th>
            <th className="th text-center"># Cuota</th>
            <th className="th">Dividida entre</th>
            <th className="th text-right">Valor cuota</th>
            <th className="th text-right">Mi parte</th>
            <th className="th" />
          </tr>
        </thead>
        <tbody>
          {compartidas.map((it, i) => {
            const tarj = tarjetas.find((t) => t.id === it.compra.tarjetaId);
            const personasIds = Array.isArray(it.compra.personasIds) ? it.compra.personasIds : [];
            const personasResueltas = personasIds.map((id) => personaMap[id]).filter(Boolean);
            const isEditing = editingId === it.compra.id;

            return (
              <>
                <tr key={it.compra.id + i} className={`hover:bg-slate-900/40 ${isEditing ? 'bg-slate-900/60' : ''}`}>
                  <td className="td font-medium">{it.compra.descripcion}</td>
                  <td className="td">
                    <span className="chip" style={{ background: (tarj?.color || '#64748b') + '33', color: tarj?.color || '#cbd5e1' }}>
                      {tarj?.nombre || '—'}
                    </span>
                  </td>
                  <td className="td text-right">{fmt(it.compra.valorConInteres || it.compra.valorCompra)}</td>
                  <td className="td text-center">{it.compra.esSubscripcion ? '∞' : it.compra.cantCuotas}</td>
                  <td className="td text-center">
                    {it.compra.esSubscripcion
                      ? <span className="chip bg-violet-500/15 text-violet-300">mes #{it.numCuota}</span>
                      : `${it.numCuota}/${it.compra.cantCuotas}`}
                  </td>
                  <td className="td">
                    {personasResueltas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {personasResueltas.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-slate-900"
                            style={{ background: p.color }}
                          >
                            {p.nombre}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">{it.compra.divididaEntre || '—'}</span>
                    )}
                  </td>
                  <td className="td text-right">{fmt(it.valorCuota)}</td>
                  <td className="td text-right font-semibold text-cyan-300">
                    {it.compra.valorPorPersona ? fmt(it.compra.valorPorPersona) : '—'}
                  </td>
                  <td className="td text-right">
                    {updateCompra && (
                      <button
                        className={`transition-colors text-sm ${isEditing ? 'text-cyan-300' : 'text-slate-400 hover:text-cyan-300'}`}
                        onClick={() => setEditingId(isEditing ? null : it.compra.id)}
                        title="Editar personas compartidas"
                      >✎</button>
                    )}
                  </td>
                </tr>

                {isEditing && (
                  <tr key={it.compra.id + '-edit'}>
                    <td colSpan={9} className="px-4 py-3 bg-slate-900/80 border-t border-b border-cyan-800/40">
                      <EditPanel
                        compra={it.compra}
                        personas={personas}
                        personaMap={personaMap}
                        onSave={(patch) => {
                          updateCompra(it.compra.id, patch);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditPanel({ compra, personas, personaMap, onSave, onCancel }) {
  const [personasIds, setPersonasIds] = useState(
    Array.isArray(compra.personasIds) ? compra.personasIds : []
  );
  const [valorPorPersona, setValorPorPersona] = useState(compra.valorPorPersona ?? '');

  const toggle = (id) =>
    setPersonasIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSave = () => {
    const nombres = personasIds
      .map((id) => personaMap[id]?.nombre)
      .filter(Boolean)
      .join(', ');
    onSave({
      personasIds,
      divididaEntre: nombres || compra.divididaEntre || '',
      valorPorPersona: valorPorPersona !== '' ? Number(valorPorPersona) : null,
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Selector de personas */}
      <div className="flex-1 min-w-[220px]">
        <div className="label mb-2">Dividida entre</div>
        {personas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {personas.map((p) => {
              const sel = personasIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border transition ${
                    sel
                      ? 'border-transparent text-slate-900'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                  style={sel ? { background: p.color } : {}}
                >
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: sel ? 'rgba(0,0,0,0.3)' : p.color }}
                  />
                  {p.nombre}
                  {sel && <span className="ml-0.5 opacity-70 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-slate-500">
            No hay personas configuradas. Ve a Configuración → Personas.
          </span>
        )}
      </div>

      {/* Mi parte */}
      <div className="min-w-[140px]">
        <div className="label mb-2">Mi parte ($ por persona)</div>
        <input
          type="number"
          className="input"
          value={valorPorPersona}
          onChange={(e) => setValorPorPersona(e.target.value)}
          placeholder="Opcional"
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pb-0.5">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn-primary" onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
}
