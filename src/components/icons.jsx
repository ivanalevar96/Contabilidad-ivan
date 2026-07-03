// Iconos de línea (estilo Lucide/Feather). stroke=currentColor.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Svg({ size = 18, sw, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={sw ?? base.strokeWidth}>
      {children}
    </svg>
  );
}

export const TrendLogo = (p) => <Svg {...p}><path d="M3 17l5-5 4 3 8-8" /><path d="M21 7v5" /><path d="M21 7h-5" /></Svg>;
export const IconCalendar = (p) => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></Svg>;
export const IconBars = (p) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>;
export const IconCard = (p) => <Svg {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Svg>;
export const IconSun = (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const IconMoon = (p) => <Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Svg>;
export const IconLogout = (p) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></Svg>;
export const IconChevronLeft = (p) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;
export const IconChevronRight = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
export const IconChevronDown = (p) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>;
export const IconPlus = (p) => <Svg {...p} sw={2}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconPencil = (p) => <Svg {...p} sw={1.8}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>;
export const IconTrash = (p) => <Svg {...p} sw={1.8}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></Svg>;
export const IconArrowUp = (p) => <Svg {...p} sw={2}><path d="M7 17L17 7M17 7H8M17 7v9" /></Svg>;
export const IconArrowDown = (p) => <Svg {...p} sw={2}><path d="M7 7l10 10M17 17H8M17 17V8" /></Svg>;
export const IconArrowRight = (p) => <Svg {...p} sw={1.9}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Svg>;
export const IconUp = (p) => <Svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Svg>;
export const IconDown = (p) => <Svg {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></Svg>;
export const IconDollar = (p) => <Svg {...p}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Svg>;
export const IconClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Svg>;
export const IconChart = (p) => <Svg {...p}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></Svg>;
export const IconUsers = (p) => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" /></Svg>;
export const IconDownload = (p) => <Svg {...p} sw={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></Svg>;
export const IconUpload = (p) => <Svg {...p} sw={1.8}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5-5 5 5M12 4v12" /></Svg>;
export const IconArchive = (p) => <Svg {...p} sw={1.8}><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></Svg>;
export const IconWhatsApp = (p) => <Svg {...p} sw={1.7}><path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z" /></Svg>;
export const IconCheck = (p) => <Svg {...p} sw={2}><path d="M20 6L9 17l-5-5" /></Svg>;
export const IconStop = (p) => <Svg {...p} sw={1.8}><rect x="5" y="5" width="14" height="14" rx="2" /></Svg>;
export const IconPause = (p) => <Svg {...p} sw={1.8}><path d="M8 5v14M16 5v14" /></Svg>;
export const IconRefresh = (p) => <Svg {...p} sw={1.8}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></Svg>;
export const IconMenu = (p) => <Svg {...p} sw={1.8}><path d="M3 6h18M3 12h18M3 18h18" /></Svg>;
export const IconClose = (p) => <Svg {...p} sw={1.8}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconPiggyBank = (p) => <Svg {...p} sw={1.7}><path d="M19 9V6a2 2 0 0 0-2-2h-1.5a5 5 0 0 0-9 2H5a2 2 0 0 0-2 2c0 1.5 1 2 1 2v3c0 .5.3 1 1 1.3V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h4v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.5c1-.5 2-1.6 2-3.5 0-1-.4-2-1-2.7V9z" /><circle cx="16" cy="10" r="0.6" fill="currentColor" stroke="none" /><path d="M2 11l2 .5" /></Svg>;
export const IconSettings = (p) => <Svg {...p} sw={1.7}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>;

export const IconGoogle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A11.99 11.99 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.73z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);
