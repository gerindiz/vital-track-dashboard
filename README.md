# 🌡️ VitalTrack - Dashboard de Telemetría Logística

#

<img width="1903" height="932" alt="Imagen del Dashboard" src="https://github.com/user-attachments/assets/f14a0181-e992-4824-8661-87143d74b84f" />

#

VitalTrack es una solución profesional diseñada para el monitoreo en tiempo real de la cadena de frío en el transporte de insumos médicos críticos (vacunas, insulina, sueros). 

El sistema permite visualizar la ubicación geográfica de los envíos y su integridad térmica, alertando instantáneamente sobre desviaciones fuera del rango permitido (>7°C).

## 🚀 Tecnologías Utilizadas

* **Frontend**: React.js con TypeScript.
* **Estilos**: Tailwind CSS v4 para una interfaz moderna y fluida.
* **Backend**: Supabase (PostgreSQL + Realtime) para la persistencia de datos.
* **Iconografía**: Lucide React.

## 🛠️ Instalación y Configuración

Para ejecutar este proyecto localmente, sigue estos pasos:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/gerindiz/vital-track-dashboard.git
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase (sin comillas):
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_clave_anonima
    ```

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

## 📊 Características Principales

* **Monitoreo en Tiempo Real**: Sincronización automática con la base de datos de Supabase.
* **Gestión de Envíos**: Formulario integrado para registrar nuevos despachos con telemetría de temperatura.
* **Mapa Interactivo**: Visualización dinámica de puntos de control y estados críticos.
* **Panel de KPIs**: Métricas clave sobre el estado global de la flota y promedios térmicos.

---
Desarrollado por **[German]** - 2026
