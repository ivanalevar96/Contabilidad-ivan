import { useState } from 'react';
import { fmt, monthLabel } from '../utils/format';
import { useResumenMes } from '../store';
import SueldoBlock from './SueldoBlock';
import KpiCard from './KpiCard';
import TarjetaBloque from './TarjetaBloque';
import ComprasCompartidas from './ComprasCompartidas';
import CompraForm from './CompraForm';
import PagoPuntualForm from './PagoPuntualForm';

export default function MesView({ ym, f }) {
  const resumen = useResumenMes(f.state, ym);
  const [mode, setMode] = useState(null); // null | 'compra' | 'pago'

  const porcentaje = resumen.ingresos > 0 ? Math.min(100, (resumen.gastos / resumen.ingresos) * 100) : 0;
  const colorBarra = porcentaje > 90 ? 'bg-rose-500' : porcentaje > 70 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="space-y-6">
      <SueldoBlock
        ym={ym}
        sueldoObj={resumen.sueldoObj}
        resumen={resumen}
        setSueldo={f.setSueldo}
        addIngresoExtra={f.addIngresoExtra}
        removeIngresoExtra={f.removeIngresoExtra}
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Ingresos"  value={resumen.ingresos} accent="green" />
        <KpiCard label="Gastos"    value={resumen.gastos}   accent="rose" />
        <KpiCard label="Saldo"     value={resumen.saldo}    accent={resumen.saldo < 0 ? 'rose' : 'cyan'} />
        <KpiCard label="% usado"   value={`${porcentaje.toFixed(1)}%`} accent="amber" sub="Gastos / Ingresos" />
      </section>

      <section className="card p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-slate-300">Carga del mes</div>
          <div className="text-xs text-slate-400">{fmt(resumen.gastos)} / {fmt(resumen.ingresos)}</div>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
          <div className={`h-full ${colorBarra} transition-all`} style={{ width: `${porcentaje}%` }} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tarjetas & personas · <span className="text-slate-400 font-normal">{monthLabel(ym)}</span></h2>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setMode(mode === 'pago' ? null : 'pago')}>+ Pago puntual</button>
            <button className="btn-primary" onClick={() => setMode(mode === 'compra' ? null : 'compra')}>+ Compra en cuotas</button>
          </div>
        </div>

        {mode === 'compra' && (
          <div className="mb-4">
            <CompraForm tarjetas={f.state.tarjetas} mesInicio={ym} onAdd={f.addCompra} onClose={() => setMode(null)} />
          </div>
        )}
        {mode === 'pago' && (
          <div className="mb-4">
            <PagoPuntualForm tarjetas={f.state.tarjetas} mesYM={ym} onAdd={f.addPagoPuntual} onClose={() => setMode(null)} />
          </div>
        )}

        <div className="space-y-4">
          {Object.values(resumen.porTarjeta).map((b) => (
            <TarjetaBloque
              key={b.tarjeta.id}
              bloque={b}
              ym={ym}
              toggleRevisado={f.toggleRevisado}
              removeCompra={f.removeCompra}
              removePagoPuntual={f.removePagoPuntual}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Compras compartidas del mes</h2>
        <ComprasCompartidas compartidas={resumen.compartidas} tarjetas={f.state.tarjetas} />
      </section>
    </div>
  );
}
