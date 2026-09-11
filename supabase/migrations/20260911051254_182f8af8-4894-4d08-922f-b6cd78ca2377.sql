ALTER TABLE public.abonnements_push
  ADD COLUMN IF NOT EXISTS prenom text,
  ADD COLUMN IF NOT EXISTS dernier_creneau text;