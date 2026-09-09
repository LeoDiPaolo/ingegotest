REVOKE ALL ON public.etat_ingego FROM anon, authenticated;
DROP POLICY IF EXISTS etat_ingego_creation ON public.etat_ingego;
DROP POLICY IF EXISTS etat_ingego_lecture ON public.etat_ingego;
DROP POLICY IF EXISTS etat_ingego_maj ON public.etat_ingego;
ALTER TABLE public.etat_ingego ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.etat_ingego TO service_role;