import { fmt } from '../utils/format';
import { useTrailingMonths } from '../store';
import KpiCard from './KpiCard';
import Donut from './Donut';
import Sparkline from './Sparkline';

export default function ResumenTab({ ym, f, resumen }) {
  const trailing = useTrailingMonths(f.state, ym, 6);

  const porcentaje = resumen.ingresos > 0 ? Math.min(100, (resumen.gastos / resumen.ingresos) * 100) : 0;
  const colorBarra = porcentaje > 90 ? 'bg-rose-500' : porcentaje > 70 ? 'bg-amber-400' : 'bg-emerald-400';

  const donutData = Object.values(resumen.porTarjeta)
    .filter((b) => b.total > 0)
    .map((b) => ({ name: b.tarjeta.nombre, value: b.total, color: b.tarjeta.color || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const topCompras = Object.values(resumen.porTarjeta)
    .flatMap((b) => b.items.map((it) => {
      let tipo;
      if (it.puntual) tipo = 'puntual';
      else if (it.compra.esSubscripcion) tipo = `subscripción · mes #${it.numCuota}`;
      else tipo = `${it.numCuota}/${it.compra.cantCuotas}`;
      return {
        desc: it.compra?.descripcion || it.puntual?.descripcion,
        monto: it.miParte ?? it.valorCuota,
        tarjeta: b.tarjeta,
        tipo,
      };
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fadein">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Ingresos"  value={resumen.ingresos} accent="green" />
        <KpiCard label="Gastos"    value={resumen.gastos}   accent="rose" />
        <KpiCard label="Saldo"     value={resumen.saldo}    accent={resumen.saldo < 0 ? 'rose' : 'cyan'} />
        <KpiCard label="% usado"   value={`${porcentaje.toFixed(1)}%`} accent="amber" sub="Gastos / Ingresos" />
      </section>

      <section className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="label">Carga del mes</div>
            <div className="text-xs text-slate-400 mt-0.5">{fmt(resumen.gastos)} de {fmt(resumen.ingresos)}</div>
          </div>
          <div className={`text-xl font-bold ${porcentaje > 90 ? 'text-rose-400' : porcentaje > 70 ? 'text-amber-300' : 'text-emerald-300'}`}>
            {porcentaje.toFixed(1)}%
          </div>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
          <div className={`h-full ${colorBarra} transition-all duration-700`} style={{ width: `${porcentaje}%` }} />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Distribución de gastos</h3>
            <span className="text-xs text-slate-400">{donutData.length} tarjeta(s)</span>
          </div>
          <Donut data={donutData} total={resumen.gastos} label="Gastos" />
          {donutData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-1.5">
              {donutData.slice(0, 6).map((d) => {
                const pct = resumen.gastos > 0 ? (d.value / resumen.gastos) * 100 : 0;
                return (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="flex-1 text-slate-300 truncate">{d.name}</span>
                    <span className="text-slate-500">{pct.toFixed(0)}%</span>
                    <span className="text-white font-medium tabular-nums w-20 text-right">{fmt(d.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Tendencia · 6 meses</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Gastos</span>
            </div>
          </div>
          <Sparkline data={trailing} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-900/60 p-2">
              <div className="label">Ahorro últ. 6m</div>
              <div className={`text-sm font-bold mt-0.5 ${trailing.reduce((a, b) => a + b.ingresos - b.gastos, 0) < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {fmt(trailing.reduce((a, b) => a + b.ingresos - b.gastos, 0))}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2">
              <div className="label">Gasto promedio</div>
              <div className="text-sm font-bold mt-0.5 text-rose-300">
                {fmt(trailing.reduce((a, b) => a + b.gastos, 0) / Math.max(1, trailing.length))}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2">
              <div className="label">Mes más alto</div>
              <div className="text-sm font-bold mt-0.5 text-amber-300">
                {fmt(Math.max(...trailing.map((t) => t.gastos)))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {topCompras.length > 0 && (
        <section className="card p-5">
          <h3 className="text-base font-semibold mb-3">Top gastos del mes</h3>
          <div className="space-y-2">
            {topCompras.map((c, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-900/60 px-3 py-2 hover:bg-slate-900 transition-colors">
                <span className="text-slate-500 font-bold w-5 text-center">{i + 1}</span>
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: c.tarjeta.color || '#64748b' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-100 truncate">{c.desc}</div>
                  <div className="text-xs text-slate-400 truncate">{c.tarjeta.nombre} · {c.tipo}</div>
                </div>
                <div className="font-bold tabular-nums text-cyan-300">{fmt(c.monto)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
