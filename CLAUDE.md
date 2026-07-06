# CLAUDE.md — Memoria del proyecto Barbería

> Archivo de memoria permanente. Se actualiza tras cada cambio importante.
> **No borrar información histórica**: solo agregar entradas nuevas.
> Fecha de creación: 2026-07-05.

---

# Estado del proyecto

## Qué funciona (según análisis estático, aún sin build verificado)
- Backend NestJS con módulos: Auth (JWT + Google tokens), Services (CRUD), Schedule (horarios), Appointments (reserva + slots), Revenue (agregados), Calendar (Google), Email (Resend).
- Frontend Next.js (App Router): landing/booking público + dashboard protegido con NextAuth (Google).
- Flujo de reserva pública: cliente elige servicio → slots disponibles → crea turno → evento en Google Calendar + email de confirmación (Resend).
- Dashboard: login Google, gestión de servicios, horarios, turnos e ingresos.
- Esquema Prisma coherente con snapshot de precio (`priceAtBooking`) e índices en `appointments`.
- `node_modules` presentes en backend y frontend (las dependencias resuelven).

## Qué falta
- **Fase 7 (Deployment)**: pendiente. NestJS es un servidor persistente y **no corre en Vercel serverless** sin adaptación o host separado. **Decisión de arquitectura pendiente** (ver "Decisiones técnicas").
- Rotación de secretos expuestos.
- Verificar `nest build` y `next build` en limpio.
- Tests (solo hay stub e2e).
- Confirmar permiso para migrar la base de datos Neon en vivo.

## Problemas conocidos
Ver secciones "Bugs encontrados" y "Base de datos".

---

# Cambios realizados

## 2026-07-05 15:50 — Correcciones de backend (bugs + seguridad + limpieza)
Decisiones del usuario: despliegue = frontend en Vercel + backend en Railway/Render;
DB = aplicar migraciones directo en Neon; secretos = NO rotar por ahora (priorizar estabilidad).
Nota de entorno: **Neon no es alcanzable desde el sandbox** (DNS bloqueado) y **Prisma no baja su engine** acá; las migraciones se entregan como SQL para aplicar en Neon. Además el mount del sandbox va desfasado respecto a las herramientas de archivo, por lo que el `build` final debe correrse en la máquina del usuario/CI.

- **B1 (doble reserva) — CORREGIDO**: `appointments.service.create()` reescrito. Ahora usa el mismo criterio que la disponibilidad (estados ocupantes `PENDIENTE`+`COMPLETADO` + buffer de 10 min), re-chequea el conflicto e inserta dentro de una transacción `Serializable`, y crea el evento de Google Calendar DESPUÉS de confirmar el turno (evita eventos huérfanos). Se agregó validación de "no reservar en el pasado". Constante compartida `OCCUPYING_STATUSES` usada también en `getAvailableSlots`.
- **B2 (auth no scopeada) — CORREGIDO (parcial)**: los controllers protegidos de `services`, `appointments` y `revenue` ahora usan `req.user.id` (como ya hacía `schedule`), en vez de `getDefaultBarber()`. Esto unifica el barbero del dashboard y explica/soluciona el "andando sin los horarios". Se agregó allowlist `ALLOWED_BARBER_EMAILS` en `auth.service.registerTokens` para impedir que cualquier cuenta de Google acceda al panel.
- **B4 (zona horaria en Revenue) — CORREGIDO**: `getDateRangeUTC` (dependía del huso del servidor) reemplazado por `getMonthRangeUTC` y cálculos con `dayjs().tz(TZ)` para día/semana/mes. Correcto en servidores UTC (Vercel/Railway).
- **Código muerto — ELIMINADO**: wrappers `*WithDefaultBarber` y `getDefaultBarber` sin uso en `services.service` y `revenue.service`; wrappers sin uso en `appointments.service` (se mantiene `getDefaultBarber` para el flujo público de reserva).
- **DB**: agregado índice `@@index([barberId, status, startTime])` en `schema.prisma`; creado `backend/prisma/sql/0001_anti_double_booking.sql` (extensión btree_gist + índice + restricción EXCLUDE anti-solapamiento con buffer, idempotente).
- **Config**: `backend/.env.example` documenta `ALLOWED_BARBER_EMAILS` y sugiere `openssl rand` para secretos; `frontend/.env.example` ya no expone el Google Client Secret real (placeholders) y documenta `NEXT_PUBLIC_API_URL` de producción.
- Verificación: integridad estructural revisada vía Read (fuente autoritativa). Falta ejecutar `npm run build` en entorno con FS consistente.

