CREATE OR REPLACE FUNCTION public.envoyer_rappels_ingego(creneau text DEFAULT 'soir')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  token text;
begin
  select valeur into token from public.config_rappels where cle = 'RAPPELS_TOKEN';
  if token is null or token = '' then
    raise exception 'Token RAPPELS_TOKEN manquant dans public.config_rappels';
  end if;

  perform net.http_post(
    url := 'https://ingegotest.lovable.app/api/public/rappels?creneau=' || creneau,
    headers := jsonb_build_object('x-rappels-token', token)
  );
end;
$$;

REVOKE ALL ON FUNCTION public.envoyer_rappels_ingego(text) FROM public, anon, authenticated;