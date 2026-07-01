import { useState } from 'react';
import { fmt, monthLabel, fmtMonto, parseMonto } from '../utils/format';
import { PersonaAvatar } from './PersonasAdmin';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { IconWhatsApp, IconPlus, IconPencil, IconChart } from './icons';

function buildWhatsAppMsg(persona, deuda, tarjetas, ym) {
  const wave  = String.fromCodePoint(0x1F44B);
  const money = String.fromCodePoint(0x1F4B0);
  const check = String.fromCodePoint(0x2705);
  const clock = String.fromCodePoint(0x23F3);
  const pray  = String.fromCodePoint(0x1F64F);

  const tarjetaMap = Object.fromEntries(tarjetas.map((t) => [t.id, t]));
  const { itemsPorMes, totalDeuda, totalAbonado, pendiente } = deuda;
  const anteriores = itemsPorMes.filter((m) => m.mes < ym);
  const actual = itemsPorMes.find((m) => m.mes === ym);

  const lines = [`Hola ${persona.nombre}! ${wave} Te detallo el saldo de gastos compartidos:\n`];

  if (anteriores.length) {
    lines.push('Pendiente de meses anteriores:');
    for (const { mes, total } of anteriores) {
      lines.push(`• ${monthLabel(mes)}: ${fmt(total)}`);
    }
    lines.push('');
  }

  if (actual) {
    lines.push('Mes actual:');
    lines.push(`${monthLabel(ym)}:`);
    for (const it of actual.items) {
      const tarj = tarjetaMap[it.compra.tarjetaId];
      const cuota = it.compra.esSubscripcion
        ? `mes #${it.numCuota}`
        : `cuota ${it.numCuota}/${it.compra.cantCuotas}`;
      lines.push(`• ${it.compra.descripcion} (${tarj?.nombre || '?'} · ${cuota}): ${fmt(it.valorPorPersona)}`);
    }
    lines.push(`Subtotal ${monthLabel(ym)}: ${fmt(actual.total)}\n`);
  }

  lines.push(`${money} Total: ${fmt(totalDeuda)}`);
  if (totalAbonado > 0) {
    lines.push(`${check} Abonado: ${fmt(totalAbonado)}`);
  }
  lines.push(`${clock} Pendiente: ${fmt(pendiente)}`);
  lines.push(`\nGracias! ${pray}`);
  return lines.join('\n');
}

