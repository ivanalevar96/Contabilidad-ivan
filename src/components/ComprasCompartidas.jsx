import { useState } from 'react';
import { fmt, monthLabel, fmtMonto, parseMonto } from '../utils/format';
import { miParteCompra } from '../store';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { IconWhatsApp, IconPlus, IconPencil, IconChevronDown } from './icons';

function buildWhatsAppMsg(persona, deuda, tarjetas) {
  const wave  = String.fromCodePoint(0x1F44B);
  const money = String.fromCodePoint(0x1F4B0);
  const check = String.fromCodePoint(0x2705);
  const clock = String.fromCodePoint(0x23F3);
  const pray  = String.fromCodePoint(0x1F64F);

  const tarjetaMap = Object.fromEntries(tarjetas.map((t) => [t.id, t]));
  const { itemsPorMes, totalDeuda, totalAbonado, pendiente } = deuda;

  const lines = [`Hola ${persona.nombre}! ${wave} Te detallo el saldo de gastos compartidos:\n`];
  for (const { mes, items, total } of itemsPorMes) {
    lines.push(`${monthLabel(mes)}:`);
    for (const it of items) {
      const tarj = tarjetaMap[it.compra.tarjetaId];
      const cuota = it.compra.esSubscripcion
        ? `mes #${it.numCuota}`
        : `cuota ${it.numCuota}/${it.compra.cantCuotas}`;
      lines.push(`• ${it.compra.descripcion} (${tarj?.nombre || '?'} · ${cuota}): ${fmt(it.valorPorPersona)}`);
    }
    lines.push(`Subtotal ${monthLabel(mes)}: ${fmt(total)}\n`);
  }

  lines.push(`${money} Total: ${fmt(totalDeuda)}`);
  if (totalAbonado > 0) {
    lines.push(`${check} Abonado: ${fmt(totalAbonado)}`);
  }
  lines.push(`${clock} Pendiente: ${fmt(pendiente)}`);
  lines.push(`\nGracias! ${pray}`);
  return lines.join('\n');
}

