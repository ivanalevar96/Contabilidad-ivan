export default function SegmentedTabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex gap-[3px] bg-surface-2 border border-border rounded-[11px] p-1 max-w-full overflow-x-auto">
      {tabs.map((t) => {
        const active = value === t.k;
        return (
          <button
            key={t.k}
            onClick={() => onChange(t.k)}
            className={`flex items-center gap-[7px] px-[15px] py-[7px] rounded-lg text-[13.5px] font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              active ? 'bg-surface text-text shadow-card' : 'text-text-2 hover:text-text'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.badge != null && (
              <span className={`chip text-[10px] px-1.5 ${active ? 'bg-accent-tint text-accent' : 'bg-surface-3 text-text-2'}`}>
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
