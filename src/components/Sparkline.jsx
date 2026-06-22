import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmt, monthShort } from '../utils/format';
import { GASTO_COLOR } from '../utils/colors';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-card">
      <div className="font-medium text-text mb-1">{monthShort(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-2">{p.name}:</span>
          <span className="num text-text font-medium">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Sparkline({ data }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gasFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GASTO_COLOR} stopOpacity={0.3} />
            <stop offset="100%" stopColor={GASTO_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="ym"
          tickFormatter={monthShort}
          tick={{ fill: 'var(--text-3)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--accent)" strokeWidth={2.5} fill="url(#ingFill)" />
        <Area type="monotone" dataKey="gastos"   name="Gastos"   stroke={GASTO_COLOR} strokeWidth={2.5} fill="url(#gasFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
