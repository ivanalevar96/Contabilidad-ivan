import { addMonths, monthLabel } from '../utils/format';
import { IconChevronLeft, IconChevronRight, IconPlus, IconMenu } from './icons';

const TITLES = { mes: 'Resumen mensual', anio: 'Vista anual', conf: 'Tarjetas y cuentas' };

function NavGroup({ children }) {
  return (
    <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-[10px] p-1">
      {children}
    </div>
  );
}

function NavBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-[30px] h-[30px] rounded-[7px] grid place-items-center text-text-2 hover:bg-surface transition-colors"
    >
      {children}
    </button>
  );
}

export default function Header({ view, ym, setYM, year, setYear, onRegister, onMenu }) {
  return (
    <header className="h-[66px] flex-shrink-0 border-b border-border bg-surface flex items-center gap-2 sm:gap-4 px-4 sm:px-7">
      <button
        onClick={onMenu}
        aria-label="Abrir menú"
        className="md:hidden w-9 h-9 -ml-1 rounded-[9px] grid place-items-center text-text-2 hover:bg-surface-2 transition-colors flex-shrink-0"
      >
        <IconMenu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] sm:text-base font-semibold tracking-[-0.01em] truncate">{TITLES[view]}</div>
      </div>

      {view === 'mes' && (
        <NavGroup>
          <NavBtn onClick={() => setYM(addMonths(ym, -1))} label="Mes anterior"><IconChevronLeft size={16} /></NavBtn>
          <div className="min-w-[92px] sm:min-w-[120px] text-center text-[12.5px] sm:text-[13.5px] font-semibold">{monthLabel(ym)}</div>
          <NavBtn onClick={() => setYM(addMonths(ym, 1))} label="Mes siguiente"><IconChevronRight size={16} /></NavBtn>
        </NavGroup>
      )}

      {view === 'anio' && (
        <NavGroup>
          <NavBtn onClick={() => setYear(year - 1)} label="Año anterior"><IconChevronLeft size={16} /></NavBtn>
          <div className="min-w-[56px] sm:min-w-[64px] text-center text-[13.5px] font-semibold num">{year}</div>
          <NavBtn onClick={() => setYear(year + 1)} label="Año siguiente"><IconChevronRight size={16} /></NavBtn>
        </NavGroup>
      )}

      {view === 'mes' && (
        <button
          onClick={onRegister}
          className="flex items-center gap-2 h-[38px] px-3 sm:px-[15px] rounded-[10px] bg-accent text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <IconPlus size={16} />
          <span className="hidden sm:inline">Registrar</span>
        </button>
      )}
    </header>
  );
}