export default function ComprasCompartidas({ deudas = [], tarjetas, personas = [], ym, updateCompra, addLiquidacion, removeLiquidacion }) {
  const [editingId, setEditingId] = useState(null);
  const [abonandoPersonaId, setAbonandoPersonaId] = useState(null);
  const [removingLiqId, setRemovingLiqId] = useState(null);
  const [detallePersonaId, setDetallePersonaId] = useState(null);
  const [previewPersonaId, setPreviewPersonaId] = useState(null);

  const personaMap = Object.fromEntries(personas.map((p) => [p.id, p]));

  const resumenDeudas = deudas
    .map((d) => ({ ...d, persona: personaMap[d.personaId] }))
    .filter((x) => x.persona)
    .sort((a, b) => b.pendiente - a.pendiente);

  if (!resumenDeudas.length) {
    return (
      <div className="card p-6 text-sm text-text-3">
        Sin compras compartidas. Marca una compra como "compartida" al crearla.
      </div>
    );
  }

  const totalDeudas = resumenDeudas.reduce((a, b) => a + b.totalDeuda, 0);
  const totalAbonadoGlobal = resumenDeudas.reduce((a, b) => a + b.totalAbonado, 0);
  const totalPendiente = resumenDeudas.reduce((a, b) => a + b.pendiente, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-text-3 num px-1">
        <span>{resumenDeudas.length} persona{resumenDeudas.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-3">
          <span>Total <strong className="text-text">{fmt(totalDeudas)}</strong></span>
          {totalAbonadoGlobal > 0 && <span>Abonado <strong className="text-positive">{fmt(totalAbonadoGlobal)}</strong></span>}
          <span>Pendiente <strong className={totalPendiente > 0 ? 'text-text' : 'text-positive'}>{fmt(totalPendiente)}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {resumenDeudas.map(({ persona, totalDeuda, totalAbonado: abonado, pendiente, itemsPorMes, liquidaciones }) => {
          const saldado = pendiente === 0 && abonado > 0;
          return (
            <div key={persona.id} className={`card p-5 flex flex-col gap-4 ${saldado ? 'opacity-70' : ''}`}>
              <div className="flex items-center gap-3">
                <PersonaAvatar persona={persona} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14.5px] truncate">{persona.nombre}</div>
                  {persona.telefono && <div className="text-xs text-text-3">{persona.telefono}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10.5px] text-text-3 uppercase tracking-wide">Pendiente</div>
                  <div className={`num text-lg font-bold ${saldado ? 'text-positive line-through' : 'text-text'}`}>
                    {fmt(pendiente)}
                  </div>
                </div>
              </div>

              {!saldado && totalDeuda > 0 && (
                <div>
                  <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-positive transition-all"
                      style={{ width: `${Math.min(100, (abonado / totalDeuda) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-text-3 num mt-1">
                    <span className={abonado > 0 ? 'text-positive' : ''}>{fmt(abonado)} abonado</span>
                    <span>de {fmt(totalDeuda)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {addLiquidacion && !saldado && (
                  <button
                    className="btn-ghost !h-8 !px-3 text-xs gap-1"
                    onClick={() => setAbonandoPersonaId(persona.id)}
                  ><IconPlus size={13} /> Registrar pago</button>
                )}
                <button
                  className="btn-ghost !h-8 !px-3 text-xs gap-1"
                  onClick={() => setDetallePersonaId(persona.id)}
                ><IconChart size={13} /> Ver detalle</button>
                {persona.telefono && pendiente > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewPersonaId(persona.id)}
                    className="btn-ghost !h-8 !px-3 text-xs gap-1"
                  ><IconWhatsApp size={13} /> Enviar mensaje</button>
                )}
                {saldado && <span className="text-xs text-positive">✓ saldado</span>}
              </div>
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

      {(() => {
        const target = resumenDeudas
          .flatMap((r) => r.itemsPorMes.flatMap((m) => m.items))
          .find((it) => it.compra.id === editingId);
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

      {(() => {
        const target = resumenDeudas.find((x) => x.persona.id === detallePersonaId);
        return (
          <Modal
            open={!!detallePersonaId}
            onClose={() => setDetallePersonaId(null)}
            title={target ? `Detalle · ${target.persona.nombre}` : 'Detalle'}
          >
            <div className="p-4">
              {target && (
                <DetallePersona
                  deuda={target}
                  updateCompra={updateCompra}
                  removeLiquidacion={removeLiquidacion}
                  onEditCompra={(id) => { setDetallePersonaId(null); setEditingId(id); }}
                  onRemoveLiq={(id) => setRemovingLiqId(id)}
                />
              )}
            </div>
          </Modal>
        );
      })()}

      {(() => {
        const target = resumenDeudas.find((x) => x.persona.id === previewPersonaId);
        if (!target) {
          return (
            <Modal open={!!previewPersonaId} onClose={() => setPreviewPersonaId(null)} title="Previsualizar mensaje" />
          );
        }
        const { persona, totalDeuda, totalAbonado: abonado, pendiente, itemsPorMes } = target;
        const mensaje = buildWhatsAppMsg(persona, { itemsPorMes, totalDeuda, totalAbonado: abonado, pendiente }, tarjetas, ym);
        const waHref = `https://wa.me/${persona.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
        return (
          <Modal
            open={!!previewPersonaId}
            onClose={() => setPreviewPersonaId(null)}
            title={`Previsualizar mensaje · ${persona.nombre}`}
          >
            <div className="p-4 space-y-4">
              <div
                className="rounded-[10px] p-4 text-[13.5px] whitespace-pre-wrap leading-relaxed"
                style={{ background: 'color-mix(in srgb, var(--positive) 10%, transparent)' }}
              >
                {mensaje}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-ghost" onClick={() => setPreviewPersonaId(null)}>Cancelar</button>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPreviewPersonaId(null)}
                  className="btn-primary gap-1.5"
                ><IconWhatsApp size={15} /> Enviar mensaje</a>
              </div>
            </div>
          </Modal>
        );
      })()}

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

function DetallePersona({ deuda, updateCompra, onEditCompra, onRemoveLiq }) {
  const { itemsPorMes, liquidaciones } = deuda;
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="space-y-3">
        {itemsPorMes.map(({ mes, items, total }) => (
          <div key={mes}>
            <div className="text-[11px] font-semibold text-text-2 uppercase tracking-wide mb-1">
              {monthLabel(mes)} <span className="text-text-3 normal-case font-normal">· {fmt(total)}</span>
            </div>
            <div className="space-y-1">
              {items.map((it, i) => (
                <div key={it.compra.id + i} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate text-text-2">
                    {it.compra.descripcion}
                    <span className="text-text-3">
                      {' '}· {it.compra.esSubscripcion ? `mes #${it.numCuota}` : `${it.numCuota}/${it.compra.cantCuotas}`}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="num">{fmt(it.valorPorPersona)}</span>
                    {updateCompra && (
                      <button
                        className="text-text-3 hover:text-accent transition-colors"
                        onClick={() => onEditCompra(it.compra.id)}
                        title="Editar compartida"
                      ><IconPencil size={13} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {liquidaciones.length > 0 && (
        <div className="border-t border-border pt-3.5">
          <div className="text-[11px] font-semibold text-text-2 uppercase tracking-wide mb-1.5">Pagos registrados</div>
          <div className="space-y-1">
            {liquidaciones.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs text-text-3 gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="num text-text-2 font-medium flex-shrink-0">{fmt(l.monto)}</span>
                  <span className="flex-shrink-0">{l.fecha}</span>
                  <span className="flex-shrink-0">({monthLabel(l.mesYM)})</span>
                  {l.nota && <span className="truncate">{l.nota}</span>}
                </span>
                {onRemoveLiq && (
                  <button
                    className="text-negative hover:opacity-80 transition-opacity flex-shrink-0"
                    onClick={() => onRemoveLiq(l.id)}
                  >✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
