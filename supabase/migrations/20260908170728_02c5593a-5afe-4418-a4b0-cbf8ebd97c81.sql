CREATE TABLE public.etat_ingego (
  cle text PRIMARY KEY,
  cartes jsonb NOT NULL DEFAULT '{}'::jsonb,
  journal jsonb NOT NULL DEFAULT '[]'::jsonb,
  reglages jsonb NOT NULL DEFAULT '{}'::jsonb,
  commentaires jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.etat_ingego TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.etat_ingego TO authenticated;
GRANT ALL ON public.etat_ingego TO service_role;

ALTER TABLE public.etat_ingego ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etat_ingego_lecture" ON public.etat_ingego FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "etat_ingego_creation" ON public.etat_ingego FOR INSERT TO anon, authenticated WITH CHECK (char_length(cle) >= 20);
CREATE POLICY "etat_ingego_maj" ON public.etat_ingego FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_etat_ingego_updated_at
BEFORE UPDATE ON public.etat_ingego
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();