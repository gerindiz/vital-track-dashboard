
# 🌡️ VitalTrack - Dashboard de Telemetría Logística

VitalTrack es una solución profesional diseñada para el monitoreo en tiempo real de la cadena de frío en el transporte de insumos médicos críticos como vacunas, insulina y sueros.

El sistema permite visualizar la ubicación geográfica de los envíos y su integridad térmica, alertando instantáneamente sobre desviaciones fuera del rango permitido (>7°C).
#
<img width="1901" height="930" alt="Imagen del Dashboard act" src="https://github.com/user-attachments/assets/135739d5-8df1-4a98-baba-9275856c11ae" />

#

🔗 **Demo en vivo:** [https://vital-track-dashboard.vercel.app](https://vital-track-dashboard.vercel.app)

## 🚀 Tecnologías Utilizadas

* **Frontend**: React 19 con TypeScript.
* **Estilos**: Tailwind CSS v4 para una interfaz moderna y fluida.
* **Backend**: Supabase (PostgreSQL + Realtime) para la persistencia de datos.
* **Reportes**: SheetJS (XLSX) para la generación de documentos de auditoría.
* **Iconografía**: Lucide React.

## 📊 Características Principales

* **Monitoreo en Tiempo Real**: Sincronización automática con la base de datos de Supabase.
* **Gestión de Envíos**: Formulario integrado para registrar nuevos despachos con telemetría.
* **Mapa Interactivo**: Visualización dinámica de puntos de control y estados críticos.
* **Exportación de Datos**: Generación de reportes detallados en formato **Excel (.xlsx)** para auditorías de cumplimiento sanitario.
* **Panel de KPIs**: Métricas clave sobre alertas críticas y promedios térmicos.

## 🛠️ Instalación y Configuración

Para ejecutar este proyecto localmente, sigue estos pasos:

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/gerindiz/vital-track-dashboard.git](https://github.com/gerindiz/vital-track-dashboard.git)
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_clave_anonima
    ```
4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

---
Desarrollado por **German** - 2026
