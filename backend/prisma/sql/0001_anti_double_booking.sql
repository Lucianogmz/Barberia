-- ============================================================
-- Migración manual 0001 — Anti doble reserva + índice de ingresos
-- ============================================================
-- Contexto: Prisma no puede expresar restricciones EXCLUDE (rangos).
-- Esta migración agrega:
--   1. Un índice compuesto para acelerar los agregados de ingresos.
--   2. Una restricción de exclusión que impide, a nivel de base de datos,
--      dos turnos solapados del mismo barbero (backstop ante condiciones
--      de carrera, además del re-chequeo Serializable en el código).
--
-- El solapamiento considera un buffer de 10 minutos DESPUÉS del fin de cada
-- turno, igual que la lógica de disponibilidad del backend.
--
-- Estados considerados "ocupantes": PENDIENTE y COMPLETADO.
-- (CANCELADO y NO_ASISTIO liberan el horario.)
--
-- CÓMO APLICAR (elegí una opción):
--   A) Neon SQL Editor: pegá este archivo y ejecutá.
--   B) psql:  psql "$DATABASE_URL" -f prisma/sql/0001_anti_double_booking.sql
--
-- Es idempotente: se puede correr más de una vez sin error.
-- ============================================================

-- Extensión requerida para combinar '=' (btree) con '&&' (gist) en un EXCLUDE.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Índice compuesto para agregados de ingresos (barbero + estado + fecha).
CREATE INDEX IF NOT EXISTS "appointments_barberId_status_startTime_idx"
  ON "appointments" ("barberId", "status", "startTime");

-- 2) Restricción de exclusión anti-solapamiento (con buffer de 10 min).
--    Se envuelve en un bloque para que sea idempotente (evita error si ya existe).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_no_overlap'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT appointments_no_overlap
      EXCLUDE USING gist (
        "barberId" WITH =,
        tstzrange("startTime", "endTime" + interval '10 minutes') WITH &&
      )
      WHERE (status IN ('PENDIENTE', 'COMPLETADO'));
  END IF;
END
$$;

-- ============================================================
-- IMPORTANTE: si ya existen turnos solapados en la tabla, el ALTER fallará.
-- Detectá conflictos previos con:
--
--   SELECT a.id, b.id
--   FROM "appointments" a
--   JOIN "appointments" b
--     ON a."barberId" = b."barberId"
--    AND a.id < b.id
--    AND a.status IN ('PENDIENTE','COMPLETADO')
--    AND b.status IN ('PENDIENTE','COMPLETADO')
--    AND tstzrange(a."startTime", a."endTime" + interval '10 minutes')
--     && tstzrange(b."startTime", b."endTime" + interval '10 minutes');
--
-- Resolvé (cancelá/ajustá) esos turnos antes de aplicar la restricción.
-- ============================================================
