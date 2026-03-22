
-- Field Log: stores saved diagnostic sessions
CREATE TABLE public.field_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Diagnosis',
  crop_name TEXT,
  diagnosis_summary TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  severity TEXT CHECK (severity IN ('healthy', 'mild', 'moderate', 'severe'))
);

-- Allow public read/write (no auth required for this app)
ALTER TABLE public.field_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read field logs"
  ON public.field_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert field logs"
  ON public.field_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete field logs"
  ON public.field_logs FOR DELETE
  TO anon, authenticated
  USING (true);
