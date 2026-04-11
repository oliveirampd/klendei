
-- Add missing columns
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS online_now boolean DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS icon_key text;

-- Fix appointments RLS: remove overly permissive policies
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can view appointments" ON public.appointments;

-- Fix clients RLS: remove overly permissive public insert
DROP POLICY IF EXISTS "Public can insert clients" ON public.clients;