## 2026-07-05 — Análisis inicial
- Análisis completo del monorepo (backend + frontend).
- Creado este archivo `CLAUDE.md` como memoria permanente.
- Creada lista de tareas priorizada.
- Documentados stack, arquitectura, flujo de datos, bugs y riesgos de seguridad.
- **Aún no se modificó código de la aplicación** (se espera decisión de arquitectura y permisos de DB).

---

# Arquitectura

Monorepo con dos carpetas independientes (sin workspace/monorepo tooling):

## `backend/` — NestJS 11 + Prisma 6
- API REST bajo prefijo global `/api`, escucha en `PORT` (3001 por defecto).
- Módulos de dominio: `auth`, `services`, `schedule`, `appointments`, `revenue`, `calendar`, `email`; infraestructura: `prisma`.
- ORM: Prisma sobre PostgreSQL (Neon). `PrismaService` como singleton global.
- Autenticación: Passport-JWT. El frontend obtiene tokens Google vía NextAuth y los envía a `POST /auth/register-tokens`; el backend hace upsert del barbero, guarda tokens Google y devuelve un JWT propio.
- Integraciones: `googleapis` (Calendar FreeBusy + eventos), Resend (emails transaccionales).
- Zona horaria de negocio: `America/Argentina/Buenos_Aires` (con `dayjs` utc/timezone).
- **Modelo "single-barber V1"**: todos los endpoints protegidos operan sobre un "barbero por defecto" (`getDefaultBarber()` = el BARBER con `updatedAt` más reciente), ignorando el `id` del usuario autenticado del JWT.

## `frontend/` — Next.js 16 + React 19 (App Router)
- Público: `src/app/page.tsx` (booking), `layout.tsx`, `globals.css`.
- Dashboard: `src/app/dashboard/*` (panel, turnos, servicios, ingresos, configuración, login) protegido por NextAuth.
- Auth: NextAuth v5 (beta) con provider Google (scopes de Calendar). Tras login, `dashboard/layout.tsx` llama a `registerTokens` y guarda el JWT del backend en `localStorage` (`barberia_api_token`), pasado a un `TokenContext`.
- Cliente HTTP: `src/lib/api-client.ts` (usa `fetch`; `NEXT_PUBLIC_API_URL`).
- UI: shadcn/ui + Tailwind v4 + lucide-react + sonner.

## Flujo de datos (reserva)
Cliente (público) → `POST /api/appointments` → upsert `Client` → valida conflicto → crea `Appointment` (snapshot precio) → crea evento Google Calendar → email Resend. El barbero (dashboard) cambia estados (`PENDIENTE`→`COMPLETADO`/`CANCELADO`/`NO_ASISTIO`); al cancelar se borra el evento y se notifica por email.

---

# Base de datos

## Esquema actual (Prisma → PostgreSQL/Neon)
- **User** (barbero): `id (cuid)`, `email @unique`, `name`, `image?`, `role (BARBER|ADMIN)`, tokens Google (`googleAccessToken/RefreshToken/TokenExpiry`), timestamps. Relaciones: services, appointments, workSchedules.
- **Service**: `name`, `description?`, `price Decimal(10,2)`, `durationMin Int`, `isActive` (soft-delete), `barberId` (→User, Cascade).
- **Client**: `name`, `phone`, `email`, `@@unique([email, phone])`.
- **Appointment**: `startTime`, `endTime`, `status`, `priceAtBooking Decimal(10,2)`, `googleEventId?`, `notes?`, `barberId`(Cascade), `serviceId`(Restrict), `clientId`(Restrict). Índices: `@@index([barberId, startTime])`, `@@index([status])`.
- **WorkSchedule**: `dayOfWeek Int`, `isActive`, `morningStart/End` (String "HH:mm"), `afternoonStart/End?`, `barberId`, `@@unique([barberId, dayOfWeek])`.
- Enums: `Role`, `AppointmentStatus (PENDIENTE|COMPLETADO|CANCELADO|NO_ASISTIO)`.

