-- Run this manually if db push fails (e.g. insufficient permissions).
-- Adds optional description to LessonType for the booking UI.
ALTER TABLE "LessonType" ADD COLUMN IF NOT EXISTS "description" TEXT;