export default function ComprasCompartidas({ compartidas, deudas = [], tarjetas, personas = [], ym, updateCompra, addLiquidacion, removeLiquidacion }) {
  const [editingId, setEditingId] = useState(null);
  const [abonandoPersonaId, setAbonandoPersonaId] = useState(null);
  const [removingLiqId, setRemovingLiqId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const personaMap = Object.fromEntries(personas.map((p) => [p.id, p]));

  const resumenDeudas = deudas
    .map((d) => ({ ...d, persona: personaMap[d.personaId] }))
    .filter((x) => x.persona)
    .sort((a, b) => b.pendiente - a.pendiente);

  if (!compartidas.length && !resumenDeudas.length) {
    return (
      <div className="card p-6 text-sm text-text-3">
        Sin compras compartidas este mes. Marca una compra como "compartida" al crearla.
      </div>
    );
  }

  const totalDeudas = resumenDeudas.reduce((a, b) => a + b.totalDeuda, 0);
  const totalAbonado = resumenDeudas.reduce((a, b) => a + b.totalAbonado, 0);
  const totalPendiente = resumenDeudas.reduce((a, b) => a + b.pendiente, 0);

  return (
    <div className="flex flex-col gap-4">
      {resumenDeudas.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
            <h3 className="text-[13.5px] font-semibold">Saldo pendiente</h3>
            <div className="text-xs text-text-3 flex items-center gap-3 num">
              <span>Total <strong className="text-text">{fmt(totalDeudas)}</strong></span>
              {totalAbonado > 0 && <span>Abonado <strong className="text-positive">{fmt(totalAbonado)}</strong></span>}
              <span>Pendiente <strong className={totalPendiente > 0 ? 'text-text' : 'text-positive'}>{fmt(totalPendiente)}</strong></span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {resumenDeudas.map(({ persona, totalDeuda, totalAbonado: abonado, pendiente, itemsPorMes, liquidaciones }) => {
              const saldado = pendiente === 0 && abonado > 0;
              const expanded = expandedId === persona.id;
              return (
                <div key={persona.id} className={`py-2.5 first:pt-1 last:pb-0 ${saldado ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : persona.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
                      style={{ background: persona.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-black/25 flex-shrink-0" />
                      {persona.nombre}
                      <span className={`inline-flex transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        <IconChevronDown size={11} />
                      </span>
                    </button>

                    {abonado > 0 && !saldado && (
                      <div className="flex-1 min-w-0 hidden sm:block">
                        <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-positive transition-all"
                            style={{ width: `${Math.min(100, (abonado / totalDeuda) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {!(abonado > 0 && !saldado) && <div className="flex-1" />}

                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      {abonado > 0 && (
                        <div className="hidden sm:block text-xs text-text-3 num">
                          <span className="text-positive">{fmt(abonado)}</span>
                          <span className="text-text-3"> / {fmt(totalDeuda)}</span>
                        </div>
                      )}
                      <div className={`num text-sm font-semibold w-24 text-right ${saldado ? 'text-positive line-through' : 'text-text'}`}>
                        {fmt(pendiente)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {addLiquidacion && !saldado && (
                        <button
                          className="text-xs text-accent hover:opacity-80 transition-opacity whitespace-nowrap flex items-center gap-1"
                          onClick={() => setAbonandoPersonaId(persona.id)}
                        ><IconPlus size={13} /> pago</button>
                      )}
                      {persona.telefono && pendiente > 0 && (
                        <a
                          href={`https://wa.me/${persona.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(buildWhatsAppMsg(persona, { itemsPorMes, totalDeuda, totalAbonado: abonado, pendiente }, tarjetas))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-positive hover:opacity-80 transition-opacity"
                          title="Enviar por WhatsApp"
                        ><IconWhatsApp size={16} /></a>
                      )}
                      {saldado && (
                        <span className="text-xs text-positive">✓ saldado</span>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-2 ml-4 space-y-2 border-l border-border pl-3">
                      {itemsPorMes.map(({ mes, items, total }) => (
                        <div key={mes}>
                          <div className="text-xs font-semibold text-text-2 mb-0.5">{monthLabel(mes)} · {fmt(total)}</div>
                          {items.map((it, i) => (
                            <div key={it.compra.id + i} className="text-xs text-text-3 flex items-center justify-between gap-2">
                              <span className="truncate">{it.compra.descripcion}</span>
                              <span className="num flex-shrink-0">{fmt(it.valorPorPersona)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {liquidaciones.length > 0 && (
                    <div className="mt-1.5 ml-4 space-y-1">
                      {liquidaciones.map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-xs text-text-3 gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="text-text-3">└</span>
                            <span className="num text-text-2 font-medium">{fmt(l.monto)}</span>
                            <span>{l.fecha}</span>
                            <span className="text-text-3">({monthLabel(l.mesYM)})</span>
                            {l.nota && <span className="text-text-3 truncate max-w-[120px]">{l.nota}</span>}
                          </span>
                          {removeLiquidacion && (
                            <button
                              className="text-negative hover:opacity-80 transition-opacity flex-shrink-0"
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

      {compartidas.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
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
                  <tr key={it.compra.id + i} className="hover:bg-surface-2 transition-colors">
                    <td className="td font-medium">{it.compra.descripcion}</td>
                    <td className="td">
                      <span className="inline-flex items-center gap-2 text-text-2">
                        <span className="h-2 w-2 rounded-[3px]" style={{ background: tarj?.color || '#64748b' }} />
                        {tarj?.nombre || '—'}
                      </span>
                    </td>
                    <td className="td text-right num">{fmt(it.compra.valorConInteres || it.compra.valorCompra)}</td>
                    <td className="td text-center num">{it.compra.esSubscripcion ? '∞' : it.compra.cantCuotas}</td>
                    <td className="td text-center">
                      {it.compra.esSubscripcion
                        ? <span className="chip bg-accent-tint text-accent">mes #{it.numCuota}</span>
                        : <span className="num">{it.numCuota}/{it.compra.cantCuotas}</span>}
                    </td>
                    <td className="td">
                      {personasResueltas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {personasResueltas.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ background: p.color }}
                            >
                              {p.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-text-2 text-sm">{it.compra.divididaEntre || '—'}</span>
                      )}
                    </td>
                    <td className="td text-right num">{fmt(it.valorCuota)}</td>
                    <td className="td text-right num">
                      {it.compra.valorPorPersona ? fmt(it.compra.valorPorPersona) : '—'}
                    </td>
                    <td className="td text-right num font-semibold text-accent">
                      {fmt(miParteCompra(it.compra, it.valorCuota))}
                    </td>
                    <td className="td text-right">
                      {updateCompra && (
                        <button
                          className="text-text-3 hover:text-accent transition-colors"
                          onClick={() => setEditingId(it.compra.id)}
                          title="Editar personas compartidas"
                        ><IconPencil size={15} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
      )}

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
  const [monto, setMonto] = useState(sugerido > 0 ? fmtMonto(String(sugerido)) : '');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState('');

  const submit = () => {
    const m = parseMonto(monto);
    if (!m) return;
    onSave({ monto: m, fecha, nota: nota.trim() });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="label mb-1.5">Monto</div>
          <input type="text" inputMode="numeric" className="input" placeholder="$" value={monto} onChange={(e) => setMonto(fmtMonto(e.target.value))} autoFocus />
        </div>
        <div>
          <div className="label mb-1.5">Fecha</div>
          <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div>
        <div className="label mb-1.5">Nota (opcional)</div>
        <input type="text" className="input" placeholder="Ej: transferencia" value={nota} onChange={(e) => setNota(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn-primary" onClick={submit}>Guardar</button>
      </div>
    </div>
  );
}

function EditPanel({ compra, personas, personaMap, onSave, onCancel }) {
  const [personasIds, setPersonasIds] = useState(
    Array.isArray(compra.personasIds) ? compra.personasIds : []
  );
  const [valorPorPersona, setValorPorPersona] = useState(
    compra.valorPorPersona ? fmtMonto(String(compra.valorPorPersona)) : ''
  );

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
      valorPorPersona: valorPorPersona !== '' ? parseMonto(valorPorPersona) : null,
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
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
                      ? 'border-transparent text-white'
                      : 'border-border-strong text-text-2 hover:border-text-3'
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
          <span className="text-xs text-text-3">
            No hay personas configuradas. Ve a Tarjetas y cuentas → Personas.
          </span>
        )}
      </div>

      <div className="min-w-[160px]">
        <div className="label mb-2">Parte c/u (asociados)</div>
        <input
          type="text"
          inputMode="numeric"
          className="input"
          value={valorPorPersona}
          onChange={(e) => setValorPorPersona(fmtMonto(e.target.value))}
          placeholder="$ por persona"
        />
      </div>

      <div className="flex gap-2 pb-0.5">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn-primary" onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
}