## Relaciones
User 1—N Service, User 1—N Appointment, User 1—N WorkSchedule, Client 1—N Appointment, Service 1—N Appointment.

## Migraciones realizadas
- El proyecto usa `prisma db push` (sin historial versionado). **Riesgo**: no hay carpeta `prisma/migrations`.
- 2026-07-05: creada `backend/prisma/sql/0001_anti_double_booking.sql` (SQL manual, **pendiente de aplicar en Neon** por el usuario: extensión `btree_gist`, índice `appointments_barberId_status_startTime_idx`, y restricción `appointments_no_overlap` EXCLUDE). Agregado `@@index([barberId, status, startTime])` a `schema.prisma` — requiere `prisma db push`/`generate` en la máquina del usuario para reflejarse.

## Cambios pendientes (propuestos, sin aplicar)
1. Adoptar migraciones versionadas (`prisma migrate`) en vez de `db push` para producción.
2. Constraint/estrategia anti-doble-reserva a nivel DB (evitar solapamientos por carrera).
3. Índice adicional para consultas de revenue por rango (`[barberId, status, startTime]`).
4. Cifrado/segregación de tokens Google (hoy en texto plano).
5. Evaluar normalización de `WorkSchedule` (turnos en filas en vez de columnas morning/afternoon) para soportar N turnos por día — opcional, evaluar contra simplicidad.

---

# Tareas pendientes (TODO) — por prioridad

1. **[Bloqueante] Decidir arquitectura de despliegue** (backend host separado vs. migrar a serverless). Sin esto no se puede cerrar Vercel.
2. **[Seguridad] Rotar secretos** expuestos: password Neon, Google Client Secret, Resend key, `JWT_SECRET` (débil), `NEXTAUTH_SECRET` ("lucianogomez"). Quitar el secret real de `frontend/.env.example`.
3. **[Bug] Unificar detección de conflictos** entre `getAvailableSlots` y `create` (estados, buffer, Google busy) y prevenir doble reserva por carrera.
4. **[Seguridad] Scoping de auth**: usar `req.user.id` en endpoints protegidos y/o allowlist de emails que pueden entrar al dashboard.
5. **[Seguridad] No exponer `googleRefreshToken`/accessToken** en la sesión del cliente; sacar JWT de `localStorage` si es viable (cookie httpOnly).
6. **[Bug] Zona horaria en Revenue**: `getDateRangeUTC` depende del huso del servidor (en Vercel/Node es UTC) → límites de día/mes incorrectos.
7. **[Calidad] Errores TS/lint**, eliminar código y dependencias muertas (frontend: `axios`, `date-fns` si no se usan; `.enc.local` vacío trackeado).
8. **[DB] Revisar Neon** y aplicar migraciones aprobadas.
9. **[Deploy] Config de entorno y build** end-to-end + checklist.
10. **[Calidad] Tests** mínimos de humo en flujos críticos.

---

# Decisiones técnicas

## Pendiente: hosting del backend
NestJS es un servidor Node persistente. Vercel está orientado a funciones serverless/edge; desplegar NestJS ahí requiere o bien un adaptador serverless (envolver la app en un handler) o bien **hostear el backend en un servicio persistente** (Railway, Render, Fly.io) y dejar solo el **frontend en Vercel** apuntando vía `NEXT_PUBLIC_API_URL`. Recomendación inicial: frontend en Vercel + backend en Railway/Render (menor reescritura, más estable). **A confirmar con el usuario.**

## Registradas
- Se prioriza estabilidad y limpieza sobre nuevas funcionalidades (indicación del usuario).
- Se mantendrá este `CLAUDE.md` como memoria; solo se agregan entradas, no se borran.

