# agents.md — Sistema de Turnos para Barbería

## Visión general del proyecto

App fullstack para gestionar turnos de una barbería de un solo barbero.
Los clientes reservan online; el barbero gestiona todo desde un dashboard privado.

**Stack:**
- Backend: NestJS + Prisma + Neon (PostgreSQL)
- Frontend: Next.js 14 + Tailwind CSS + shadcn/ui
- Auth: NextAuth.js con Google OAuth
- Calendario: Google Calendar API
- Emails: Resend SDK
- Hosting: Vercel (frontend + backend como serverless o Edge)
- Idioma: Español en toda la UI y notificaciones

---

## Estructura del proyecto

```
/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Tipos y validaciones compartidas (opcional)
├── agents.md
└── progress.md
```

---

## Roles de agente

Este proyecto usa **un único agente generalista** que trabaja de forma secuencial por fases.
No hay sub-agentes separados. El agente avanza fase por fase y documenta sus decisiones.

---

## Reglas de comportamiento del agente

### Autonomía
- El agente **intenta resolver solo** cualquier ambigüedad técnica.
- Si toma una decisión no trivial (ej: estructura de tabla, nombre de endpoint, lógica de slots), la documenta en `progress.md` bajo la sección `## Decisiones tomadas`.
- Solo interrumpe al usuario si hay un **bloqueo crítico**: credenciales faltantes, conflicto de arquitectura irresoluble, o requisito funcional contradictorio.

### Al encontrar un error
1. Intenta corregirlo solo (máximo 2 intentos).
2. Si no puede, deja un comentario `// TODO(agente): <descripción del problema>` en el código.
3. Registra el error en `progress.md` bajo `## Errores pendientes`.

### Convenciones de código
- **TypeScript estricto** en todo el proyecto (`strict: true`).
- Nombres en **inglés** en el código (variables, funciones, clases, rutas de API).
- Textos visibles al usuario (UI, emails) en **español**.
- Cada módulo NestJS vive en su propia carpeta con `module`, `service`, `controller` y `dto`.
- Validación con `class-validator` en todos los DTOs.
- Variables de entorno: nunca hardcodeadas, siempre desde `.env` con un `.env.example` actualizado.

### Commits
- Un commit por tarea completada del `progress.md`.
- Formato: `feat(módulo): descripción breve en español` — ej: `feat(auth): implementar estrategia JWT`.

---

## Contexto de dominio

### El barbero
- Un único barbero que es también el dueño.
- Tiene su propio Google Calendar ya conectado (credenciales OAuth configuradas).
- Accede al dashboard con su cuenta de Google (NextAuth).

### El cliente
- No necesita cuenta. Reserva como invitado (nombre, teléfono, email).
- Recibe confirmación y cancelación por email en español.

### Un turno (`Appointment`)
- Tiene: servicio elegido, fecha/hora, datos del cliente, precio al momento de reservar, estado (`PENDING` | `CONFIRMED` | `CANCELLED`).
- Al crearse: se crea un evento en Google Calendar y se envía email de confirmación.
- Al cancelarse: se elimina el evento y se envía email de cancelación.

### Disponibilidad
- Se calcula como: **horario laboral** menos **turnos ya reservados** menos **bloqueos en Google Calendar**.
- La duración de cada slot = duración del servicio elegido.

---

## Variables de entorno necesarias

Mantener siempre actualizado el `.env.example` con estas claves:

```env
# Base de datos
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# Google OAuth (NextAuth + Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Google Calendar
GOOGLE_CALENDAR_ID=
GOOGLE_REFRESH_TOKEN=

# Resend (emails)
RESEND_API_KEY=
EMAIL_FROM=

# App
NEXT_PUBLIC_API_URL=
```

---

## Fases y tareas

Las fases y su estado de avance se registran en `progress.md`.
Este archivo define el **qué** hacer; `progress.md` registra el **cuánto** se hizo.

### Phase 1 — Backend Foundation
- Inicializar proyecto NestJS
- Instalar dependencias (Prisma, Passport, JWT, class-validator, etc.)
- Crear esquema Prisma + conectar a Neon
- Crear `PrismaModule` (singleton global)
- Crear `AuthModule` (estrategia JWT, almacenamiento de token Google, guards)
- Crear `ServicesModule` (CRUD con validación)
- Crear `ScheduleModule` (CRUD de horario laboral)

### Phase 2 — Google Calendar Integration
- Instalar paquete `googleapis`
- Crear `CalendarModule` + `CalendarService`
- Implementar verificación de disponibilidad con FreeBusy
- Implementar creación y eliminación de eventos
- Implementar lógica de refresh de token

### Phase 3 — Appointments & Revenue
- Crear `AppointmentsModule`
- Implementar cálculo de slots disponibles (horario − reservados − Google busy)
- Implementar creación de turno (snapshot de precio + evento en calendario)
- Implementar gestión de estados
- Crear `RevenueModule` (agregaciones mensuales/diarias)

### Phase 4 — Email Notifications
- Instalar Resend SDK
- Crear `EmailModule` + `EmailService`
- Crear template de confirmación de turno (español)
- Crear template de cancelación de turno (español)

### Phase 5 — Frontend: Reserva del cliente
- Inicializar Next.js 14 con Tailwind + shadcn/ui
- Construir páginas del flujo de reserva
- Construir componentes: `ServiceSelector`, `DatePicker`, `TimeSlotGrid`, `GuestForm`
- Integración con el cliente de API del backend
- Diseño responsive mobile-first

### Phase 6 — Frontend: Dashboard del barbero
- Configurar NextAuth.js con provider de Google
- Layout del dashboard con ruta protegida (tema oscuro)
- Lista de turnos con gestión de estados
- Tarjetas de métricas de ingresos
- Interfaz CRUD de servicios
- Configuración del horario laboral

### Phase 7 — Deployment
- Deploy del frontend a Vercel
- Deploy del backend a Railway o Render (decidir según costos)
- Configurar variables de entorno de producción
- Configurar URIs de redirección OAuth para producción

---

## Decisiones de arquitectura ya tomadas

| Decisión | Justificación |
|---|---|
| Un solo agente secuencial | El proyecto es de un solo desarrollador, no hay paralelismo real |
| Neon como base de datos | Tier gratuito generoso, compatible con Prisma, serverless-friendly |
| Vercel para frontend | Integración nativa con Next.js, deploys automáticos |
| Resend para emails | API simple, tier gratuito, buena deliverability |
| No hay multi-tenant | Sistema para un solo barbero; escalar después si se necesita |
| Snapshot de precio en turno | El precio del servicio puede cambiar; el turno guarda el precio original |

---

## Lo que el agente NO debe hacer

- No crear sistema de múltiples barberos (fuera de scope).
- No implementar pagos online (fuera de scope en esta versión).
- No cambiar el stack sin documentarlo primero en `progress.md`.
- No hardcodear ningún secreto o credencial en el código.
- No omitir el `.env.example` al agregar nuevas variables de entorno.
