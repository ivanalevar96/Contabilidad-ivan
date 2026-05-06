import { supabase } from './supabase';

// ─── Mapeo snake_case ↔ camelCase ─────────────────────────────

function compraToDb(userId, c) {
  return {
    id: c.id,
    user_id: userId,
    tarjeta_id: c.tarjetaId,
    descripcion: c.descripcion || '',
    valor_compra: Number(c.valorCompra) || 0,
    valor_con_interes: Number(c.valorConInteres) || 0,
    cant_cuotas: Number(c.cantCuotas) || 1,
    mes_inicio: c.mesInicio,
    valor_cuota: Number(c.valorCuota) || 0,
    es_compartida: c.esCompartida || false,
    dividida_entre: c.divididaEntre || '',
    valor_por_persona: c.valorPorPersona != null ? Number(c.valorPorPersona) : null,
    revisado: c.revisado || {},
  };
}

function compraFromDb(row) {
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
    revisado: row.revisado || {},
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
  const [tarjetasRes, sueldosRes, comprasRes, pagosRes] = await Promise.all([
    supabase.from('tarjetas').select('*').eq('user_id', userId),
    supabase.from('sueldos').select('*').eq('user_id', userId),
    supabase.from('compras').select('*').eq('user_id', userId),
    supabase.from('pagos_puntuales').select('*').eq('user_id', userId),
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

  return { tarjetas, sueldos, compras, pagosPuntuales };
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
