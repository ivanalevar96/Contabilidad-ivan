export default function SegmentedTabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-900/60 p-1 border border-slate-800 overflow-x-auto max-w-full">
      {tabs.map((t) => {
        const active = value === t.k;
        return (
          <button
            key={t.k}
            onClick={() => onChange(t.k)}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              active
                ? 'bg-accent text-slate-900 shadow-sm shadow-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t.icon && <span className="text-base leading-none">{t.icon}</span>}
            <span>{t.label}</span>
            {t.badge != null && (
              <span className={`chip ${active ? 'bg-slate-900/30 text-slate-900' : 'bg-slate-800 text-slate-300'}`}>
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
