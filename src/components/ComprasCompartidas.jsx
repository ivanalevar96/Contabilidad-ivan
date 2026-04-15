import { fmt } from '../utils/format';

export default function ComprasCompartidas({ compartidas, tarjetas }) {
  if (!compartidas.length) {
    return (
      <div className="card p-4 text-sm text-slate-400">
        Sin compras compartidas este mes. Marca una compra como “compartida” al crearla.
      </div>
    );
  }

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
            return (
              <tr key={it.compra.id + i}>
                <td className="td font-medium">{it.compra.descripcion}</td>
                <td className="td">
                  <span className="chip" style={{ background: (tarj?.color || '#64748b') + '33', color: tarj?.color || '#cbd5e1' }}>
                    {tarj?.nombre || '—'}
                  </span>
                </td>
                <td className="td text-right">{fmt(it.compra.valorConInteres || it.compra.valorCompra)}</td>
                <td className="td text-center">{it.compra.cantCuotas}</td>
                <td className="td text-center">{it.numCuota}/{it.compra.cantCuotas}</td>
                <td className="td text-slate-300">{it.compra.divididaEntre}</td>
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
