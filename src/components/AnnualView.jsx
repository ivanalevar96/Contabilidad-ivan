import { useResumenAnual } from '../store';
import { fmt, MONTHS_ES } from '../utils/format';
import { GASTO_COLOR } from '../utils/colors';
import KpiCard from './KpiCard';

export default function AnnualView({ year, f, onPickMonth }) {
  const { meses, total } = useResumenAnual(f.state, year);
  const max = Math.max(1, ...meses.map((m) => Math.max(m.ingresos, m.gastos)));

  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
        <KpiCard label={`Ingresos ${year}`} value={total.ingresos} />
        <KpiCard label={`Gastos ${year}`}   value={total.gastos} />
        <KpiCard label="Saldo neto"         value={total.saldo} accent />
        <KpiCard label="Promedio mensual"   value={total.gastos / 12} sub="Gasto mensual promedio" />
      </section>

      <section className="card p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[13.5px] font-semibold">Ingresos vs Gastos · {year}</h2>
          <div className="flex gap-3.5 text-[11.5px] text-text-2">
            <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-[3px] bg-accent" />Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: GASTO_COLOR }} />Gastos</span>
          </div>
        </div>
        <div className="flex items-end gap-2.5 h-[210px]">
          {meses.map((m, idx) => {
            const hIng = (m.ingresos / max) * 100;
            const hGas = (m.gastos / max) * 100;
            return (
              <button
                key={m.ym}
                onClick={() => onPickMonth(m.ym)}
                className="group flex-1 h-full flex flex-col items-center gap-1.5 justify-end"
                title={`${MONTHS_ES[idx]}: ingresos ${fmt(m.ingresos)} · gastos ${fmt(m.gastos)}`}
              >
                <div className="flex-1 w-full flex items-end justify-center gap-[3px]">
                  <div className="w-[9px] rounded-t-[3px] bg-accent transition-all" style={{ height: `${hIng}%` }} />
                  <div className="w-[9px] rounded-t-[3px] transition-all" style={{ height: `${hGas}%`, background: GASTO_COLOR }} />
                </div>
                <span className="text-[10.5px] text-text-3 num group-hover:text-text-2">{MONTHS_ES[idx].slice(0, 3)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
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
                <tr key={m.ym} className="hover:bg-surface-2 cursor-pointer transition-colors" onClick={() => onPickMonth(m.ym)}>
                  <td className="td font-medium">{MONTHS_ES[idx]} {year}</td>
                  <td className="td text-right num text-positive">{fmt(m.ingresos)}</td>
                  <td className="td text-right num text-negative">{fmt(m.gastos)}</td>
                  <td className={`td text-right num font-semibold ${m.saldo < 0 ? 'text-negative' : 'text-accent'}`}>{fmt(m.saldo)}</td>
                  <td className="td text-right num text-text-2">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr className="bg-surface-2 font-semibold">
              <td className="td">Total</td>
              <td className="td text-right num text-positive">{fmt(total.ingresos)}</td>
              <td className="td text-right num text-negative">{fmt(total.gastos)}</td>
              <td className={`td text-right num ${total.saldo < 0 ? 'text-negative' : 'text-accent'}`}>{fmt(total.saldo)}</td>
              <td className="td text-right num">{total.ingresos > 0 ? ((total.gastos / total.ingresos) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
