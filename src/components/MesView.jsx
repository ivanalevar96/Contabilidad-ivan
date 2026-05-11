import { useState } from 'react';
import { monthLabel } from '../utils/format';
import { useResumenMes } from '../store';
import SegmentedTabs from './SegmentedTabs';
import ResumenTab from './ResumenTab';
import GastosTab from './GastosTab';
import SueldoBlock from './SueldoBlock';
import ComprasCompartidas from './ComprasCompartidas';

export default function MesView({ ym, f }) {
  const resumen = useResumenMes(f.state, ym);
  const [tab, setTab] = useState('resumen');
  const tarjetasActivas = f.state.tarjetas.filter((t) => !t.archivada);

  const numItems = Object.values(resumen.porTarjeta).reduce((a, b) => a + b.items.length, 0);
  const tabs = [
    { k: 'resumen',     label: 'Resumen',     icon: '📊' },
    { k: 'ingresos',    label: 'Ingresos',    icon: '💰' },
    { k: 'gastos',      label: 'Gastos',      icon: '💳', badge: numItems || null },
    { k: 'compartidas', label: 'Compartidas', icon: '👥', badge: resumen.compartidas.length || null },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{monthLabel(ym)}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Vista detallada del mes</p>
        </div>
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === 'resumen' && <ResumenTab ym={ym} f={f} resumen={resumen} />}

      {tab === 'ingresos' && (
        <div className="animate-fadein">
          <SueldoBlock
            ym={ym}
            sueldoObj={resumen.sueldoObj}
            resumen={resumen}
            setSueldo={f.setSueldo}
            addIngresoExtra={f.addIngresoExtra}
            removeIngresoExtra={f.removeIngresoExtra}
          />
        </div>
      )}

      {tab === 'gastos' && (
        <GastosTab ym={ym} f={f} resumen={resumen} tarjetasActivas={tarjetasActivas} personas={f.state.personas || []} />
      )}

      {tab === 'compartidas' && (
        <div className="animate-fadein">
          <ComprasCompartidas
            compartidas={resumen.compartidas}
            tarjetas={f.state.tarjetas}
            personas={f.state.personas || []}
            updateCompra={f.updateCompra}
          />
        </div>
      )}
    </div>
  );
}
