import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { currentYM, monthsBetween, uid, addMonths } from './utils/format';
import {
  loadAllData, migrateLocalStorage,
  saveTarjeta, updateTarjetaDb, deleteTarjeta,
  archiveTarjetaDb, unarchiveTarjetaDb,
  saveSueldo,
  saveCompra, deleteCompra,
  savePagoPuntual, deletePagoPuntual,
  savePersona, deletePersona,
  saveLiquidacion, deleteLiquidacion,
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

const empty = () => ({
  tarjetas: [],
  sueldos: {},
  compras: [],
  pagosPuntuales: [],
  personas: [],
  liquidaciones: [],
});

/**
 * Devuelve el monto que MI bolsillo realmente paga este mes para esta compra.
 * Compras compartidas: `valorPorPersona` es lo que paga CADA persona asociada;
 * mi parte = cuota total − (valorPorPersona × n personas). Si la otra persona paga
 * el 100%, valorPorPersona = cuota → mi parte = 0.
 */
export function miParteCompra(compra, valorCuotaCompleto) {
  if (!compra?.esCompartida) return valorCuotaCompleto;
  if (compra.valorPorPersona == null || compra.valorPorPersona === '') return valorCuotaCompleto;
  const vpp = Number(compra.valorPorPersona);
  if (!Number.isFinite(vpp)) return valorCuotaCompleto;
  const nOtros = Array.isArray(compra.personasIds) && compra.personasIds.length > 0
    ? compra.personasIds.length
    : 1;
  return Math.max(0, valorCuotaCompleto - vpp * nOtros);
}

/** Cuota aplicable a un mes YYYY-MM: retorna { numCuota, valorCuota, periodo? } o null. */
export function cuotaDelMes(compra, ym) {
  if (!compra) return null;
  // Subscripción: itera períodos. Cada período es { inicio, fin? }.
  // numCuota = nº acumulado de meses activos a través de todos los períodos hasta ym (inclusive).
  if (compra.esSubscripcion) {
    const periodos = Array.isArray(compra.periodos) && compra.periodos.length
      ? compra.periodos
      : (compra.mesInicio ? [{ inicio: compra.mesInicio, fin: compra.mesFin || null }] : []);
    let acumulado = 0;
    for (const p of periodos) {
      if (!p?.inicio) continue;
      const desdeInicio = monthsBetween(p.inicio, ym);     // ym - inicio
      const hastaFin    = p.fin ? monthsBetween(ym, p.fin) : Infinity; // fin - ym
      if (desdeInicio < 0) continue;       // ym < inicio: aún no entra a este período
      if (hastaFin < 0) {                  // ym > fin: período ya cerró, suma su largo y sigue
        acumulado += monthsBetween(p.inicio, p.fin) + 1;
        continue;
      }
      // ym cae dentro de este período
      acumulado += desdeInicio + 1;
      return {
        numCuota: acumulado,
        valorCuota: Number(compra.valorCuota) || 0,
        periodo: p,
      };
    }
    return null;
  }
  // Compra en cuotas tradicional.
  if (!compra.mesInicio) return null;
  const n = monthsBetween(compra.mesInicio, ym) + 1;
  if (n < 1 || n > (compra.cantCuotas || 0)) return null;
  return { numCuota: n, valorCuota: Number(compra.valorCuota) || 0 };
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
        await migrateLocalStorage(userId);

        // Cargar datos de Supabase
        const data = await loadAllData(userId);

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
    const nueva = { id: crypto.randomUUID(), color: '#64748b', tipo: 'tarjeta', archivada: false, ...t };
    setState((s) => ({ ...s, tarjetas: [...s.tarjetas, nueva] }));
    sync(() => saveTarjeta(userIdRef.current, nueva));
  }, [sync]);

  const updateTarjeta = useCallback((id, patch) => {
    setState((s) => ({ ...s, tarjetas: s.tarjetas.map((t) => t.id === id ? { ...t, ...patch } : t) }));
    sync(() => updateTarjetaDb(userIdRef.current, id, patch));
  }, [sync]);

  // Archiva la tarjeta: deja de ofrecerse para nuevas compras/pagos pero
  // conserva el historial. La tarjeta sigue visible en meses con movimientos.
  const archiveTarjeta = useCallback((id) => {
    setState((s) => ({ ...s, tarjetas: s.tarjetas.map((t) => t.id === id ? { ...t, archivada: true } : t) }));
    sync(() => archiveTarjetaDb(userIdRef.current, id));
  }, [sync]);

  const unarchiveTarjeta = useCallback((id) => {
    setState((s) => ({ ...s, tarjetas: s.tarjetas.map((t) => t.id === id ? { ...t, archivada: false } : t) }));
    sync(() => unarchiveTarjetaDb(userIdRef.current, id));
  }, [sync]);

  // Borrado físico: elimina la tarjeta y, por cascade, su historial de compras y pagos.
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
      esSubscripcion: false,
      mesFin: null,
      periodos: [],
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
        // Las subscripciones ignoran cantCuotas/valorCompra: su valorCuota se setea directo.
        if (!next.esSubscripcion && (patch.valorConInteres != null || patch.valorCompra != null || patch.cantCuotas != null)) {
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

  // ---------- Personas ----------
  const addPersona = useCallback((p) => {
    const nueva = { id: crypto.randomUUID(), color: '#64748b', ...p };
    setState((s) => ({ ...s, personas: [...s.personas, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)) }));
    sync(() => savePersona(userIdRef.current, nueva));
  }, [sync]);

  const updatePersona = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      personas: s.personas.map((p) => p.id === id ? { ...p, ...patch } : p).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    }));
    sync(() => {
      const updated = { id, color: '#64748b', nombre: '', ...patch };
      savePersona(userIdRef.current, updated);
    });
  }, [sync]);

  const removePersona = useCallback((id) => {
    setState((s) => ({
      ...s,
      personas: s.personas.filter((p) => p.id !== id),
      // Limpia la persona de cualquier compra compartida donde apareciera
      compras: s.compras.map((c) =>
        Array.isArray(c.personasIds) && c.personasIds.includes(id)
          ? { ...c, personasIds: c.personasIds.filter((pid) => pid !== id) }
          : c
      ),
    }));
    sync(() => deletePersona(userIdRef.current, id));
  }, [sync]);

  // ---------- Liquidaciones ----------
  const addLiquidacion = useCallback((l) => {
    const nueva = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString().slice(0, 10),
      nota: '',
      ...l,
    };
    setState((s) => ({ ...s, liquidaciones: [...(s.liquidaciones || []), nueva] }));
    sync(() => saveLiquidacion(userIdRef.current, nueva));
  }, [sync]);

  const removeLiquidacion = useCallback((id) => {
    setState((s) => ({ ...s, liquidaciones: (s.liquidaciones || []).filter((l) => l.id !== id) }));
    sync(() => deleteLiquidacion(userIdRef.current, id));
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
    addTarjeta, updateTarjeta, archiveTarjeta, unarchiveTarjeta, removeTarjeta,
    addCompra, updateCompra, removeCompra, toggleRevisado,
    addPagoPuntual, removePagoPuntual,
    addPersona, updatePersona, removePersona,
    addLiquidacion, removeLiquidacion,
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
      const miParte = miParteCompra(c, cuota.valorCuota);
      porTarjeta[c.tarjetaId].items.push({ compra: c, ...cuota, miParte });
      porTarjeta[c.tarjetaId].total += miParte;
    }

    for (const p of state.pagosPuntuales) {
      if (p.mesYM !== ym) continue;
      if (!porTarjeta[p.tarjetaId]) continue;
      porTarjeta[p.tarjetaId].items.push({ puntual: p, valorCuota: Number(p.monto) || 0, numCuota: 1 });
      porTarjeta[p.tarjetaId].total += Number(p.monto) || 0;
    }

    // Tarjetas archivadas solo aparecen en el mes si tienen movimientos.
    for (const id of Object.keys(porTarjeta)) {
      const b = porTarjeta[id];
      if (b.tarjeta.archivada && b.items.length === 0) delete porTarjeta[id];
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

/** Serie de N meses terminando en `ym` (incluido). Útil para sparklines. */
export function useTrailingMonths(state, ym, n = 6) {
  return useMemo(() => {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const k = addMonths(ym, -i);
      const sueldoObj = state.sueldos[k] || { sueldo: 0, ingresosExtra: [] };
      const ingresoBase = Number(sueldoObj.sueldo) || 0;
      const ingresoExtra = (sueldoObj.ingresosExtra || []).reduce((a, b) => a + (Number(b.monto) || 0), 0);
      const ingresos = ingresoBase + ingresoExtra;
      let gastos = 0;
      for (const c of state.compras) {
        const cuota = cuotaDelMes(c, k);
        if (cuota) gastos += miParteCompra(c, cuota.valorCuota);
      }
      for (const p of state.pagosPuntuales) {
        if (p.mesYM === k) gastos += Number(p.monto) || 0;
      }
      out.push({ ym: k, ingresos, gastos });
    }
    return out;
  }, [state, ym, n]);
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
        if (cuota) gastos += miParteCompra(c, cuota.valorCuota);
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
