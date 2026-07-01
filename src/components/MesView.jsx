import { useResumenMes, useDeudasCompartidas } from '../store';
import SegmentedTabs from './SegmentedTabs';
import ResumenTab from './ResumenTab';
import GastosTab from './GastosTab';
import SueldoBlock from './SueldoBlock';
import ComprasCompartidas from './ComprasCompartidas';
import { IconChart, IconUp, IconCard, IconUsers } from './icons';

export default function MesView({ ym, f, tab, setTab, registerSignal }) {
  const resumen = useResumenMes(f.state, ym);
  const deudas = useDeudasCompartidas(f.state, ym);
  const tarjetasActivas = f.state.tarjetas.filter((t) => !t.archivada);

  const numItems = Object.values(resumen.porTarjeta).reduce((a, b) => a + b.items.length, 0);
  const tabs = [
    { k: 'resumen',     label: 'Resumen',     icon: <IconChart size={16} /> },
    { k: 'ingresos',    label: 'Ingresos',    icon: <IconUp size={16} /> },
    { k: 'gastos',      label: 'Gastos',      icon: <IconCard size={16} />,  badge: numItems || null },
    { k: 'compartidas', label: 'Compartidas', icon: <IconUsers size={16} />, badge: resumen.compartidas.length || null },
  ];

  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'resumen' && (
        <div className="animate-fadein">
          <ResumenTab ym={ym} f={f} resumen={resumen} />
        </div>
      )}

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
        <div className="animate-fadein">
          <GastosTab ym={ym} f={f} resumen={resumen} tarjetasActivas={tarjetasActivas} personas={f.state.personas || []} registerSignal={registerSignal} />
        </div>
      )}

      {tab === 'compartidas' && (
        <div className="animate-fadein">
          <ComprasCompartidas
            compartidas={resumen.compartidas}
            deudas={deudas}
            tarjetas={f.state.tarjetas}
            personas={f.state.personas || []}
            ym={ym}
            updateCompra={f.updateCompra}
            addLiquidacion={f.addLiquidacion}
            removeLiquidacion={f.removeLiquidacion}
          />
        </div>
      )}
    </div>
  );
}