---

# Bugs encontrados

- **B1 (alto) — Doble reserva** — `[RESUELTO 2026-07-05]`: `create()` sólo verificaba conflictos contra estado `PENDIENTE`, sin buffer ni Google busy; `getAvailableSlots()` considera `PENDIENTE`+`COMPLETADO`+buffer+Google. Un turno COMPLETADO no bloquea una nueva reserva. Además no hay transacción/constraint → condición de carrera entre chequeo e inserción.
- **B2 (alto) — Auth no scopeada** — `[RESUELTO 2026-07-05: dashboard usa req.user.id + allowlist]`: el JWT se validaba pero los endpoints protegidos usan `getDefaultBarber()` en vez de `req.user.id`. Cualquier cuenta de Google puede loguear al dashboard (no hay allowlist) y operar sobre el barbero por defecto.
- **B3 (alto) — Fuga de tokens**: el callback `session` de NextAuth expone `googleAccessToken`/`googleRefreshToken` al navegador; el JWT del backend se guarda en `localStorage` (expuesto a XSS).
- **B4 (medio) — Zona horaria Revenue** — `[RESUELTO 2026-07-05]`: `getDateRangeUTC` construía fechas con `new Date(year,...)` en huso local del servidor; el propio comentario admite que es incorrecto fuera de Argentina. En Vercel (UTC) los límites de hoy/semana/mes se desplazan horas.
- **B5 (medio) — Secretos en repo/entorno**: valores reales en `backend/.env`, `frontend/.env` y **secreto real en `frontend/.env.example`** (versionado). `JWT_SECRET` y `NEXTAUTH_SECRET` débiles.
- **B6 (medio) — Tokens Google en texto plano** en la tabla `users`.
- **B7 (bajo) — Sin migraciones versionadas**: se usa `db push`; riesgo para producción.
- **B8 (bajo) — Código/deps muertos**: `frontend/.enc.local` vacío y trackeado; posibles deps sin uso (`axios`, `date-fns`); `apiToken` sin uso en `next-auth.d.ts`.
- **B9 (a verificar) — Manejo de `error` en catch**: acceso a `error.message` sobre `unknown` en varios `catch` (calendar/email/appointments). Verificar con `tsconfig` estricto al compilar.

> Estado: B1, B2 y B4 **resueltos** (2026-07-05). B3, B5, B6, B7, B8, B9 **abiertos**.
> Nota B2: falta sacar el JWT del backend de `localStorage` y no exponer el refresh token de Google al navegador (ver B3).

---

# Próximos pasos

**Estado 2026-07-05 15:50** — Hechas las correcciones B1/B2/B4 + limpieza + SQL de migración + envs.

**Siguiente paso recomendado (en orden):**
1. **El usuario ejecuta el build local** para verificar: en `backend/` `npm run build`; en `frontend/` `npm run build`. (No se pudo verificar en el sandbox por FS inconsistente.) Reportar cualquier error para corregirlo.
2. **Aplicar en Neon** `backend/prisma/sql/0001_anti_double_booking.sql` y `npx prisma db push` (para el nuevo índice) desde la máquina del usuario. Antes, chequear turnos solapados existentes (query incluida en el SQL).
3. **B3 (seguridad frontend)**: mover el registro de tokens al lado servidor de NextAuth (evento/callback) para no exponer `googleRefreshToken` al navegador, y sacar el JWT del backend de `localStorage` (cookie httpOnly). Refactor de riesgo medio — hacer con build verde.
4. **Limpieza frontend**: quitar `.enc.local` vacío del repo, deps sin uso (`axios`, `date-fns` si no se usan), `apiToken` sin uso en tipos.
5. **Despliegue**: archivos de deploy del backend (Railway/Render), `NEXT_PUBLIC_API_URL` de prod, CORS `FRONTEND_URL`, y checklist de variables en Vercel.
6. **Quitar `backend/dist/` del control de versiones** (`git rm -r --cached backend/dist` + `.gitignore`).
