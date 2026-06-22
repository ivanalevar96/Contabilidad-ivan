import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fmt } from '../utils/format';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-card">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
        <span className="font-medium text-text">{d.name}</span>
      </div>
      <div className="mt-1 num text-text-2">{fmt(d.value)} <span className="text-text-3">· {d.pct.toFixed(1)}%</span></div>
    </div>
  );
}

export default function Donut({ data, total, label = 'Total', subLabel }) {
  if (!data.length || total === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-text-3">
        Sin datos para graficar
      </div>
    );
  }

  const enriched = data.map((d) => ({ ...d, pct: (d.value / total) * 100 }));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={enriched}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            stroke="none"
          >
            {enriched.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-[10.5px] uppercase tracking-[0.06em] text-text-3">{label}</div>
          <div className="num text-[15px] font-semibold text-text">{fmt(total)}</div>
          {subLabel && <div className="text-[10px] text-text-3 mt-0.5">{subLabel}</div>}
        </div>
      </div>
    </div>
  );
}
