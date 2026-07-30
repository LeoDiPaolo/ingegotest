import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    let vivant = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!vivant) return;
      setSession(data.session);
      setPret(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setPret(true);
    });
    return () => {
      vivant = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user: User | null = session?.user ?? null;
  return { session, user, pret };
}
