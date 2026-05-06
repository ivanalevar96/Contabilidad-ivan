import { useState, useMemo } from 'react';
import TarjetaBloque from './TarjetaBloque';
import CompraForm from './CompraForm';
import PagoPuntualForm from './PagoPuntualForm';
import { fmt } from '../utils/format';

export default function GastosTab({ ym, f, resumen, tarjetasActivas, personas = [] }) {
  const [mode, setMode] = useState(null); // null | 'compra' | 'pago'
  const [editing, setEditing] = useState(null); // compra en edición
  const [filterTarjeta, setFilterTarjeta] = useState('');
  const [search, setSearch] = useState('');

  const startEdit = (c) => {
    setMode(null);
    setEditing(c);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitEdit = (patch) => {
    if (!editing) return;
    f.updateCompra(editing.id, patch);
    setEditing(null);
  };

  const bloques = useMemo(() => {
    let arr = Object.values(resumen.porTarjeta);
    if (filterTarjeta) arr = arr.filter((b) => b.tarjeta.id === filterTarjeta);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr
        .map((b) => ({
          ...b,
          items: b.items.filter((it) =>
            (it.compra?.descripcion || it.puntual?.descripcion || '').toLowerCase().includes(q)
          ),
        }))
        .filter((b) => b.items.length > 0);
    }
    return arr;
  }, [resumen.porTarjeta, filterTarjeta, search]);

  const totalFiltrado = bloques.reduce((a, b) => a + b.items.reduce((aa, it) => aa + it.valorCuota, 0), 0);

  return (
    <div className="space-y-4 animate-fadein">
      <section className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            className="input"
            placeholder="🔍  Buscar descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto min-w-[160px]"
          value={filterTarjeta}
          onChange={(e) => setFilterTarjeta(e.target.value)}
        >
          <option value="">Todas las tarjetas</option>
          {Object.values(resumen.porTarjeta).map((b) => (
            <option key={b.tarjeta.id} value={b.tarjeta.id}>{b.tarjeta.nombre}</option>
          ))}
        </select>
        <div className="text-xs text-slate-400">
          {bloques.reduce((a, b) => a + b.items.length, 0)} item(s) · <span className="text-cyan-300 font-semibold">{fmt(totalFiltrado)}</span>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setMode(mode === 'pago' ? null : 'pago')}>+ Pago puntual</button>
          <button className="btn-primary" onClick={() => setMode(mode === 'compra' ? null : 'compra')}>+ Compra en cuotas</button>
        </div>
      </section>

      {editing && (
        <CompraForm
          tarjetas={tarjetasActivas}
          personas={personas}
          mesInicio={editing.mesInicio || ym}
          onAdd={submitEdit}
          onClose={() => setEditing(null)}
          initial={editing}
        />
      )}
      {!editing && mode === 'compra' && (
        <CompraForm tarjetas={tarjetasActivas} personas={personas} mesInicio={ym} onAdd={f.addCompra} onClose={() => setMode(null)} />
      )}
      {!editing && mode === 'pago' && (
        <PagoPuntualForm tarjetas={tarjetasActivas} mesYM={ym} onAdd={f.addPagoPuntual} onClose={() => setMode(null)} />
      )}

      <div className="space-y-4">
        {bloques.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            {search || filterTarjeta
              ? 'Sin resultados para los filtros aplicados.'
              : 'Sin gastos registrados este mes. Agrega una compra o pago puntual.'}
          </div>
        ) : (
          bloques.map((b) => (
            <TarjetaBloque
              key={b.tarjeta.id}
              bloque={b}
              ym={ym}
              toggleRevisado={f.toggleRevisado}
              removeCompra={f.removeCompra}
              removePagoPuntual={f.removePagoPuntual}
              onEditCompra={startEdit}
              updateCompra={f.updateCompra}
            />
          ))
        )}
      </div>
    </div>
  );
}
