-- Create business type enum
CREATE TYPE public.business_type AS ENUM ('salon', 'clinic');

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type business_type NOT NULL DEFAULT 'salon',
  slug TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  description TEXT,
  address TEXT,
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#7C6EF5',
  hours JSONB DEFAULT '{}',
  rating_avg NUMERIC(2,1) DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their business" ON public.businesses
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Public can view businesses by slug" ON public.businesses
  FOR SELECT USING (true);

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Professionals table
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  photo_url TEXT,
  schedule JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  booking_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage professionals" ON public.professionals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Public can view active professionals" ON public.professionals
  FOR SELECT USING (active = true);

CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (active = true);

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Professional-Services junction
CREATE TABLE public.professional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  UNIQUE(professional_id, service_id)
);

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage professional_services" ON public.professional_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      JOIN public.businesses b ON b.id = p.business_id
      WHERE p.id = professional_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view professional_services" ON public.professional_services
  FOR SELECT USING (true);

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ,
  total_visits INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage clients" ON public.clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Public can insert clients" ON public.clients
  FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  datetime TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Public can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view appointments" ON public.appointments
  FOR SELECT USING (true);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view ratings" ON public.ratings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Public can insert ratings" ON public.ratings
  FOR INSERT WITH CHECK (true);

-- Storage bucket for business assets
INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true);

CREATE POLICY "Anyone can view business assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can upload business assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'business-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update business assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'business-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete business assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'business-assets' AND auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_professionals_business ON public.professionals(business_id);
CREATE INDEX idx_services_business ON public.services(business_id);
CREATE INDEX idx_clients_business ON public.clients(business_id);
CREATE INDEX idx_clients_phone ON public.clients(business_id, phone);
CREATE INDEX idx_appointments_business ON public.appointments(business_id);
CREATE INDEX idx_appointments_datetime ON public.appointments(business_id, datetime);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id, datetime);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);