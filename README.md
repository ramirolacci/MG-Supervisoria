<div align="center">

  <img src="public/Logo_Mi_Gusto_2025.png" alt="Mi Gusto Logo" width="180" />

  # Mi Gusto · Supervisión Operativa

  **Plataforma Integral de Gestión, Auditoría y Analítica de Cargas Diarias para la Red de Sucursales**

  <p align="center">
    <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React 18" />
    <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-%233ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/gsap-%230AE448.svg?style=for-the-badge&logo=gsap&logoColor=white" alt="GSAP" />
  </p>

</div>

---

## 🌟 Visión General

**Mi Gusto · Supervisión Operativa** es una solución corporativa de alto impacto diseñada para la administración y supervisión de más de 39 sucursales de la cadena. Centraliza la carga diaria de métricas comerciales (comandas, facturación neta y unidades elaboradas), permitiendo auditar en tiempo real el rendimiento operativo, automatizar cálculos de ticket promedio y ratios de productividad, y gestionar de manera ágil y visual la asignación de sucursales a través de tableros interactivos.

---

## 🚀 Módulos y Funcionalidades Principales

- **⚡ Carga Diaria Inteligente**:
  - Registro ágil de comandas, venta neta y unidades por sucursal.
  - Validación reactiva, detección de cambios y cálculo instantáneo de KPIs consolidados.
  - Estados dinámicos por local (*Pendiente*, *Sin guardar*, *Cargada*) con formato monetario automático.

- **📊 Ranking y Métricas de Rendimiento**:
  - Paneles analíticos con comparativas mensuales y diarias.
  - Seguimiento de cumplimiento operativo y ticket promedio consolidado.
  - Exportación ejecutiva directa a reportes PDF listos para presentación corporativa.

- **🗂️ Reasignación Dinámica Kanban**:
  - Tablero interactivo con soporte *drag & drop* para transferir sucursales entre supervisoras en tiempo real.
  - Diferenciación visual de tiendas propias, franquicias y locales *Experience*.
  - Perfiles de supervisión con avatares fotográficos integrados.

- **📜 Historial, Auditoría y Analítica Contextual**:
  - Registro cronológico integral de todas las cargas operativas de la red.
  - Filtros multicriterio por período mensual, supervisora y búsqueda inteligente.
  - Modales de análisis profundo con cálculo de ratios de rendimiento, barras evolutivas comparativas e incremento animado de métricas numéricas.

- **✨ Experiencia de Usuario Premium**:
  - Animaciones micro-interactivas fluidas potenciadas por GSAP.
  - Notificaciones toast dinámicas y efectos de celebración al consolidar cargas.
  - Interfaz oscura (*dark-mode*) de alta gama orientada a la eficiencia y comodidad visual.

---

## 📸 Galería del Sistema

<div align="center">

### Línea 1 · Acceso Corporativo & Panel de Carga Diaria
| Autenticación Segura | Carga Diaria & KPIs Operativos |
| :---: | :---: |
| <img src="public/screenshots/Screenshot_1.png" alt="Pantalla de Inicio de Sesión" width="100%" /> | <img src="public/screenshots/Screenshot_2.png" alt="Panel de Carga Diaria" width="100%" /> |

### Línea 2 · Métricas de Rendimiento & Tablero Kanban
| Ranking & Métricas Mensuales | Tablero Kanban de Supervisión |
| :---: | :---: |
| <img src="public/screenshots/Screenshot_3.png" alt="Ranking y Métricas" width="100%" /> | <img src="public/screenshots/Screenshot_4.png" alt="Sucursales y Supervisores" width="100%" /> |

### Línea 3 · Historial de Cargas & Análisis Detallado
| Historial Integral con Filtros | Detalle Analítico & Evolución |
| :---: | :---: |
| <img src="public/screenshots/Screenshot_5.png" alt="Historial de Cargas" width="100%" /> | <img src="public/screenshots/Screenshot_6.png" alt="Detalle y Gráficos Evolutivos" width="100%" /> |

</div>

---

## 🛠️ Tecnologías Empleadas

- **Frontend Core**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) para máximo rendimiento en tiempo de compilación y recarga en caliente.
- **Estilos & Diseño**: [Tailwind CSS](https://tailwindcss.com/) con paleta oscura corporativa y micro-componentes desacoplados.
- **Animaciones**: [GSAP (GreenSock)](https://gsap.com/) para transiciones orquestadas en tarjetas, números, desplegables y modales.
- **Persistencia & Backend**: [Supabase](https://supabase.com/) (PostgreSQL en la nube) con capa de persistencia resiliente en almacenamiento local.
- **Reportes & Exportación**: [html2canvas](https://html2canvas.hertzen.com/) y [jsPDF](https://github.com/parallax/jsPDF) para generación de documentos ejecutivos de alta fidelidad.
- **Iconografía**: [Lucide React](https://lucide.dev/).

---

## ⚙️ Instalación y Puesta en Marcha

Sigue estos pasos para clonar, configurar y ejecutar el proyecto en tu entorno local.

### 📋 Requisitos Previos

- **Node.js**: Versión 18.0 o superior ([Descargar Node.js](https://nodejs.org/)).
- **Gestor de paquetes**: `npm` (incluido con Node.js) o `pnpm`.

---

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/MG-Supervisoria.git
cd MG-Supervisoria
```

---

### 2️⃣ Instalar Dependencias

Ejecuta el gestor de paquetes de tu preferencia:

```bash
# Con npm
npm install

# O con pnpm
pnpm install
```

---

### 3️⃣ Configurar Variables de Entorno

Copia el archivo de ejemplo `.env.example` y crea tu propio `.env`:

```bash
# En Windows (PowerShell)
Copy-Item .env.example .env

# En Linux / macOS / Bash
cp .env.example .env
```

Abre el archivo `.env` y completa con las credenciales de tu proyecto en Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

> [!NOTE]
> La aplicación también permite configurar o ajustar las credenciales de Supabase directamente desde la interfaz mediante el modal de base de datos en caso de ser necesario.

---

### 4️⃣ Iniciar el Servidor de Desarrollo

Inicia la aplicación en modo desarrollo con recarga en caliente (HMR):

```bash
# Con npm
npm run dev

# O con pnpm
pnpm dev
```

La consola mostrará la URL local (por defecto `http://localhost:5173`) para abrirla en el navegador.

---

### 📦 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite. |
| `npm run build` | Compila el proyecto optimizado para producción en `/dist`. |
| `npm run preview` | Previsualiza localmente el build de producción. |
| `npm run lint` | Ejecuta el análisis estático de código mediante `oxlint`. |

---

<div align="center">
  <sub>Desarrollado con dedicación para el equipo operativo de Mi Gusto. Todos los derechos reservados.</sub>
</div>
