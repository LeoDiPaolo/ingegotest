import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "E-mail ou mot de passe incorrect.",
  "User already registered": "Ce compte existe déjà : connectez-vous.",
  "Password should be at least 6 characters":
    "Le mot de passe doit faire au moins 6 caractères.",
  "Signups not allowed for this instance": "Les inscriptions sont désactivées.",
  "Email address is invalid": "Adresse e-mail invalide.",
};

function traduire(message: string) {
  if (MESSAGES[message]) return MESSAGES[message];
  if (/pwned|compromis/i.test(message))
    return "Ce mot de passe figure dans des fuites de données connues : choisissez-en un autre.";
  if (/rate limit|too many/i.test(message))
    return "Trop de tentatives : patientez une minute avant de réessayer.";
  return message;
}

export function PanneauConnexion() {
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    setInfo(null);
    try {
      if (mode === "connexion") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) return; // connecté immédiatement
        if (data.user && data.user.identities?.length === 0) {
          setErreur("Ce compte existe déjà : connectez-vous.");
          setMode("connexion");
          return;
        }
        setInfo("Compte créé. Ouvrez le lien de confirmation reçu par e-mail, puis connectez-vous.");
      }
    } catch (err) {
      setErreur(traduire(err instanceof Error ? err.message : "Échec, réessayez."));
    } finally {
      setOccupe(false);
    }
  }

  async function google() {
    setOccupe(true);
    setErreur(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErreur("Connexion Google impossible.");
      setOccupe(false);
      return;
    }
    if (result.redirected) return;
    setOccupe(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="text-[0.7rem] tracking-[0.18em] text-muted-foreground uppercase">
          Ingénieur territorial · écrit juin 2027
        </p>
        <h1 className="mt-2 text-4xl">IngéGo</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          322 questions, six axes, répétition espacée. Votre progression suit votre compte, du
          téléphone au PC.
        </p>

        <form onSubmit={soumettre} className="surface mt-8 space-y-3 p-5">
          <label className="block text-xs text-muted-foreground">
            Adresse e-mail
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-ring"
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Mot de passe
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "connexion" ? "current-password" : "new-password"}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-ring"
            />
          </label>
          {erreur ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs leading-snug text-foreground">
              {erreur}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs leading-snug text-foreground">
              {info}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={occupe}
            className="tap w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {occupe ? "…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
          </button>
          <button
            type="button"
            onClick={google}
            disabled={occupe}
            className="tap w-full rounded-lg border border-border bg-elevated py-3 text-sm font-medium text-foreground disabled:opacity-60"
          >
            Continuer avec Google
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}
            className="tap w-full pt-1 text-xs text-muted-foreground underline"
          >
            {mode === "connexion"
              ? "Pas encore de compte ? En créer un"
              : "J'ai déjà un compte, me connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
