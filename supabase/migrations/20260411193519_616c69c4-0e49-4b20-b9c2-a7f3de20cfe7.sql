
-- Fix ratings: scope public insert to valid appointments
DROP POLICY IF EXISTS "Public can insert ratings" ON public.ratings;
CREATE POLICY "Public can insert ratings" ON public.ratings
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = ratings.appointment_id
        AND a.business_id = ratings.business_id
        AND a.status = 'completed'
    )
    AND score >= 1 AND score <= 5
  );
