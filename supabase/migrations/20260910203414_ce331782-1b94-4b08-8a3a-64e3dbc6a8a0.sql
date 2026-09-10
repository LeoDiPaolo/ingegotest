CREATE TABLE public.abonnements_push (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cle text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  fuseau text NOT NULL DEFAULT 'Europe/Paris',
  dernier_envoi date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX abonnements_push_cle_idx ON public.abonnements_push (cle);

GRANT ALL ON public.abonnements_push TO service_role;

ALTER TABLE public.abonnements_push ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_abonnements_push_updated_at
BEFORE UPDATE ON public.abonnements_push
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();