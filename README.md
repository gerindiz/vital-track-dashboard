# 🌡️ VitalTrack - Dashboard de Telemetría Logística Crítica

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vital-track-dashboard.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

**VitalTrack** es una solución profesional diseñada para el monitoreo en tiempo real de la cadena de frío en el transporte de insumos médicos críticos (vacunas, insulina, sueros). 

El sistema centraliza la telemetría geográfica y térmica, permitiendo una respuesta inmediata ante desviaciones fuera del rango permitido (>7°C) para garantizar la integridad sanitaria.

---

## 📸 Vista Previa del Sistema

<img width="1901" height="930" alt="Dashboard de VitalTrack" src="https://github.com/user-attachments/assets/135739d5-8df1-4a98-baba-9275856c11ae" />

🔗 **Explorar Demo en Vivo:** [https://vital-track-dashboard.vercel.app](https://vital-track-dashboard.vercel.app)

---

## 🚀 Características Principales

* **Centro de Monitoreo Geográfico**: Mapa interactivo con **Leaflet** que posiciona cada envío mediante geocodificación activa.
* **Feed de Alertas Críticas**: Panel inteligente con notificaciones visuales (ping de alerta) para envíos que superan los umbrales de temperatura.
* **Gestión de Flota Dual**: Vistas separadas para *Dashboard General* (Control) y *Administración de Envíos* (Gestión de datos).
* **Notificaciones en Tiempo Real**: Feedback instantáneo mediante **React Hot Toast** para confirmaciones de carga y alertas de sistema.
* **Auditoría y Exportación**: Generación de reportes técnicos en formato **Excel (.xlsx)** procesados con **SheetJS**.
* **KPIs de Rendimiento**: Métricas dinámicas que calculan el promedio térmico global y el conteo de alertas críticas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 19 + TypeScript |
| **Estilos** | Tailwind CSS v4 (Mobile First) |
| **Base de Datos** | Supabase (PostgreSQL + Realtime Engine) |
| **Mapas** | React-Leaflet + OpenStreetMap API |
| **Iconografía** | Lucide React |
| **Utilidades** | SheetJS (Excel) + React Hot Toast |

---

## ⚙️ Instalación y Configuración

Sigue estos pasos para desplegar el entorno de desarrollo localmente:

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/gerindiz/vital-track-dashboard.git](https://github.com/gerindiz/vital-track-dashboard.git)
   cd vital-track-dashboard

   Instalar dependencias:

Bash
npm install
Configurar variables de entorno:
Crea un archivo .env en la raíz del proyecto:

Fragmento de código
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
Ejecutar aplicación:

Bash
npm run dev
##📈 Próximas Mejoras
[ ] Gráficos de tendencia térmica con Chart.js.

[ ] Sistema de usuarios con autenticación (Supabase Auth).

[ ] Historial de eventos críticos por fecha.

Desarrollado por Gerindiz - 2026
