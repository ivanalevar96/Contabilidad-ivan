export const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export const fmt = (n) => {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return CLP.format(Math.round(Number(n)));
};

export const fmtInt = (n) => {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('es-CL').format(Math.round(Number(n)));
};

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const monthLabel = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_ES[m - 1]} ${y}`;
};

export const monthShort = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_ES[m - 1].slice(0, 3)} ${String(y).slice(2)}`;
};

/** Avanza un YYYY-MM por N meses (positivo o negativo) */
export const addMonths = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const monthsBetween = (a, b) => {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
};

export const currentYM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const yearOf = (ym) => Number(ym.split('-')[0]);

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
