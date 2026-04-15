import { useResumenAnual } from '../store';
import { fmt, MONTHS_ES } from '../utils/format';
import KpiCard from './KpiCard';

export default function AnnualView({ year, f, onPickMonth }) {
  const { meses, total } = useResumenAnual(f.state, year);
  const max = Math.max(1, ...meses.map((m) => Math.max(m.ingresos, m.gastos)));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label={`Ingresos ${year}`} value={total.ingresos} accent="green" />
        <KpiCard label={`Gastos ${year}`}   value={total.gastos}   accent="rose" />
        <KpiCard label="Saldo neto"         value={total.saldo}    accent={total.saldo < 0 ? 'rose' : 'cyan'} />
        <KpiCard label="Promedio mensual"   value={total.gastos / 12} accent="amber" sub="Gasto mensual promedio" />
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold mb-4">Ingresos vs Gastos · {year}</h2>
        <div className="grid grid-cols-12 gap-2 items-end h-56">
          {meses.map((m, idx) => {
            const hIng = (m.ingresos / max) * 100;
            const hGas = (m.gastos / max) * 100;
            return (
              <button key={m.ym} onClick={() => onPickMonth(m.ym)}
                className="group flex flex-col items-center gap-1 h-full justify-end">
                <div className="flex items-end gap-1 h-full">
                  <div className="w-3 rounded-t bg-emerald-400/80 group-hover:bg-emerald-300 transition" style={{ height: `${hIng}%` }} title={`Ingresos: ${fmt(m.ingresos)}`} />
                  <div className="w-3 rounded-t bg-rose-400/80 group-hover:bg-rose-300 transition" style={{ height: `${hGas}%` }} title={`Gastos: ${fmt(m.gastos)}`} />
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200">{MONTHS_ES[idx].slice(0, 3)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-400" /> Ingresos</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-rose-400" /> Gastos</span>
          <span className="ml-auto">Click en un mes para ver el detalle</span>
        </div>
      </section>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-slate-900/60">
              <th className="th">Mes</th>
              <th className="th text-right">Ingresos</th>
              <th className="th text-right">Gastos</th>
              <th className="th text-right">Saldo</th>
              <th className="th text-right">% usado</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m, idx) => {
              const pct = m.ingresos > 0 ? (m.gastos / m.ingresos) * 100 : 0;
              return (
                <tr key={m.ym} className="hover:bg-slate-900/40 cursor-pointer" onClick={() => onPickMonth(m.ym)}>
                  <td className="td">{MONTHS_ES[idx]} {year}</td>
                  <td className="td text-right text-emerald-300">{fmt(m.ingresos)}</td>
                  <td className="td text-right text-rose-300">{fmt(m.gastos)}</td>
                  <td className={`td text-right font-semibold ${m.saldo < 0 ? 'text-rose-300' : 'text-cyan-300'}`}>{fmt(m.saldo)}</td>
                  <td className="td text-right">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr className="bg-slate-900/80 font-semibold">
              <td className="td">Total</td>
              <td className="td text-right text-emerald-300">{fmt(total.ingresos)}</td>
              <td className="td text-right text-rose-300">{fmt(total.gastos)}</td>
              <td className={`td text-right ${total.saldo < 0 ? 'text-rose-300' : 'text-cyan-300'}`}>{fmt(total.saldo)}</td>
              <td className="td text-right">{total.ingresos > 0 ? ((total.gastos / total.ingresos) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
