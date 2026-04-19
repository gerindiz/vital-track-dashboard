# VitalTrack — Dashboard de Telemetría Médica

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=20232A)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**VitalTrack** es una plataforma Full-Stack de monitoreo de cadena de frío en tiempo real para el transporte de insumos médicos críticos. Combina telemetría GPS, analítica térmica, sistema de alertas multinivel y generación de reportes regulatorios en una interfaz moderna con soporte de dark mode.

---

## Demo en Vivo

**[Ver VitalTrack en producción](https://vital-track-dashboard.vercel.app/)**

---

## Características

### Monitoreo en Tiempo Real
- **GPS simulado con trayectoria dinámica** — movimiento elíptico continuo sobre mapa interactivo Leaflet/OpenStreetMap
- **Actualización automática cada 2 segundos** — ticker que refresca posiciones sin recargar la página
- **Marcadores cromáticos** — azul (temperatura segura) / rojo (temperatura crítica) por unidad

### Sistema de Alertas Multinivel
- **Alerta preventiva** cuando temperatura > 5 °C — aviso temprano antes de la zona de riesgo
- **Alerta crítica** cuando temperatura > 8 °C — excursión confirmada, requiere acción inmediata
- **Detección de cruce de umbral** — no genera alertas duplicadas; detecta la transición de seguro a riesgo
- **Historial persistente en localStorage** — conserva las últimas 50 alertas entre sesiones
- **Badge de conteo** en el header con número de alertas críticas activas

### Panel de KPIs (KPIPanel)
- **% de envíos en rango seguro** — unidades entre 2 °C y 8 °C sobre el total de la flota
- **Temperatura promedio de la flota** — media en tiempo real
- **Incidentes en las últimas 24 hs** — conteo desde el historial de alertas persistido
- **Gráfico de dona interactivo** — distribución de unidades por estado (EN RUTA / CRÍTICO / ENTREGADO / EN ESPERA)

### Reportes y Exportaciones
- **Exportar CSV** — tabla completa de envíos con BOM UTF-8 (compatible con Excel en español)
- **Exportar Excel (.xlsx)** — usando ExcelJS con lazy loading
- **Reporte PDF de flota** — resumen ejecutivo + tabla completa generado con jsPDF + autotable
- **Reporte PDF por unidad** — telemetría individual con estado, coordenadas e historial de alertas; accesible desde cada fila de la tabla

### Dark Mode Completo
- **Toggle Moon/Sun** en el header para cambiar entre modo claro y oscuro
- **Preferencia persistida** en localStorage entre sesiones
- **Paleta médica**:
  - Fondo oscuro: `#0F172A` (azul profundo)
  - Tarjetas: `#1E293B`
  - Verde seguro: `#10B981`
  - Rojo crítico: `#EF4444`
  - Amarillo preventivo: `#F59E0B`

### UX y Rendimiento
- **Skeleton loading** — placeholders animados mientras cargan datos de Supabase (sin spinners)
- **Estado de error descriptivo** — mensaje con opción de reintentar si falla la conexión
- **Estado vacío** — mensaje cuando no hay envíos registrados
- **Diseño responsive** — funcional en móvil (375 px), tablet (768 px) y desktop
- **Code splitting automático** — jsPDF y ExcelJS se cargan solo cuando se usan; bundle inicial < 280 kB gzip

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| UI Framework | React | 19 |
| Lenguaje | TypeScript | 5.7 |
| Estilos | Tailwind CSS (Vite plugin) | 4.0 |
| Build tool | Vite | 6.4 |
| Base de datos | Supabase (PostgreSQL) | ^2.48 |
| Mapas | Leaflet + react-leaflet | 1.9 / 5.0 |
| Gráficos | Recharts | 3.7 |
| PDF | jsPDF + jspdf-autotable | 2.5 / 3.x |
| Excel | ExcelJS | 4.x |
| Animaciones | Motion | 12 |
| Notificaciones | react-hot-toast | 2.6 |
| Geocodificación | Nominatim (OpenStreetMap) | — |

---

## Estructura del Proyecto

```
vital-track-dashboard/
├── src/
│   ├── components/
│   │   ├── alerts/
│   │   │   └── AlertSystem.tsx       # Alertas críticas/preventivas + historial localStorage
│   │   ├── dashboard/
│   │   │   └── KPIPanel.tsx          # KPIs de flota + gráfico de dona por estado
│   │   ├── reports/
│   │   │   └── ReportGenerator.tsx   # Exportación CSV, PDF flota y PDF por unidad
│   │   ├── maps/                     # (disponible para componentes de mapa dedicados)
│   │   ├── forms/                    # (disponible para formularios extraídos)
│   │   └── ui/
│   │       └── Skeleton.tsx          # Skeleton loading reutilizable
│   ├── hooks/
│   │   └── useDarkMode.ts            # Toggle dark mode con persistencia localStorage
│   ├── services/
│   │   ├── supabase.ts               # Cliente Supabase singleton
│   │   └── enviosService.ts          # fetchEnvios, crearEnvio, eliminarEnvio
│   ├── types/
│   │   └── index.ts                  # Envio, EstadoEnvio, AlertaTemperatura, EstadisticasFlota
│   ├── constants/
│   │   └── index.ts                  # Umbrales de temperatura y claves de storage
│   ├── utils/
│   │   ├── exportExcel.ts            # Exportación .xlsx con ExcelJS (lazy)
│   │   └── geocoding.ts             # Geocodificación con Nominatim
│   ├── App.tsx                       # Componente raíz e integración
│   ├── main.tsx                      # Entry point
│   ├── index.css                     # Tailwind v4 + dark mode variant
│   └── vite-env.d.ts                 # Tipos de entorno Vite
├── .env.example                      # Variables de entorno requeridas
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Instalación

### Requisitos previos
- Node.js 18 o superior
- Cuenta en [Supabase](https://supabase.com) (plan gratuito suficiente)

### Paso a paso

**1. Clonar el repositorio**
```bash
git clone https://github.com/gerindiz/vital-track-dashboard.git
cd vital-track-dashboard
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar variables de entorno**
```bash
cp .env.example .env
```
Editá `.env` con tus credenciales de Supabase (ver sección siguiente).

**4. Crear la tabla en Supabase**

Ejecutá este SQL en el editor de Supabase:
```sql
create table envios (
  id      bigserial primary key,
  insumo  text        not null,
  temp    float8      not null,
  ubicacion text      not null,
  estado  text        not null default 'EN RUTA',
  lat     float8,
  long    float8,
  created_at timestamptz default now()
);

-- Habilitar Row Level Security (opcional, recomendado en producción)
alter table envios enable row level security;
create policy "Allow all" on envios for all using (true);
```

**5. Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

**6. Build de producción**
```bash
npm run build
npm run preview
```

---

## Variables de Entorno

Copiá `.env.example` como `.env` y completá:

| Variable | Descripción | Dónde encontrarla |
|----------|------------|-------------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima pública | Settings → API → anon / public |

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> La `anon key` es pública y está diseñada para usarse en el frontend. Nunca uses la `service_role` key en el cliente.

---

## Esquema de Base de Datos

Tabla `envios` en Supabase (PostgreSQL):

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | `bigserial` | No | Clave primaria autoincremental |
| `insumo` | `text` | No | Nombre del medicamento o insumo médico |
| `temp` | `float8` | No | Temperatura actual en grados Celsius |
| `ubicacion` | `text` | No | Ciudad o punto de tránsito |
| `estado` | `text` | No | `EN RUTA`, `CRÍTICO`, `ENTREGADO`, `EN ESPERA` |
| `lat` | `float8` | Sí | Latitud geográfica (geocodificada automáticamente) |
| `long` | `float8` | Sí | Longitud geográfica |
| `created_at` | `timestamptz` | Sí | Timestamp de registro (default: now()) |

---

## Umbrales de Temperatura

Definidos en `src/constants/index.ts`:

| Constante | Valor | Significado |
|-----------|-------|-------------|
| `TEMP_RANGO_MIN` | 2 °C | Límite inferior del rango seguro |
| `TEMP_RANGO_MAX` | 8 °C | Límite superior del rango seguro |
| `TEMP_PREVENTIVA` | 5 °C | Dispara alerta preventiva (amarilla) |
| `TEMP_CRITICA` | 8 °C | Dispara alerta crítica (roja) |

---

## Casos de Uso — Industria Farmacéutica

### Transporte de Vacunas y Biológicos
Las vacunas (influenza, COVID-19, hepatitis) requieren cadena de frío estricta entre 2 °C y 8 °C. Una excursión de temperatura no detectada puede invalidar lotes completos. VitalTrack monitorea cada unidad en tránsito y genera alertas antes de que la temperatura alcance el límite crítico, permitiendo intervenciones preventivas.

### Insulina y Medicamentos Termolábiles
La insulina pierde hasta un 30% de efectividad si se expone a temperaturas superiores a 8 °C por más de 24 horas. El sistema de alertas preventivas a 5 °C da tiempo suficiente para que el personal actúe antes de comprometer el producto.

### Transporte de Hemoderivados y Plasma
Los hemoderivados tienen ventanas de temperatura estrechas y tiempos de vida útil críticos. Los reportes PDF por unidad generados por VitalTrack documentan el historial de temperatura completo de cada despacho, cumpliendo con requisitos de trazabilidad de ANMAT y FDA.

### Muestras para Ensayos Clínicos
Las Buenas Prácticas Clínicas (GCP) exigen documentación de la cadena de custodia para muestras biológicas. Los registros exportables en CSV y PDF de VitalTrack sirven como evidencia de mantenimiento de temperatura para auditorías regulatorias.

### Traslado de Órganos para Trasplante
El tiempo de isquemia fría de los órganos es crítico. El monitoreo GPS en tiempo real con alertas inmediatas permite coordinar rutas alternativas cuando se detectan demoras o excursiones térmicas.

### Logística Hospitalaria Interna
Farmacias hospitalarias que distribuyen quimioterápicos, anticuerpos monoclonales o inmunosupresores entre pabellones pueden usar VitalTrack para registrar y auditar condiciones de transporte interno.

---

## Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo (http://localhost:3000)
npm run build     # Build de producción optimizado
npm run preview   # Preview del build de producción
npm run lint      # Verificación de tipos TypeScript (tsc --noEmit)
```

---

## Arquitectura de Decisiones

| Decisión | Alternativa descartada | Motivo |
|----------|----------------------|--------|
| Supabase como backend | Firebase, PocketBase | PostgreSQL nativo, RLS, SDK TypeScript de primera clase |
| Tailwind v4 CSS-first | Tailwind v3 + config.js | Sin archivo de configuración JS, configuración en CSS |
| ExcelJS en lugar de xlsx | xlsx@0.18.5 | xlsx tenía 3 vulnerabilidades high sin fix en npm |
| Lazy import para jsPDF y ExcelJS | Bundle estático | Reduce el bundle inicial de 1.8 MB a 280 kB gzip |
| Detección de cruce de umbral | Alerta por estado actual | Evita alertas duplicadas en cada tick de 2 segundos |
| localStorage para historial | Supabase tabla alertas | Sin costo adicional de BD; suficiente para uso de sesión |

---

## Licencia

MIT © 2025 VitalTrack
