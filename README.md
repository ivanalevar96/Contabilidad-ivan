# Balance — Finanzas personales

Aplicación web para el control de gastos mensuales y anuales (en CLP). Reemplaza el clásico Excel mes-a-mes con:

- Ingreso de sueldo + ingresos extra por mes
- Compras en cuotas agrupadas por tarjeta (o por persona a la que se debe)
- Cálculo automático de la cuota del mes (`N/total`) a partir del mes de inicio
- **Finalización anticipada** de una compra en cuotas (ej: prepago de un crédito)
- Subscripciones con ciclos (activar/desactivar por rango de meses)
- Compras compartidas con otras personas, con monto por persona y registro de abonos
- Mensaje de cobro por WhatsApp con desglose
- Pagos puntuales no recurrentes
- Dashboard mensual: ingresos, gastos, saldo, % de carga, distribución y tendencia
- Dashboard anual: 12 meses con barras agrupadas, totales y promedios

## Diseño

Dirección visual **"Balance"**: moderna, minimalista y formal.

- **Layout de plataforma**: sidebar de navegación + header con navegador de mes/año.
- **Tema claro/oscuro** conmutable, con persistencia en `localStorage`.
- **Tokens** definidos como CSS variables (`:root` y `[data-theme="dark"]`) y consumidos desde Tailwind (`bg-surface`, `text-text-2`, `border-border`, `bg-accent`…).
- Acento **teal**, neutros cálidos, colores semánticos (`--positive` / `--negative`).
- Tipografía **IBM Plex Sans** para UI e **IBM Plex Mono** (`tabular-nums`, clase `.num`) para toda cifra monetaria, porcentaje o etiqueta de eje.
- Iconos de línea (SVG inline en [`src/components/icons.jsx`](src/components/icons.jsx)).

## Stack

- React 18
- Vite 5
- Tailwind CSS 3 (colores mapeados a CSS variables)
- [Supabase](https://supabase.com/) — autenticación y persistencia en la nube
- [Recharts](https://recharts.org/) — donut y gráfico de tendencia
- [Sonner](https://sonner.emilkowal.ski/) — notificaciones toast

## Datos

Los datos se sincronizan en **Supabase** (no en `localStorage`). Incluye **Exportar / Importar JSON** para respaldo manual.

### Variables de entorno

Crea un archivo `.env.local` en la raíz (no se versiona):

```bash
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

> En Vercel estas variables se configuran en el panel del proyecto. Para el preview local **deben** existir en `.env.local`, y hay que **reiniciar** el dev server tras crearlas (Vite solo las lee al arrancar).

### Esquema de base de datos

Ejecuta en el SQL Editor de Supabase, en orden:

1. `supabase-schema.sql`
2. `supabase-migration-personas.sql`
3. `supabase-migration-subscripciones.sql`
4. `supabase-migration-telefono.sql`
5. `supabase-migration-liquidaciones.sql`
6. `supabase-migration-prepago.sql`

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

Compatible con Vercel / Netlify / cualquier hosting estático. El output de `npm run build` queda en `dist/`. Recuerda configurar las variables de entorno de Supabase en el hosting.
