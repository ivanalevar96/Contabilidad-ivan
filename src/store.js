import { useEffect, useMemo, useState, useCallback } from 'react';
import { currentYM, monthsBetween, uid } from './utils/format';

/**
 * Modelo de datos
 * --------------------------------------------------------------
 * tarjetas: [{ id, nombre, tipo: 'tarjeta' | 'persona', color }]
 * sueldos:  { [YYYY-MM]: { sueldo, ingresosExtra: [{id, desc, monto}] } }
 * compras:  [{
 *   id, tarjetaId, descripcion,
 *   valorCompra, valorConInteres, cantCuotas, mesInicio,
 *   valorCuota,        // calculado (o manual)
 *   esCompartida, divididaEntre, valorPorPersona,
 *   revisado: { [YYYY-MM]: boolean }
 * }]
 * pagosPuntuales: [{ id, mesYM, tarjetaId, descripcion, monto }]  // pagos no recurrentes
 */

const KEY = 'finanzas-app-v1';

const DEFAULT_TARJETAS = [
  { id: 't-tenpo',   nombre: 'Tenpo',             tipo: 'tarjeta', color: '#fb7185' },
  { id: 't-bestado', nombre: 'Banco Estado',      tipo: 'tarjeta', color: '#f59e0b' },
  { id: 't-cmr',     nombre: 'CMR Falabella',     tipo: 'tarjeta', color: '#a78bfa' },
  { id: 't-linea',   nombre: 'Línea Falabella',   tipo: 'tarjeta', color: '#34d399' },
  { id: 'p-cynthia', nombre: 'Debo a Cynthia',    tipo: 'persona', color: '#22d3ee' },
  { id: 'p-mama',    nombre: 'Debo a Mamá',       tipo: 'persona', color: '#f472b6' },
];

const initial = () => ({
  tarjetas: DEFAULT_TARJETAS,
  sueldos: { [currentYM()]: { sueldo: 0, ingresosExtra: [] } },
  compras: [],
  pagosPuntuales: [],
});

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw);
    // Garantiza shape
    return {
      tarjetas: parsed.tarjetas?.length ? parsed.tarjetas : DEFAULT_TARJETAS,
      sueldos: parsed.sueldos || {},
      compras: parsed.compras || [],
      pagosPuntuales: parsed.pagosPuntuales || [],
    };
  } catch {
    return initial();
  }
};

const save = (state) => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
};

/** Cuota aplicable a un mes YYYY-MM: retorna { numCuota, valorCuota } o null. */
export function cuotaDelMes(compra, ym) {
  if (!compra?.mesInicio) return null;
  const n = monthsBetween(compra.mesInicio, ym) + 1;
  if (n < 1 || n > (compra.cantCuotas || 0)) return null;
  return { numCuota: n, valorCuota: Number(compra.valorCuota) || 0 };
}

export function useFinanzas() {
  const [state, setState] = useState(load);

  useEffect(() => { save(state); }, [state]);

  // ---------- Sueldos ----------
  const setSueldo = useCallback((ym, sueldo) => {
    setState((s) => ({
      ...s,
      sueldos: { ...s.sueldos, [ym]: { ...(s.sueldos[ym] || { ingresosExtra: [] }), sueldo: Number(sueldo) || 0 } },
    }));
  }, []);

  const addIngresoExtra = useCallback((ym, desc, monto) => {
    setState((s) => {
      const cur = s.sueldos[ym] || { sueldo: 0, ingresosExtra: [] };
      const nuevo = { id: uid(), desc: desc || 'Ingreso extra', monto: Number(monto) || 0 };
      return {
        ...s,
        sueldos: { ...s.sueldos, [ym]: { ...cur, ingresosExtra: [...(cur.ingresosExtra || []), nuevo] } },
      };
    });
  }, []);

  const removeIngresoExtra = useCallback((ym, id) => {
    setState((s) => {
      const cur = s.sueldos[ym];
      if (!cur) return s;
      return {
        ...s,
        sueldos: { ...s.sueldos, [ym]: { ...cur, ingresosExtra: (cur.ingresosExtra || []).filter((x) => x.id !== id) } },
      };
    });
  }, []);

  // ---------- Tarjetas ----------
  const addTarjeta = useCallback((t) => {
    setState((s) => ({ ...s, tarjetas: [...s.tarjetas, { id: uid(), color: '#64748b', tipo: 'tarjeta', ...t }] }));
  }, []);

  const updateTarjeta = useCallback((id, patch) => {
    setState((s) => ({ ...s, tarjetas: s.tarjetas.map((t) => t.id === id ? { ...t, ...patch } : t) }));
  }, []);

  const removeTarjeta = useCallback((id) => {
    setState((s) => ({
      ...s,
      tarjetas: s.tarjetas.filter((t) => t.id !== id),
      compras: s.compras.filter((c) => c.tarjetaId !== id),
      pagosPuntuales: s.pagosPuntuales.filter((p) => p.tarjetaId !== id),
    }));
  }, []);

  // ---------- Compras ----------
  const addCompra = useCallback((c) => {
    const valorCuota = c.valorCuota != null
      ? Number(c.valorCuota)
      : (Number(c.valorConInteres || c.valorCompra || 0) / Math.max(1, Number(c.cantCuotas || 1)));
    const compra = {
      id: uid(),
      revisado: {},
      esCompartida: false,
      divididaEntre: '',
      valorPorPersona: null,
      ...c,
      valorCuota: Math.round(valorCuota),
    };
    setState((s) => ({ ...s, compras: [...s.compras, compra] }));
  }, []);

  const updateCompra = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      compras: s.compras.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        if (patch.valorConInteres != null || patch.valorCompra != null || patch.cantCuotas != null) {
          const base = Number(next.valorConInteres || next.valorCompra || 0);
          next.valorCuota = Math.round(base / Math.max(1, Number(next.cantCuotas || 1)));
        }
        if (patch.valorCuota != null) next.valorCuota = Number(patch.valorCuota);
        return next;
      })
    }));
  }, []);

  const removeCompra = useCallback((id) => {
    setState((s) => ({ ...s, compras: s.compras.filter((c) => c.id !== id) }));
  }, []);

  const toggleRevisado = useCallback((id, ym) => {
    setState((s) => ({
      ...s,
      compras: s.compras.map((c) => c.id === id
        ? { ...c, revisado: { ...(c.revisado || {}), [ym]: !c.revisado?.[ym] } }
        : c),
    }));
  }, []);

  // ---------- Pagos puntuales ----------
  const addPagoPuntual = useCallback((p) => {
    setState((s) => ({ ...s, pagosPuntuales: [...s.pagosPuntuales, { id: uid(), ...p }] }));
  }, []);

  const removePagoPuntual = useCallback((id) => {
    setState((s) => ({ ...s, pagosPuntuales: s.pagosPuntuales.filter((p) => p.id !== id) }));
  }, []);

  // ---------- Reset ----------
  const resetAll = useCallback(() => setState(initial()), []);

  const importJson = useCallback((obj) => {
    try {
      if (obj && typeof obj === 'object') setState({ ...initial(), ...obj });
    } catch {}
  }, []);

  return {
    state,
    setSueldo, addIngresoExtra, removeIngresoExtra,
    addTarjeta, updateTarjeta, removeTarjeta,
    addCompra, updateCompra, removeCompra, toggleRevisado,
    addPagoPuntual, removePagoPuntual,
    resetAll, importJson,
  };
}

