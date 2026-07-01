import {
  IconCalendar, IconBars, IconCard,
  IconSun, IconMoon, IconLogout, IconClose, IconSettings,
} from './icons';

const NAV = [
  { k: 'mes',  label: 'Resumen mensual',    Icon: IconCalendar },
  { k: 'anio', label: 'Vista anual',        Icon: IconBars },
  { k: 'conf', label: 'Tarjetas y cuentas', Icon: IconCard },
];

function initialsFromEmail(email) {
  if (!email) return '··';
  const name = email.split('@')[0];
  const parts = name.split(/[.\-_]+/).filter(Boolean);
  const letters = (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2));
  return letters.toUpperCase();
}

export default function Sidebar({ view, setView, theme, toggleTheme, user, onSignOut, onOpenSettings, open, onClose }) {
  const isDark = theme === 'dark';
  return (
    <>
      {/* Backdrop (solo móvil) */}
      <div
        className={`md:hidden fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`w-[250px] flex-shrink-0 border-r border-border bg-surface flex flex-col px-4 py-[22px]
          fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out
          md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo + cerrar (móvil) */}
        <div className="flex items-center gap-3 px-2 pb-[22px] pt-1.5">
          <img src="/brand/mark-256.png" alt="UltimaCuota" className="w-[34px] h-[34px] rounded-[9px] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] tracking-[-0.01em]"><span className="font-normal">Última</span><span className="font-bold text-[#10b981]">Cuota</span></div>
            <div className="text-[11px] text-text-3">Finanzas personales</div>
          </div>
          <button className="md:hidden text-text-3 hover:text-text transition-colors" onClick={onClose} aria-label="Cerrar menú">
            <IconClose size={18} />
          </button>
        </div>

        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-3 px-2 pt-2 pb-1.5">Vistas</div>
        <nav className="flex flex-col gap-[3px]">
          {NAV.map(({ k, label, Icon }) => {
            const active = view === k;
            return (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`flex items-center gap-[11px] px-3 py-2.5 rounded-[10px] text-sm font-medium text-left transition-colors ${
                  active ? 'bg-accent-tint text-accent' : 'text-text-2 hover:bg-surface-2'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        <button
          onClick={toggleTheme}
          className="flex items-center gap-[11px] px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium text-left text-text-2 hover:bg-surface-2 transition-colors"
        >
          {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          {isDark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        {user && (
          <div className="flex items-center gap-2.5 mt-2 px-2 py-2.5 border-t border-border">
            <div className="w-8 h-8 rounded-full bg-accent-tint text-accent grid place-items-center font-semibold text-[13px] flex-shrink-0">
              {initialsFromEmail(user.email)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{user.email?.split('@')[0]}</div>
              <div className="text-[11px] text-text-3 truncate">{user.email}</div>
            </div>
            <button onClick={onOpenSettings} title="Configuración" className="text-text-3 hover:text-text transition-colors flex-shrink-0">
              <IconSettings size={17} />
            </button>
            <button onClick={onSignOut} title="Cerrar sesión" className="text-text-3 hover:text-negative transition-colors flex-shrink-0">
              <IconLogout size={17} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
