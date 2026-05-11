import { supabase } from './supabase';

// ─── Mapeo snake_case ↔ camelCase ─────────────────────────────

// Normaliza periodos para subscripciones: ordena por inicio y filtra inválidos.
function normalizePeriodos(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((p) => p && p.inicio)
    .map((p) => ({ inicio: p.inicio, fin: p.fin || null }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

function compraToDb(userId, c) {
  let periodos = c.esSubscripcion ? normalizePeriodos(c.periodos) : [];
  // Si es subscripción y no hay periodos pero sí mesInicio, sintetiza un único período.
  if (c.esSubscripcion && periodos.length === 0 && c.mesInicio) {
    periodos = [{ inicio: c.mesInicio, fin: c.mesFin || null }];
  }
  // Mantenemos mesInicio/mesFin coherentes con el primer/último período para compat.
  const mesInicio = c.esSubscripcion && periodos.length
    ? periodos[0].inicio
    : c.mesInicio;
  const mesFin = c.esSubscripcion && periodos.length
    ? (periodos[periodos.length - 1].fin || null)
    : (c.mesFin || null);

  return {
    id: c.id,
    user_id: userId,
    tarjeta_id: c.tarjetaId,
    descripcion: c.descripcion || '',
    valor_compra: Number(c.valorCompra) || 0,
    valor_con_interes: Number(c.valorConInteres) || 0,
    cant_cuotas: Number(c.cantCuotas) || 1,
    mes_inicio: mesInicio,
    valor_cuota: Number(c.valorCuota) || 0,
    es_compartida: c.esCompartida || false,
    dividida_entre: c.divididaEntre || '',
    valor_por_persona: c.valorPorPersona != null ? Number(c.valorPorPersona) : null,
    es_subscripcion: !!c.esSubscripcion,
    mes_fin: mesFin,
    periodos,
    personas_ids: Array.isArray(c.personasIds) ? c.personasIds : [],
    revisado: c.revisado || {},
  };
}

function compraFromDb(row) {
  const esSubscripcion = !!row.es_subscripcion;
  let periodos = normalizePeriodos(row.periodos);
  // Compat: si es subscripción y no hay periodos en BD, los sintetiza desde mesInicio/mesFin.
  if (esSubscripcion && periodos.length === 0 && row.mes_inicio) {
    periodos = [{ inicio: row.mes_inicio, fin: row.mes_fin || null }];
  }
  return {
    id: row.id,
    tarjetaId: row.tarjeta_id,
    descripcion: row.descripcion,
    valorCompra: row.valor_compra,
    valorConInteres: row.valor_con_interes,
    cantCuotas: row.cant_cuotas,
    mesInicio: row.mes_inicio,
    valorCuota: row.valor_cuota,
    esCompartida: row.es_compartida,
    divididaEntre: row.dividida_entre,
    valorPorPersona: row.valor_por_persona,
    esSubscripcion,
    mesFin: row.mes_fin || null,
    periodos,
    personasIds: Array.isArray(row.personas_ids) ? row.personas_ids : [],
    revisado: row.revisado || {},
  };
}

function liquidacionFromDb(row) {
  return {
    id: row.id,
    personaId: row.persona_id,
    mesYM: row.mes_ym,
    monto: row.monto,
    fecha: row.fecha,
    nota: row.nota || '',
  };
}

function liquidacionToDb(userId, l) {
  return {
    id: l.id,
    user_id: userId,
    persona_id: l.personaId,
    mes_ym: l.mesYM,
    monto: Number(l.monto) || 0,
    fecha: l.fecha,
    nota: l.nota || '',
  };
}

function pagoToDb(userId, p) {
  return {
    id: p.id,
    user_id: userId,
    tarjeta_id: p.tarjetaId,
    mes_ym: p.mesYM,
    descripcion: p.descripcion || '',
    monto: Number(p.monto) || 0,
  };
}

function pagoFromDb(row) {
  return {
    id: row.id,
    tarjetaId: row.tarjeta_id,
    mesYM: row.mes_ym,
    descripcion: row.descripcion,
    monto: row.monto,
  };
}

// ─── Cargar todos los datos ───────────────────────────────────

export async function loadAllData(userId) {
  const [tarjetasRes, sueldosRes, comprasRes, pagosRes, personasRes, liquidacionesRes] = await Promise.all([
    supabase.from('tarjetas').select('*').eq('user_id', userId),
    supabase.from('sueldos').select('*').eq('user_id', userId),
    supabase.from('compras').select('*').eq('user_id', userId),
    supabase.from('pagos_puntuales').select('*').eq('user_id', userId),
    supabase.from('personas').select('*').eq('user_id', userId).order('nombre'),
    supabase.from('liquidaciones').select('*').eq('user_id', userId),
  ]);

  // Tarjetas
  const tarjetas = (tarjetasRes.data || []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    tipo: t.tipo,
    color: t.color,
    archivada: !!t.archivada,
  }));

  // Sueldos: filas → diccionario { 'YYYY-MM': { sueldo, ingresosExtra } }
  const sueldos = {};
  for (const row of sueldosRes.data || []) {
    sueldos[row.ym] = {
      sueldo: row.sueldo,
      ingresosExtra: row.ingresos_extra || [],
    };
  }

  // Compras
  const compras = (comprasRes.data || []).map(compraFromDb);

  // Pagos puntuales
  const pagosPuntuales = (pagosRes.data || []).map(pagoFromDb);

  // Personas
  const personas = (personasRes.data || []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    color: p.color,
    telefono: p.telefono || null,
  }));

  // Liquidaciones: si la tabla no existe en BD aún, fallamos suave devolviendo [].
  const liquidaciones = liquidacionesRes.error
    ? []
    : (liquidacionesRes.data || []).map(liquidacionFromDb);

  return { tarjetas, sueldos, compras, pagosPuntuales, personas, liquidaciones };
}

