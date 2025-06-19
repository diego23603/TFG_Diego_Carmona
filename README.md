# 🐎 EquiGest - Plataforma Integral de Gestión Equina

Una plataforma web moderna que conecta propietarios de caballos con profesionales especializados del sector ecuestre, facilitando la gestión de citas, historiales médicos y pagos de forma segura y eficiente.

## 🌟 Características Principales

- **Gestión de Usuarios Multi-rol**: Clientes, profesionales (veterinarios, herradores, entrenadores, fisioterapeutas, dentistas, limpiadores) y administradores
- **Sistema de Conexiones**: Los profesionales pueden conectar con clientes y gestionar sus servicios
- **Gestión de Caballos**: Registro completo de caballos con historiales médicos y de servicios
- **Sistema de Citas**: Solicitud, confirmación y gestión de citas entre clientes y profesionales
- **Pagos Integrados**: Procesamiento seguro de pagos con Stripe Connect
- **Asistente IA**: Consultas especializadas por tipo de profesional usando OpenAI
- **Mensajería**: Comunicación directa entre usuarios conectados
- **Diseño Responsive**: Optimizado para dispositivos móviles y desktop

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** como herramienta de construcción
- **Tailwind CSS** para estilos
- **shadcn/ui** componentes de interfaz
- **React Query** para gestión de estado del servidor
- **Wouter** para enrutamiento

### Backend
- **Node.js** con Express.js
- **TypeScript** para tipado estático
- **PostgreSQL** como base de datos
- **Drizzle ORM** para acceso a datos
- **Passport.js** para autenticación

### Servicios Externos
- **Stripe** para procesamiento de pagos
- **OpenAI** para asistente de IA
- **SendGrid** para notificaciones por email

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 20+
- PostgreSQL
- Cuentas en Stripe y OpenAI (opcional)

### Variables de Entorno
```bash
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/equigest
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...
OPENAI_API_KEY=sk-... # Opcional
SESSION_SECRET=tu_clave_secreta_segura
NODE_ENV=development
```

### Comandos de Instalación
```bash
# Clonar el repositorio
git clone https://github.com/diego23603/TFG_Diego_Carmona.git
cd equigest

# Instalar dependencias
npm install
npm run build

# Iniciar servidor de desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
├── client/           # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/       # Páginas de la aplicación
│   │   └── lib/         # Utilidades y configuración
├── server/           # Backend Express
│   ├── routes.ts        # Rutas de la API
│   ├── auth.ts         # Autenticación
│   └── storage.ts      # Acceso a datos
├── shared/           # Código compartido
    └── schema.ts       # Esquemas de base de datos

```

## 🎯 Funcionalidades Implementadas

### Para Clientes
- Registro y gestión de perfil
- Añadir y gestionar caballos
- Buscar y conectar con profesionales
- Solicitar citas y realizar pagos
- Ver historiales médicos y de servicios
- Mensajería con profesionales

### Para Profesionales
- Perfil especializado por tipo de servicio
- Gestión de conexiones con clientes
- Calendario de citas y disponibilidad
- Registro de servicios realizados
- Recepción de pagos a través de Stripe Connect
- Asistente IA especializado


## 📊 Base de Datos

El proyecto utiliza PostgreSQL con Drizzle ORM. Las principales entidades incluyen:

- **Users**: Usuarios del sistema (clientes, profesionales, admin)
- **Horses**: Registro de caballos
- **Connections**: Relaciones profesional-cliente
- **Appointments**: Sistema de citas
- **MedicalRecords**: Historiales médicos
- **ServiceRecords**: Registros de servicios
- **Messages**: Sistema de mensajería

## 🤝 Contribución

Este proyecto es parte de un Trabajo de Fin de Grado (TFG) para el Grado en Ingeniería Informática en la Universidad Camilo José Cela.

## 📄 Licencia

Proyecto académico desarrollado por Diego Carmona Ruiz para TFG 2024-2025.

## 📞 Contacto

**Estudiante**: Diego Carmona Ruiz  
**Tutor**: Jesús Hermoso  
**Universidad**: Camilo José Cela  
**Curso**: 2024-2025

---

*EquiGest - Digitalizando el futuro del cuidado equino* 🐴