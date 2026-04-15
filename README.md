# Finanzas

Aplicación web para control de gastos mensuales y anuales. Reemplaza el Excel mes-a-mes con:

- Ingreso de sueldo + ingresos extra por mes
- Compras en cuotas agrupadas por tarjeta (o por persona a la que se debe)
- Cálculo automático de la cuota del mes (`N/total`) a partir del mes de inicio
- Compras compartidas con otras personas (con monto por persona)
- Pagos puntuales no recurrentes
- Dashboard mensual: ingresos, gastos, saldo, % de carga
- Dashboard anual: gráfico de 12 meses con totales y promedios

Los datos se guardan en `localStorage` del navegador. Incluye **Exportar/Importar JSON** para respaldo.

## Stack

- React 18
- Vite 5
- Tailwind CSS 3

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Compatible con Vercel / Netlify / cualquier hosting estático. El output de `npm run build` queda en `dist/`.
