# 🌡️ VitalTrack - Dashboard de Telemetría Logística Médica

![Versión](https://img.shields.io/badge/version-2.5.0-blue.svg)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**VitalTrack** es una solución Full-Stack de monitoreo en tiempo real diseñada para garantizar la integridad de la cadena de frío en el transporte de insumos médicos críticos. El sistema combina geolocalización satelital avanzada con analítica térmica dinámica.



## 🌐 Demo en Vivo
Puedes ver la aplicación funcionando aquí:  
**[👉 Ver VitalTrack Live Demo](TU_LINK_DE_VERCEL_AQUÍ)**

## 🚀 Características Premium

- **📍 Monitoreo GPS en Vivo**: Simulación de movimiento dinámico de unidades mediante algoritmos de trayectoria elíptica para una experiencia de usuario inmersiva.
- **📊 Analítica de Tendencia**: Gráficos de área (Trend Charts) que visualizan la estabilidad térmica de toda la flota en tiempo real.
- **🗺️ Geofencing Visual**: Mapas interactivos con Leaflet.js que diferencian estados de seguridad mediante marcadores cromáticos.
- **🛡️ Sistema de Alertas**: Panel de notificaciones inteligente que detecta y reporta excursiones de temperatura (> 7°C) automáticamente.
- **📂 Gestión CRUD Completa**: Interfaz robusta para el alta, baja y listado de despachos conectada a Supabase (PostgreSQL).

## 🛠️ Stack Tecnológico

- **Frontend**: React.js + TypeScript (Tipado fuerte).
- **Estilos**: Tailwind CSS (Diseño responsivo).
- **Base de Datos**: Supabase (PostgreSQL).
- **Mapas**: Leaflet & OpenStreetMap.
- **Gráficos**: Recharts.



## 🗄️ Estructura de Datos (Supabase)
Para replicar este proyecto, tu tabla `envios` debe tener la siguiente estructura:

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | int8 (PK) | Identificador único |
| `insumo` | text | Nombre del medicamento/insumo |
| `temp` | float8 | Temperatura actual en °C |
| `ubicacion` | text | Nombre de la ciudad/punto |
| `lat` | float8 | Latitud geográfica |
| `long` | float8 | Longitud geográfica |
| `estado` | text | 'EN RUTA' o 'CRÍTICO' |

## ⚙️ Instalación

1. **Clonar y Preparar**:
   ```bash
   git clone [https://github.com/gerindiz/vital-track-dashboard.git](https://github.com/gerindiz/vital-track-dashboard.git)
   cd vital-track-dashboard
   npm install