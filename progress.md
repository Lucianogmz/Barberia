# progress.md — Barbería: Estado del proyecto

> Actualizar este archivo al completar cada tarea.
> El agente documenta aquí sus decisiones, errores y el estado de avance.

---

## Estado general

| Fase | Estado | Avance |
|------|--------|--------|
| Phase 1 — Backend Foundation | ✅ Completo | 7 / 7 |
| Phase 2 — Google Calendar | ✅ Completo | 5 / 5 |
| Phase 3 — Appointments & Revenue | ✅ Completo | 5 / 5 |
| Phase 4 — Email Notifications | ✅ Completo | 4 / 4 |
| Phase 5 — Frontend Cliente | ✅ Completo | 5 / 5 |
| Phase 6 — Frontend Dashboard | ✅ Completo | 6 / 6 |
| Phase 7 — Deployment | ⬜ Pendiente | 0 / 4 |

**Leyenda:** ✅ Completo · 🔄 En progreso · ⬜ Pendiente · ❌ Bloqueado

---

## Phase 1 — Backend Foundation

- [x] Inicializar proyecto NestJS
- [x] Instalar dependencias (Prisma, Passport, JWT, class-validator, etc.)
- [x] Crear esquema Prisma + conectar a Neon
- [x] Crear `PrismaModule` (singleton global)
- [x] Crear `AuthModule` (estrategia JWT, almacenamiento de token Google, guards)
- [x] Crear `ServicesModule` (CRUD con validación)
- [x] Crear `ScheduleModule` (CRUD de horario laboral)

---

## Phase 2 — Google Calendar Integration

- [x] Instalar paquete `googleapis`
- [x] Crear `CalendarModule` + `CalendarService`
- [x] Implementar verificación de disponibilidad con FreeBusy
- [x] Implementar creación y eliminación de eventos
- [x] Implementar lógica de refresh de token

---

## Phase 3 — Appointments & Revenue

- [x] Crear `AppointmentsModule`
- [x] Implementar cálculo de slots disponibles (horario − reservados − Google busy)
- [x] Implementar creación de turno (snapshot de precio + evento en calendario)
- [x] Implementar gestión de estados (`PENDING` → `CONFIRMED` → `CANCELLED`)
- [x] Crear `RevenueModule` (agregaciones mensuales y diarias)

---

## Phase 4 — Email Notifications

- [x] Instalar Resend SDK
- [x] Crear `EmailModule` + `EmailService`
- [x] Crear template de confirmación de turno (español)
- [x] Crear template de cancelación de turno (español)

---

## Phase 5 — Frontend: Reserva del cliente

- [x] Inicializar Next.js 14 con Tailwind + shadcn/ui
- [x] Construir páginas del flujo de reserva
- [x] Construir componentes: `ServiceSelector`, `DatePicker`, `TimeSlotGrid`, `GuestForm`
- [x] Integración con API del backend
- [x] Diseño responsive mobile-first

---

## Phase 6 — Frontend: Dashboard del barbero

- [x] Configurar NextAuth.js con provider de Google
- [x] Layout del dashboard con ruta protegida (tema oscuro)
- [x] Lista de turnos con gestión de estados
- [x] Tarjetas de métricas de ingresos
- [x] Interfaz CRUD de servicios
- [x] Configuración del horario laboral

---

## Phase 7 — Deployment

- [ ] Deploy del frontend a Vercel
- [ ] Deploy del backend (Railway o Render — decidir)
- [ ] Configurar variables de entorno de producción
- [ ] Configurar URIs de redirección OAuth para producción

---

## Decisiones tomadas

> El agente documenta aquí cada decisión no trivial que tomó de forma autónoma.