/** Calcula agregados para un mes */
export function useResumenMes(state, ym) {
  return useMemo(() => {
    const sueldoObj = state.sueldos[ym] || { sueldo: 0, ingresosExtra: [] };
    const ingresoBase = Number(sueldoObj.sueldo) || 0;
    const ingresoExtra = (sueldoObj.ingresosExtra || []).reduce((a, b) => a + (Number(b.monto) || 0), 0);
    const ingresos = ingresoBase + ingresoExtra;

    // Cuotas vigentes del mes por tarjeta
    const porTarjeta = {};
    for (const t of state.tarjetas) porTarjeta[t.id] = { tarjeta: t, items: [], total: 0 };

    for (const c of state.compras) {
      const cuota = cuotaDelMes(c, ym);
      if (!cuota) continue;
      if (!porTarjeta[c.tarjetaId]) continue;
      porTarjeta[c.tarjetaId].items.push({ compra: c, ...cuota });
      porTarjeta[c.tarjetaId].total += cuota.valorCuota;
    }

    // Pagos puntuales del mes
    for (const p of state.pagosPuntuales) {
      if (p.mesYM !== ym) continue;
      if (!porTarjeta[p.tarjetaId]) continue;
      porTarjeta[p.tarjetaId].items.push({ puntual: p, valorCuota: Number(p.monto) || 0, numCuota: 1 });
      porTarjeta[p.tarjetaId].total += Number(p.monto) || 0;
    }

    const gastos = Object.values(porTarjeta).reduce((a, b) => a + b.total, 0);
    const saldo = ingresos - gastos;

    // Compras compartidas del mes (para sección aparte)
    const compartidas = state.compras
      .map((c) => {
        const cuota = cuotaDelMes(c, ym);
        if (!cuota || !c.esCompartida) return null;
        return { compra: c, ...cuota };
      })
      .filter(Boolean);

    return { ingresos, ingresoBase, ingresoExtra, gastos, saldo, porTarjeta, compartidas, sueldoObj };
  }, [state, ym]);
}

/** Serie anual: ingresos/gastos/saldo por mes del año */
export function useResumenAnual(state, year) {
  return useMemo(() => {
    const meses = [];
    for (let m = 1; m <= 12; m++) {
      const ym = `${year}-${String(m).padStart(2, '0')}`;
      const sueldoObj = state.sueldos[ym] || { sueldo: 0, ingresosExtra: [] };
      const ingresoBase = Number(sueldoObj.sueldo) || 0;
      const ingresoExtra = (sueldoObj.ingresosExtra || []).reduce((a, b) => a + (Number(b.monto) || 0), 0);
      const ingresos = ingresoBase + ingresoExtra;

      let gastos = 0;
      for (const c of state.compras) {
        const cuota = cuotaDelMes(c, ym);
        if (cuota) gastos += cuota.valorCuota;
      }
      for (const p of state.pagosPuntuales) {
        if (p.mesYM === ym) gastos += Number(p.monto) || 0;
      }
      meses.push({ ym, ingresos, gastos, saldo: ingresos - gastos });
    }
    const tot = meses.reduce((a, b) => ({
      ingresos: a.ingresos + b.ingresos,
      gastos: a.gastos + b.gastos,
      saldo: a.saldo + b.saldo,
    }), { ingresos: 0, gastos: 0, saldo: 0 });
    return { meses, total: tot };
  }, [state, year]);
}
