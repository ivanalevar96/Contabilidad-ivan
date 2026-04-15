import { fmt } from '../utils/format';

export default function KpiCard({ label, value, sub, accent = 'cyan', icon }) {
  const accents = {
    cyan:  'from-cyan-500/20 to-cyan-500/5 text-cyan-300 border-cyan-500/20',
    green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-emerald-500/20',
    rose:  'from-rose-500/20 to-rose-500/5 text-rose-300 border-rose-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-300 border-amber-500/20',
  };
  return (
    <div className={`card p-4 bg-gradient-to-br ${accents[accent]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="label">{label}</div>
          <div className="mt-1 text-2xl font-bold text-white">{typeof value === 'number' ? fmt(value) : value}</div>
          {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
        </div>
        {icon && <div className="text-2xl opacity-80">{icon}</div>}
      </div>
    </div>
  );
}
