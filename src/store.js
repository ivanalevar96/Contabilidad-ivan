import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { currentYM, monthsBetween, uid } from './utils/format';
import {
  loadAllData, migrateLocalStorage,
  saveTarjeta, updateTarjetaDb, deleteTarjeta,
  saveSueldo,
  saveCompra, deleteCompra,
  savePagoPuntual, deletePagoPuntual,
} from './lib/database';
import { supabase } from './lib/supabase';

/**
 * Modelo de datos (sin cambios en shape)
 * --------------------------------------------------------------
 * tarjetas: [{ id, nombre, tipo: 'tarjeta' | 'persona', color }]
 * sueldos:  { [YYYY-MM]: { sueldo, ingresosExtra: [{id, desc, monto}] } }
 * compras:  [{ id, tarjetaId, descripcion, valorCompra, valorConInteres,
 *              cantCuotas, mesInicio, valorCuota, esCompartida,
 *              divididaEntre, valorPorPersona, revisado }]
 * pagosPuntuales: [{ id, mesYM, tarjetaId, descripcion, monto }]
 */

const DEFAULT_TARJETAS = [
  { nombre: 'Tenpo',             tipo: 'tarjeta', color: '#fb7185' },
  { nombre: 'Banco Estado',      tipo: 'tarjeta', color: '#f59e0b' },
  { nombre: 'CMR Falabella',     tipo: 'tarjeta', color: '#a78bfa' },
  { nombre: 'Línea Falabella',   tipo: 'tarjeta', color: '#34d399' },
  { nombre: 'Debo a Cynthia',    tipo: 'persona', color: '#22d3ee' },
  { nombre: 'Debo a Mamá',       tipo: 'persona', color: '#f472b6' },
];

const empty = () => ({
  tarjetas: [],
  sueldos: {},
  compras: [],
  pagosPuntuales: [],
});

/** Cuota aplicable a un mes YYYY-MM: retorna { numCuota, valorCuota } o null. */
export function cuotaDelMes(compra, ym) {
  if (!compra?.mesInicio) return null;
  const n = monthsBetween(compra.mesInicio, ym) + 1;
  if (n < 1 || n > (compra.cantCuotas || 0)) return null;
  return { numCuota: n, valorCuota: Number(compra.valorCuota) || 0 };
}

/** Inserta tarjetas por defecto para un usuario nuevo */
async function insertDefaultTarjetas(userId) {
  const tarjetas = [];
  for (const t of DEFAULT_TARJETAS) {
    const { data, error } = await supabase
      .from('tarjetas')
      .insert({ user_id: userId, nombre: t.nombre, tipo: t.tipo, color: t.color })
      .select('id, nombre, tipo, color')
      .single();
    if (!error && data) tarjetas.push(data);
  }
  return tarjetas;
}