// ─── Tarjetas ─────────────────────────────────────────────────

export async function saveTarjeta(userId, t) {
  const { error } = await supabase.from('tarjetas').upsert({
    id: t.id,
    user_id: userId,
    nombre: t.nombre,
    tipo: t.tipo,
    color: t.color,
    archivada: !!t.archivada,
  });
  if (error) throw error;
}

export async function archiveTarjetaDb(userId, id) {
  const { error } = await supabase
    .from('tarjetas')
    .update({ archivada: true })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function unarchiveTarjetaDb(userId, id) {
  const { error } = await supabase
    .from('tarjetas')
    .update({ archivada: false })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteTarjeta(userId, id) {
  const { error } = await supabase
    .from('tarjetas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateTarjetaDb(userId, id, patch) {
  const updates = {};
  if (patch.nombre != null) updates.nombre = patch.nombre;
  if (patch.tipo != null) updates.tipo = patch.tipo;
  if (patch.color != null) updates.color = patch.color;
  if (patch.archivada != null) updates.archivada = !!patch.archivada;

  const { error } = await supabase
    .from('tarjetas')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Sueldos ──────────────────────────────────────────────────

export async function saveSueldo(userId, ym, sueldoObj) {
  const { error } = await supabase.from('sueldos').upsert({
    user_id: userId,
    ym,
    sueldo: Number(sueldoObj.sueldo) || 0,
    ingresos_extra: sueldoObj.ingresosExtra || [],
  }, { onConflict: 'user_id,ym' });
  if (error) throw error;
}

// ─── Compras ──────────────────────────────────────────────────

export async function saveCompra(userId, c) {
  const { error } = await supabase.from('compras').upsert(compraToDb(userId, c));
  if (error) throw error;
}

export async function deleteCompra(userId, id) {
  const { error } = await supabase
    .from('compras')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Pagos Puntuales ──────────────────────────────────────────

export async function savePagoPuntual(userId, p) {
  const { error } = await supabase.from('pagos_puntuales').upsert(pagoToDb(userId, p));
  if (error) throw error;
}

export async function deletePagoPuntual(userId, id) {
  const { error } = await supabase
    .from('pagos_puntuales')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Personas ─────────────────────────────────────────────────

export async function savePersona(userId, p) {
  const { error } = await supabase.from('personas').upsert({
    id: p.id,
    user_id: userId,
    nombre: p.nombre,
    color: p.color || '#64748b',
    telefono: p.telefono || null,
  });
  if (error) throw error;
}

export async function deletePersona(userId, id) {
  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Liquidaciones ────────────────────────────────────────────

export async function saveLiquidacion(userId, l) {
  const { error } = await supabase.from('liquidaciones').upsert(liquidacionToDb(userId, l));
  if (error) throw error;
}

export async function deleteLiquidacion(userId, id) {
  const { error } = await supabase
    .from('liquidaciones')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Migración localStorage → Supabase ───────────────────────

export async function migrateLocalStorage(userId) {
  const raw = localStorage.getItem('finanzas-app-v1');
  if (!raw || localStorage.getItem('finanzas-app-v1-migrated')) return false;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return false;
  }

  if (!data.tarjetas?.length && !data.compras?.length) return false;

  // 1. Insertar tarjetas y construir mapa oldId → newUuid
  const idMap = {};
  for (const t of data.tarjetas || []) {
    const { data: inserted, error } = await supabase
      .from('tarjetas')
      .insert({ user_id: userId, nombre: t.nombre, tipo: t.tipo, color: t.color })
      .select('id')
      .single();
    if (error) throw error;
    idMap[t.id] = inserted.id;
  }

  // 2. Insertar sueldos
  for (const [ym, obj] of Object.entries(data.sueldos || {})) {
    await supabase.from('sueldos').upsert({
      user_id: userId,
      ym,
      sueldo: Number(obj.sueldo) || 0,
      ingresos_extra: obj.ingresosExtra || [],
    }, { onConflict: 'user_id,ym' });
  }

  // 3. Insertar compras con tarjeta_id remapeado
  for (const c of data.compras || []) {
    const newTarjetaId = idMap[c.tarjetaId];
    if (!newTarjetaId) continue; // tarjeta no encontrada, saltar
    await supabase.from('compras').insert({
      user_id: userId,
      tarjeta_id: newTarjetaId,
      descripcion: c.descripcion || '',
      valor_compra: Number(c.valorCompra) || 0,
      valor_con_interes: Number(c.valorConInteres) || 0,
      cant_cuotas: Number(c.cantCuotas) || 1,
      mes_inicio: c.mesInicio || '',
      valor_cuota: Number(c.valorCuota) || 0,
      es_compartida: c.esCompartida || false,
      dividida_entre: c.divididaEntre || '',
      valor_por_persona: c.valorPorPersona != null ? Number(c.valorPorPersona) : null,
      revisado: c.revisado || {},
    });
  }

  // 4. Insertar pagos puntuales con tarjeta_id remapeado
  for (const p of data.pagosPuntuales || []) {
    const newTarjetaId = idMap[p.tarjetaId];
    if (!newTarjetaId) continue;
    await supabase.from('pagos_puntuales').insert({
      user_id: userId,
      tarjeta_id: newTarjetaId,
      mes_ym: p.mesYM || '',
      descripcion: p.descripcion || '',
      monto: Number(p.monto) || 0,
    });
  }

  // 5. Marcar migración completada
  localStorage.setItem('finanzas-app-v1-migrated', 'true');
  localStorage.removeItem('finanzas-app-v1');

  return true;
}
