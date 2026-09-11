REVOKE ALL ON public.config_rappels FROM anon, authenticated;
GRANT ALL ON public.config_rappels TO service_role;
ALTER TABLE public.config_rappels ENABLE ROW LEVEL SECURITY;