export function useFinanzas(userId) {
  const [state, setState] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Carga inicial desde Supabase
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        // Intentar migrar localStorage primero
        const migrated = await migrateLocalStorage(userId);

        // Cargar datos de Supabase
        let data = await loadAllData(userId);

        // Si no hay tarjetas (usuario nuevo sin migración), crear las default
        if (!migrated && data.tarjetas.length === 0) {
          const defaults = await insertDefaultTarjetas(userId);
          data = { ...data, tarjetas: defaults };
        }

        if (!cancelled) {
          setState(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        if (!cancelled) {
          setState(empty());
          setLoading(false);
          setSyncError('Error al cargar datos');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Helper para write-through async
  const sync = useCallback((fn) => {
    fn().catch((err) => {
      console.error('Error sync:', err);
      setSyncError('Error al guardar. Tus cambios podrían no haberse guardado.');
    });
  }, []);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  // ---------- Sueldos ----------
  const setSueldo = useCallback((ym, sueldo) => {
    setState((s) => {
      const updated = { ...(s.sueldos[ym] || { ingresosExtra: [] }), sueldo: Number(sueldo) || 0 };
      const newSueldos = { ...s.sueldos, [ym]: updated };
      sync(() => saveSueldo(userIdRef.current, ym, updated));
      return { ...s, sueldos: newSueldos };
    });
  }, [sync]);

  const addIngresoExtra = useCallback((ym, desc, monto) => {
    setState((s) => {
      const cur = s.sueldos[ym] || { sueldo: 0, ingresosExtra: [] };
      const nuevo = { id: uid(), desc: desc || 'Ingreso extra', monto: Number(monto) || 0 };
      const updated = { ...cur, ingresosExtra: [...(cur.ingresosExtra || []), nuevo] };
      const newSueldos = { ...s.sueldos, [ym]: updated };
      sync(() => saveSueldo(userIdRef.current, ym, updated));
      return { ...s, sueldos: newSueldos };
    });
  }, [sync]);

  const removeIngresoExtra = useCallback((ym, id) => {
    setState((s) => {
      const cur = s.sueldos[ym];
      if (!cur) return s;
      const updated = { ...cur, ingresosExtra: (cur.ingresosExtra || []).filter((x) => x.id !== id) };
      const newSueldos = { ...s.sueldos, [ym]: updated };
      sync(() => saveSueldo(userIdRef.current, ym, updated));
      return { ...s, sueldos: newSueldos };
    });
  }, [sync]);

  // ---------- Tarjetas ----------
  const addTarjeta = useCallback((t) => {
    const nueva = { id: crypto.randomUUID(), color: '#64748b', tipo: 'tarjeta', ...t };
    setState((s) => ({ ...s, tarjetas: [...s.tarjetas, nueva] }));
    sync(() => saveTarjeta(userIdRef.current, nueva));
  }, [sync]);

  const updateTarjeta = useCallback((id, patch) => {
    setState((s) => ({ ...s, tarjetas: s.tarjetas.map((t) => t.id === id ? { ...t, ...patch } : t) }));
    sync(() => updateTarjetaDb(userIdRef.current, id, patch));
  }, [sync]);

  const removeTarjeta = useCallback((id) => {
    setState((s) => ({
      ...s,
      tarjetas: s.tarjetas.filter((t) => t.id !== id),
      compras: s.compras.filter((c) => c.tarjetaId !== id),
      pagosPuntuales: s.pagosPuntuales.filter((p) => p.tarjetaId !== id),
    }));
    sync(() => deleteTarjeta(userIdRef.current, id));
  }, [sync]);

  // ---------- Compras ----------
  const addCompra = useCallback((c) => {
    const valorCuota = c.valorCuota != null
      ? Number(c.valorCuota)
      : (Number(c.valorConInteres || c.valorCompra || 0) / Math.max(1, Number(c.cantCuotas || 1)));
    const compra = {
      id: crypto.randomUUID(),
      revisado: {},
      esCompartida: false,
      divididaEntre: '',
      valorPorPersona: null,
      ...c,
      valorCuota: Math.round(valorCuota),
    };
    setState((s) => ({ ...s, compras: [...s.compras, compra] }));
    sync(() => saveCompra(userIdRef.current, compra));
  }, [sync]);

  const updateCompra = useCallback((id, patch) => {
    setState((s) => {
      const newCompras = s.compras.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        if (patch.valorConInteres != null || patch.valorCompra != null || patch.cantCuotas != null) {
          const base = Number(next.valorConInteres || next.valorCompra || 0);
          next.valorCuota = Math.round(base / Math.max(1, Number(next.cantCuotas || 1)));
        }
        if (patch.valorCuota != null) next.valorCuota = Number(patch.valorCuota);
        return next;
      });
      // Sync la compra actualizada
      const updated = newCompras.find((c) => c.id === id);
      if (updated) sync(() => saveCompra(userIdRef.current, updated));
      return { ...s, compras: newCompras };
    });
  }, [sync]);

  const removeCompra = useCallback((id) => {
    setState((s) => ({ ...s, compras: s.compras.filter((c) => c.id !== id) }));
    sync(() => deleteCompra(userIdRef.current, id));
  }, [sync]);

  const toggleRevisado = useCallback((id, ym) => {
    setState((s) => {
      const newCompras = s.compras.map((c) =>
        c.id === id
          ? { ...c, revisado: { ...(c.revisado || {}), [ym]: !c.revisado?.[ym] } }
          : c
      );
      const updated = newCompras.find((c) => c.id === id);
      if (updated) sync(() => saveCompra(userIdRef.current, updated));
      return { ...s, compras: newCompras };
    });
  }, [sync]);

  // ---------- Pagos puntuales ----------
  const addPagoPuntual = useCallback((p) => {
    const pago = { id: crypto.randomUUID(), ...p };
    setState((s) => ({ ...s, pagosPuntuales: [...s.pagosPuntuales, pago] }));
    sync(() => savePagoPuntual(userIdRef.current, pago));
  }, [sync]);

  const removePagoPuntual = useCallback((id) => {
    setState((s) => ({ ...s, pagosPuntuales: s.pagosPuntuales.filter((p) => p.id !== id) }));
    sync(() => deletePagoPuntual(userIdRef.current, id));
  }, [sync]);

  // ---------- Reset ----------
  const resetAll = useCallback(async () => {
    if (!userIdRef.current) return;
    const uid = userIdRef.current;
    setState(empty());
    // Borrar todo en Supabase
    await Promise.all([
      supabase.from('pagos_puntuales').delete().eq('user_id', uid),
      supabase.from('compras').delete().eq('user_id', uid),
      supabase.from('tarjetas').delete().eq('user_id', uid),
      supabase.from('sueldos').delete().eq('user_id', uid),
    ]);
    // Reinsertar tarjetas por defecto
    const defaults = await insertDefaultTarjetas(uid);
    setState((s) => ({ ...s, tarjetas: defaults }));
  }, []);

  const importJson = useCallback(async (obj) => {
    if (!obj || typeof obj !== 'object' || !userIdRef.current) return;
    const uid = userIdRef.current;

    // Limpiar todo primero
    await Promise.all([
      supabase.from('pagos_puntuales').delete().eq('user_id', uid),
      supabase.from('compras').delete().eq('user_id', uid),
      supabase.from('tarjetas').delete().eq('user_id', uid),
      supabase.from('sueldos').delete().eq('user_id', uid),
    ]);

    // Insertar tarjetas y mapear IDs
    const idMap = {};
    const tarjetas = [];
    for (const t of obj.tarjetas || []) {
      const { data, error } = await supabase
        .from('tarjetas')
        .insert({ user_id: uid, nombre: t.nombre, tipo: t.tipo, color: t.color })
        .select('id, nombre, tipo, color')
        .single();
      if (!error && data) {
        idMap[t.id] = data.id;
        tarjetas.push(data);
      }
    }

    // Insertar sueldos
    const sueldos = {};
    for (const [ym, s] of Object.entries(obj.sueldos || {})) {
      await saveSueldo(uid, ym, { sueldo: s.sueldo, ingresosExtra: s.ingresosExtra || [] });
      sueldos[ym] = { sueldo: s.sueldo, ingresosExtra: s.ingresosExtra || [] };
    }

    // Insertar compras
    const compras = [];
    for (const c of obj.compras || []) {
      const newId = crypto.randomUUID();
      const tarjetaId = idMap[c.tarjetaId] || c.tarjetaId;
      const compra = { ...c, id: newId, tarjetaId };
      await saveCompra(uid, compra);
      compras.push(compra);
    }

    // Insertar pagos
    const pagosPuntuales = [];
    for (const p of obj.pagosPuntuales || []) {
      const newId = crypto.randomUUID();
      const tarjetaId = idMap[p.tarjetaId] || p.tarjetaId;
      const pago = { ...p, id: newId, tarjetaId };
      await savePagoPuntual(uid, pago);
      pagosPuntuales.push(pago);
    }

    setState({ tarjetas, sueldos, compras, pagosPuntuales });
  }, []);

  return {
    state, loading, syncError, clearSyncError,
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

    const porTarjeta = {};
    for (const t of state.tarjetas) porTarjeta[t.id] = { tarjeta: t, items: [], total: 0 };

    for (const c of state.compras) {
      const cuota = cuotaDelMes(c, ym);
      if (!cuota) continue;
      if (!porTarjeta[c.tarjetaId]) continue;
      porTarjeta[c.tarjetaId].items.push({ compra: c, ...cuota });
      porTarjeta[c.tarjetaId].total += cuota.valorCuota;
    }

    for (const p of state.pagosPuntuales) {
      if (p.mesYM !== ym) continue;
      if (!porTarjeta[p.tarjetaId]) continue;
      porTarjeta[p.tarjetaId].items.push({ puntual: p, valorCuota: Number(p.monto) || 0, numCuota: 1 });
      porTarjeta[p.tarjetaId].total += Number(p.monto) || 0;
    }

    const gastos = Object.values(porTarjeta).reduce((a, b) => a + b.total, 0);
    const saldo = ingresos - gastos;

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
