import { fmt } from '../utils/format';
import { IconArrowUp, IconArrowDown } from './icons';

export default function KpiCard({ label, value, sub, icon, accent = false, variation }) {
  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center gap-2 text-text-3 text-xs font-medium">
        {icon}
        {label}
      </div>
      <div className={`mt-3 num text-xl sm:text-2xl font-semibold tracking-[-0.02em] truncate ${accent ? 'text-accent' : 'text-text'}`}>
        {typeof value === 'number' ? fmt(value) : value}
      </div>
      {variation && (
        <div className={`mt-1.5 text-xs flex items-center gap-1 ${variation.positive ? 'text-positive' : 'text-negative'}`}>
          {variation.up ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />}
          {variation.label}
        </div>
      )}
      {sub && !variation && <div className="mt-1.5 text-xs text-text-3">{sub}</div>}
    </div>
  );
}
