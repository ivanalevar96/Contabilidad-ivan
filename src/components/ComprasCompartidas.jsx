import { useState } from 'react';
import { fmt, monthLabel } from '../utils/format';
import { miParteCompra } from '../store';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

function buildWhatsAppMsg(persona, pendiente, abonado, compartidas, tarjetas, ym) {
  const tarjetaMap = Object.fromEntries(tarjetas.map((t) => [t.id, t]));
  const items = compartidas.filter((it) => {
    const vpp = Number(it.compra.valorPorPersona);
    return Number.isFinite(vpp) && vpp > 0 &&
      Array.isArray(it.compra.personasIds) && it.compra.personasIds.includes(persona.id);
  });

  const lines = [`Hola ${persona.nombre}! 👋 Te detallo los gastos compartidos de ${monthLabel(ym)}:\n`];
  for (const it of items) {
    const tarj = tarjetaMap[it.compra.tarjetaId];
    const cuota = it.compra.esSubscripcion
      ? `mes #${it.numCuota}`
      : `cuota ${it.numCuota}/${it.compra.cantCuotas}`;
    lines.push(`• ${it.compra.descripcion} (${tarj?.nombre || '?'} · ${cuota}): ${fmt(it.compra.valorPorPersona)}`);
  }

  lines.push(`\n💰 Total: ${fmt(pendiente + abonado)}`);
  if (abonado > 0) {
    lines.push(`✅ Abonado: ${fmt(abonado)}`);
    lines.push(`⏳ Pendiente: ${fmt(pendiente)}`);
  }
  lines.push(`\nGracias! 🙏`);
  return lines.join('\n');
}