| Fecha | Decisión | Razonamiento |
|-------|----------|--------------|
| 2026-05-07 | Corregir pantalla negra en /dashboard/login | El layout del dashboard protegía todas las rutas bajo /dashboard/ incluyendo /dashboard/login, causando `return null` cuando no había sesión. Se modificó el layout para exclude /dashboard/login de la verificación de autenticación. |
| 2026-05-07 | Corregir sincronización de datos en dashboard | Después de crear un turno desde la página de reservas, el dashboard no se actualizaba. Se agregó `router.refresh()` después de `createAppointment()` para invalidar la caché de Next.js y actualizar los datos. |
| 2026-05-07 | Corregir timezone en slots disponibles | Los slots de horarios se retornaban en UTC (.toISOString()), causando desfase de timezone. Se modificó para retornar en formato ISO con offset -03:00 (Argentina). |
| 2026-05-07 | Corregir display de fecha en dashboard turnos | formatDateES() interpretaba strings YYYY-MM-DD como UTC midnight, mostrando un día menos. Se agregó parseLocalDate() para manejar strings de fecha correctamente en timezone Argentina. |
| 2026-05-07 | Debugging error al cargar turnos | Error genérico al cargar turnos desde dashboard. Se agregó logging en consola y mejor manejo de errores para identificar si el problema es el token o la llamada a la API. |
| 2026-05-07 | Fix race condition en turnos | La página intentaba cargar turnos antes de que el token estuviera disponible. Ahora espera a que el token esté listo y obtiene el token desde localStorage como fallback. |
| 2026-05-07 | Fix timezone en fecha inicial de Turnos | La fecha inicial usaba new Date() sin timezone, mostrando un día adelante. Ahora usa getTodayDateString() que obtiene la fecha actual en timezone Argentina. |
| 2026-05-07 | Fix Barber ID mismatch en dashboard | El dashboard buscaba turnos con req.user.id (usuario logueado), pero los turnos se creaban con el Barber por defecto. Ahora usa getDefaultBarber() para consistency. |
| 2026-05-07 | Fix revenue/ingresos usando Barber correcto | El módulo de revenue también usaba req.user.id en lugar del Barber por defecto. Actualizado para usar getDefaultBarber() en summary, monthly y services. |
| 2026-05-07 | Turnos: mostrar 3 días (Hoy, Mañana, Pasado mañana) | Modificado el dashboard de turnos para cargar y mostrar turnos de 3 días con tabs navegables y navegación entre grupos de días. |
| 2026-05-07 | Servicios: precio editable inline | Agregada funcionalidad para editar el precio directamente haciendo click en el precio, sin necesidad de abrir el diálogo de edición. |
| 2026-05-07 | Fix servicios usando Barber correcto | Actualizado el controller y servicio de servicios para usar getDefaultBarber() en lugar de req.user.id para consistencia. |
| 2026-05-07 | Cambio de estética a blanco y negro | Actualizada toda la página a配色 blanco y negro (Helvetica, sidebar, dashboard, página de reserva). Se mantienen colores en sección Ingresos como solicitaste. |
| 2026-05-07 | Sistema de turnos: 1 por hora, 40 min duración | Modificado el backend para generar slots cada 60 minutos con duración fija de 40 minutos (20 min de buffer entre turnos). |

---

## Errores pendientes

> Errores que el agente no pudo resolver solo. Requieren atención manual.

| Archivo | Línea aprox. | Descripción |
|---------|-------------|-------------|
| frontend/src/app/dashboard/layout.tsx | 78 | Pantalla negra en /dashboard/login (FIXED) |
| backend/src/appointments/appointments.service.ts | 147-148 | Timezone offset en slots (FIXED) - Los slots se retornaban en UTC sin offset de timezone |
| frontend/src/app/page.tsx | 84 | Dashboard no se actualizaba tras nueva reserva (FIXED) - Faltaba router.refresh() |
| frontend/src/lib/formatters.ts | 22-31, 37-45 | Display de fecha muestran 1 día menos (FIXED) - formatDateES y formatDateShort ahora usan parseLocalDate para strings YYYY-MM-DD |
| frontend/src/app/dashboard/turnos/page.tsx | 34-35 | Estado inicial usaba toISOString() dando fecha en UTC (FIXED) - Ahora usa toDateString(new Date()) |

---

## Notas del desarrollador

> Espacio libre para anotar contexto, ideas o cambios de plan durante el desarrollo.

- Las credenciales de Google Cloud ya están configuradas (OAuth listo).
- Base de datos en Neon (PostgreSQL). La `DATABASE_URL` debe cargarse antes de correr migraciones.
- Todo texto visible al usuario va en español: UI, emails, mensajes de error de validación.
- El sistema es para un solo barbero. No implementar multi-tenant en esta versión.