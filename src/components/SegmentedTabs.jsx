export default function SegmentedTabs({ tabs, value, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-slate-900/60 p-1 border border-slate-800 overflow-x-auto w-full scrollbar-none">
      {tabs.map((t) => {
        const active = value === t.k;
        return (
          <button
            key={t.k}
            onClick={() => onChange(t.k)}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              active
                ? 'bg-accent text-slate-900 shadow-sm shadow-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t.icon && <span className="text-sm leading-none">{t.icon}</span>}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            {t.badge != null && (
              <span className={`chip text-[10px] px-1 ${active ? 'bg-slate-900/30 text-slate-900' : 'bg-slate-800 text-slate-300'}`}>
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