export default function ComprasCompartidas({ compartidas, tarjetas, personas = [], liquidaciones = [], ym, updateCompra, addLiquidacion, removeLiquidacion }) {
  const [editingId, setEditingId] = useState(null);
  const [abonandoPersonaId, setAbonandoPersonaId] = useState(null);
  const [removingLiqId, setRemovingLiqId] = useState(null);

  if (!compartidas.length) {
    return (
      <div className="card p-4 text-sm text-slate-400">
        Sin compras compartidas este mes. Marca una compra como "compartida" al crearla.
      </div>
    );
  }

  const personaMap = Object.fromEntries(personas.map((p) => [p.id, p]));

  // Resumen: total que cada persona me debe este mes (suma de valorPorPersona en cada compra).
  // Compras sin valorPorPersona se ignoran del resumen (no hay monto explícito).
  const deudaPorPersona = new Map();
  for (const it of compartidas) {
    const vpp = Number(it.compra.valorPorPersona);
    if (!Number.isFinite(vpp) || vpp <= 0) continue;
    const ids = Array.isArray(it.compra.personasIds) ? it.compra.personasIds : [];
    for (const pid of ids) {
      deudaPorPersona.set(pid, (deudaPorPersona.get(pid) || 0) + vpp);
    }
  }
  // Cobros del mes por persona (mismo ym)
  const liquidadoPorPersona = new Map();
  const liquidacionesDelMes = (liquidaciones || []).filter((l) => l.mesYM === ym);
  for (const l of liquidacionesDelMes) {
    liquidadoPorPersona.set(l.personaId, (liquidadoPorPersona.get(l.personaId) || 0) + (Number(l.monto) || 0));
  }

  const resumenDeudas = Array.from(deudaPorPersona.entries())
    .map(([id, total]) => ({
      persona: personaMap[id],
      total,
      abonado: liquidadoPorPersona.get(id) || 0,
    }))
    .filter((x) => x.persona)
    .map((x) => ({ ...x, pendiente: Math.max(0, x.total - x.abonado) }))
    .sort((a, b) => b.pendiente - a.pendiente);
  const totalDeudas = resumenDeudas.reduce((a, b) => a + b.total, 0);
  const totalAbonado = resumenDeudas.reduce((a, b) => a + b.abonado, 0);
  const totalPendiente = resumenDeudas.reduce((a, b) => a + b.pendiente, 0);

  return (
    <div className="space-y-4">
      {resumenDeudas.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Te deben este mes</h3>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span>Total <strong className="text-slate-200">{fmt(totalDeudas)}</strong></span>
              {totalAbonado > 0 && <span>Abonado <strong className="text-emerald-300">{fmt(totalAbonado)}</strong></span>}
              <span>Pendiente <strong className={totalPendiente > 0 ? 'text-amber-300' : 'text-emerald-300'}>{fmt(totalPendiente)}</strong></span>
            </div>
          </div>
              <div className="divide-y divide-slate-800/60">
            {resumenDeudas.map(({ persona, total, abonado, pendiente }) => {
              const liqsDePersona = liquidacionesDelMes.filter((l) => l.personaId === persona.id);
              const saldado = pendiente === 0 && abonado > 0;
              return (
                <div key={persona.id} className={`py-2.5 first:pt-1 last:pb-0 ${saldado ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Nombre */}
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-slate-900 flex-shrink-0"
                      style={{ background: persona.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-black/25 flex-shrink-0" />
                      {persona.nombre}
                    </span>

                    {/* Barra de progreso si hay abono parcial */}
                    {abonado > 0 && !saldado && (
                      <div className="flex-1 min-w-0 hidden sm:block">
                        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500/60 transition-all"
                            style={{ width: `${Math.min(100, (abonado / total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {!(abonado > 0 && !saldado) && <div className="flex-1" />}

                    {/* Montos */}
                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      {abonado > 0 && (
                        <div className="hidden sm:block text-xs text-slate-500 tabular-nums">
                          <span className="text-emerald-400">{fmt(abonado)}</span>
                          <span className="text-slate-600"> / {fmt(total)}</span>
                        </div>
                      )}
                      <div className={`text-sm font-semibold tabular-nums w-24 text-right ${saldado ? 'text-emerald-300 line-through' : pendiente > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {fmt(pendiente)}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {addLiquidacion && !saldado && (
                        <button
                          className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors whitespace-nowrap"
                          onClick={() => setAbonandoPersonaId(persona.id)}
                        >+ pago</button>
                      )}
                      {persona.telefono && pendiente > 0 && (
                        <a
                          href={`https://wa.me/${persona.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(buildWhatsAppMsg(persona, pendiente, abonado, compartidas, tarjetas, ym))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Enviar por WhatsApp"
                        >💬</a>
                      )}
                      {saldado && (
                        <span className="text-xs text-emerald-400">✓ saldado</span>
                      )}
                    </div>
                  </div>

                  {/* Historial de pagos */}
                  {liqsDePersona.length > 0 && (
                    <div className="mt-1.5 ml-4 space-y-1">
                      {liqsDePersona.map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-xs text-slate-500 gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-600">└</span>
                            <span className="text-slate-300 font-medium tabular-nums">{fmt(l.monto)}</span>
                            <span>{l.fecha}</span>
                            {l.nota && <span className="text-slate-600 truncate max-w-[120px]">{l.nota}</span>}
                          </span>
                          {removeLiquidacion && (
                            <button
                              className="text-rose-500 hover:text-rose-400 transition-colors flex-shrink-0"
                              onClick={() => setRemovingLiqId(l.id)}
                            >✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal: registrar pago */}
          {(() => {
            const target = resumenDeudas.find((x) => x.persona.id === abonandoPersonaId);
            return (
              <Modal
                open={!!abonandoPersonaId}
                onClose={() => setAbonandoPersonaId(null)}
                title={target ? `Registrar pago · ${target.persona.nombre}` : 'Registrar pago'}
              >
                <div className="p-4">
                  {target && (
                    <AbonarForm
                      sugerido={target.pendiente}
                      onSave={(payload) => {
                        addLiquidacion({ personaId: abonandoPersonaId, mesYM: ym, ...payload });
                        setAbonandoPersonaId(null);
                      }}
                      onCancel={() => setAbonandoPersonaId(null)}
                    />
                  )}
                </div>
              </Modal>
            );
          })()}
        </div>
      )}

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
            <th className="th text-right">Parte c/u</th>
            <th className="th text-right">Mi parte</th>
            <th className="th" />
          </tr>
        </thead>
        <tbody>
          {compartidas.map((it, i) => {
            const tarj = tarjetas.find((t) => t.id === it.compra.tarjetaId);
            const personasIds = Array.isArray(it.compra.personasIds) ? it.compra.personasIds : [];
            const personasResueltas = personasIds.map((id) => personaMap[id]).filter(Boolean);

            return (
              <tr key={it.compra.id + i} className="hover:bg-slate-900/40">
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
                <td className="td text-right">
                  {it.compra.valorPorPersona ? fmt(it.compra.valorPorPersona) : '—'}
                </td>
                <td className="td text-right font-semibold text-cyan-300">
                  {fmt(miParteCompra(it.compra, it.valorCuota))}
                </td>
                <td className="td text-right">
                  {updateCompra && (
                    <button
                      className="text-slate-400 hover:text-cyan-300 transition-colors text-sm"
                      onClick={() => setEditingId(it.compra.id)}
                      title="Editar personas compartidas"
                    >✎</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal: editar personas de compra compartida */}
      {(() => {
        const target = compartidas.find((it) => it.compra.id === editingId);
        return (
          <Modal
            open={!!editingId}
            onClose={() => setEditingId(null)}
            title={target ? `Editar compartida · ${target.compra.descripcion}` : 'Editar compartida'}
          >
            <div className="p-4">
              {target && (
                <EditPanel
                  compra={target.compra}
                  personas={personas}
                  personaMap={personaMap}
                  onSave={(patch) => {
                    updateCompra(target.compra.id, patch);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          </Modal>
        );
      })()}
    </div>

      <ConfirmModal
        open={!!removingLiqId}
        onClose={() => setRemovingLiqId(null)}
        title="Eliminar cobro"
        message="¿Eliminar este registro de pago? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => removeLiquidacion(removingLiqId)}
      />
    </div>
  );
}

function AbonarForm({ sugerido, onSave, onCancel }) {
  const [monto, setMonto] = useState(sugerido > 0 ? String(sugerido) : '');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState('');

  const submit = () => {
    const m = Number(monto);
    if (!Number.isFinite(m) || m <= 0) return;
    onSave({ monto: m, fecha, nota: nota.trim() });
  };

  return (
    <div className="mt-1 space-y-1.5 bg-slate-900/80 rounded p-2 border border-slate-700/50">
      <div className="grid grid-cols-2 gap-1.5">
        <input
          type="number"
          className="input text-xs py-1"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          autoFocus
        />
        <input
          type="date"
          className="input text-xs py-1"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <input
        type="text"
        className="input text-xs py-1 w-full"
        placeholder="Nota (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
      <div className="flex gap-1.5 justify-end">
        <button type="button" className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1" onClick={onCancel}>Cancelar</button>
        <button type="button" className="text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium px-2 py-1 rounded" onClick={submit}>Guardar</button>
      </div>
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

      {/* Parte de cada persona asociada */}
      <div className="min-w-[160px]">
        <div className="label mb-2">Parte c/u (asociados)</div>
        <input
          type="number"
          className="input"
          value={valorPorPersona}
          onChange={(e) => setValorPorPersona(e.target.value)}
          placeholder="$ por persona"
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
