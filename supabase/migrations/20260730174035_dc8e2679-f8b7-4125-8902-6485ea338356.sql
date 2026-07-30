CREATE TABLE public.cartes (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  p SMALLINT NOT NULL DEFAULT 0,
  e NUMERIC NOT NULL DEFAULT 2.3,
  du BIGINT NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  echecs INTEGER NOT NULL DEFAULT 0,
  vu BOOLEAN NOT NULL DEFAULT false,
  dernier BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cartes TO authenticated;
GRANT ALL ON public.cartes TO service_role;
ALTER TABLE public.cartes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cartes_own" ON public.cartes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.reglages (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reglages TO authenticated;
GRANT ALL ON public.reglages TO service_role;
ALTER TABLE public.reglages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reglages_own" ON public.reglages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  note SMALLINT NOT NULL,
  jour DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal TO authenticated;
GRANT ALL ON public.journal TO service_role;
ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_own" ON public.journal FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX journal_user_jour_idx ON public.journal (user_id, jour DESC);