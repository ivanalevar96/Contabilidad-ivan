import { fmt } from '../utils/format';

export default function ComprasCompartidas({ compartidas, tarjetas, personas = [] }) {
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
      <table className="w-full min-w-[780px]">
        <thead>
          <tr className="bg-slate-900/60">
            <th className="th">Descripción</th>
            <th className="th">Tarjeta</th>
            <th className="th text-right">Monto compra</th>
            <th className="th text-center">Cuotas</th>
            <th className="th text-center"># Cuota</th>
            <th className="th">Dividida entre</th>
            <th className="th text-right">Valor cuota</th>
            <th className="th text-right">Mi parte</th>
          </tr>
        </thead>
        <tbody>
          {compartidas.map((it, i) => {
            const tarj = tarjetas.find((t) => t.id === it.compra.tarjetaId);
            // Resolver personas: primero por IDs, fallback al texto libre legacy
            const personasIds = Array.isArray(it.compra.personasIds) ? it.compra.personasIds : [];
            const personasResueltas = personasIds
              .map((id) => personaMap[id])
              .filter(Boolean);

            return (
              <tr key={it.compra.id + i}>
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
                    <span className="text-slate-300 text-sm">{it.compra.divididaEntre || '—'}</span>
                  )}
                </td>
                <td className="td text-right">{fmt(it.valorCuota)}</td>
                <td className="td text-right font-semibold text-cyan-300">{it.compra.valorPorPersona ? fmt(it.compra.valorPorPersona) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
