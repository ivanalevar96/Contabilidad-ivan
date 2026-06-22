import { fmt } from '../utils/format';
import { useTrailingMonths } from '../store';
import KpiCard from './KpiCard';
import Donut from './Donut';
import Sparkline from './Sparkline';
import { IconUp, IconDown, IconDollar, IconClock } from './icons';

function variacion(actual, anterior, gastoMode = false) {
  if (!anterior || anterior <= 0) return null;
  const pct = ((actual - anterior) / anterior) * 100;
  const up = pct >= 0;
  // En ingresos subir es positivo; en gastos subir es negativo.
  const positive = gastoMode ? !up : up;
  const signo = up ? '+' : '';
  return { up, positive, label: `${signo}${pct.toFixed(1)}% vs mes anterior` };
}

export default function ResumenTab({ ym, f, resumen }) {
  const trailing = useTrailingMonths(f.state, ym, 6);
  const prev = trailing.length >= 2 ? trailing[trailing.length - 2] : null;

  const porcentaje = resumen.ingresos > 0 ? Math.min(100, (resumen.gastos / resumen.ingresos) * 100) : 0;

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

  const ahorro6m = trailing.reduce((a, b) => a + b.ingresos - b.gastos, 0);
  const gastoProm = trailing.reduce((a, b) => a + b.gastos, 0) / Math.max(1, trailing.length);
  const mesAlto = Math.max(...trailing.map((t) => t.gastos));

  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
        <KpiCard label="Ingresos" icon={<IconUp size={15} />} value={resumen.ingresos}
          variation={prev && variacion(resumen.ingresos, prev.ingresos)} sub="Total del mes" />
        <KpiCard label="Gastos" icon={<IconDown size={15} />} value={resumen.gastos}
          variation={prev && variacion(resumen.gastos, prev.gastos, true)} sub="Total del mes" />
        <KpiCard label="Saldo" icon={<IconDollar size={15} />} value={resumen.saldo} accent sub="Disponible este mes" />
        <KpiCard label="% usado" icon={<IconClock size={15} />} value={`${porcentaje.toFixed(1)}%`} sub="Gastos / Ingresos" />
      </section>

      <section className="card p-6">
        <div className="flex justify-between items-center mb-3.5">
          <div>
            <div className="text-[13.5px] font-semibold">Carga del mes</div>
            <div className="text-xs text-text-3 mt-0.5 num">{fmt(resumen.gastos)} de {fmt(resumen.ingresos)}</div>
          </div>
          <div className="num text-lg font-semibold text-accent">{porcentaje.toFixed(1)}%</div>
        </div>
        <div className="h-[9px] rounded-md bg-surface-3 overflow-hidden">
          <div className="h-full rounded-md bg-accent transition-all duration-700" style={{ width: `${porcentaje}%` }} />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-[14px]">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13.5px] font-semibold">Distribución de gastos</h3>
            <span className="text-xs text-text-3">{donutData.length} tarjeta(s)</span>
          </div>
          <Donut data={donutData} total={resumen.gastos} label="Gastos" />
          {donutData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2.5">
              {donutData.slice(0, 6).map((d) => {
                const pct = resumen.gastos > 0 ? (d.value / resumen.gastos) * 100 : 0;
                return (
                  <div key={d.name} className="flex items-center gap-2.5 text-[12.5px]">
                    <span className="h-[9px] w-[9px] rounded-[3px] flex-shrink-0" style={{ background: d.color }} />
                    <span className="flex-1 text-text-2 truncate">{d.name}</span>
                    <span className="text-text-3 num text-[11px]">{pct.toFixed(0)}%</span>
                    <span className="num font-medium w-20 text-right">{fmt(d.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13.5px] font-semibold">Tendencia · 6 meses</h3>
            <div className="flex items-center gap-3.5 text-[11.5px] text-text-2">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: '#94a3b8' }} />Gastos</span>
            </div>
          </div>
          <Sparkline data={trailing} />
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <div className="rounded-[10px] bg-surface-2 p-3">
              <div className="text-[10.5px] text-text-3 uppercase tracking-[0.05em]">Ahorro 6m</div>
              <div className={`num font-semibold text-[13px] mt-1 ${ahorro6m < 0 ? 'text-negative' : 'text-positive'}`}>{fmt(ahorro6m)}</div>
            </div>
            <div className="rounded-[10px] bg-surface-2 p-3">
              <div className="text-[10.5px] text-text-3 uppercase tracking-[0.05em]">Gasto prom.</div>
              <div className="num font-semibold text-[13px] mt-1">{fmt(gastoProm)}</div>
            </div>
            <div className="rounded-[10px] bg-surface-2 p-3">
              <div className="text-[10.5px] text-text-3 uppercase tracking-[0.05em]">Mes más alto</div>
              <div className="num font-semibold text-[13px] mt-1">{fmt(mesAlto)}</div>
            </div>
          </div>
        </div>
      </section>

      {topCompras.length > 0 && (
        <section className="card p-6">
          <h3 className="text-[13.5px] font-semibold mb-3.5">Mayores gastos del mes</h3>
          <div className="flex flex-col gap-[7px]">
            {topCompras.map((c, i) => (
              <div key={i} className="flex items-center gap-3.5 rounded-[10px] bg-surface-2 px-3.5 py-2.5 hover:bg-surface-3 transition-colors">
                <span className="num text-xs text-text-3 w-3.5 text-center">{i + 1}</span>
                <span className="h-[9px] w-[9px] rounded-[3px] flex-shrink-0" style={{ background: c.tarjeta.color || '#64748b' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium truncate">{c.desc}</div>
                  <div className="text-[11.5px] text-text-3 truncate">{c.tarjeta.nombre} · {c.tipo}</div>
                </div>
                <div className="num font-semibold text-[13.5px]">{fmt(c.monto)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
