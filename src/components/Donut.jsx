import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fmt } from '../utils/format';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
        <span className="font-medium text-white">{d.name}</span>
      </div>
      <div className="mt-1 text-slate-300">{fmt(d.value)} <span className="text-slate-500">· {d.pct.toFixed(1)}%</span></div>
    </div>
  );
}

export default function Donut({ data, total, label = 'Total', subLabel }) {
  if (!data.length || total === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-slate-500">
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
          <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
          <div className="text-xl font-bold text-white">{fmt(total)}</div>
          {subLabel && <div className="text-[10px] text-slate-500 mt-0.5">{subLabel}</div>}
        </div>
      </div>
    </div>
  );
}
