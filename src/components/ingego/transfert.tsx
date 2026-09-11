import { useEffect, useState } from "react";
import { Copy, KeyRound, LogIn } from "lucide-react";
import { changerCleAppareil, cleAppareilVisible, FORMAT_CLE } from "@/lib/ingego/stockage";

export function CarteTransfert() {
  const [cle, setCle] = useState<string | null>(null);
  const [saisie, setSaisie] = useState("");
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setCle(cleAppareilVisible());
  }, []);

  async function copier() {
    if (!cle) return;
    try {
      await navigator.clipboard.writeText(cle);
      setInfo("Code copié.");
    } catch {
      setInfo("Copie impossible : sélectionne le code à la main.");
    }
  }

  function recuperer() {
    const c = saisie.trim();
    if (!FORMAT_CLE.test(c)) {
      setInfo("Ce code ne semble pas valide.");
      return;
    }
    try {
      changerCleAppareil(c);
    } catch {
      setInfo("Récupération impossible.");
    }
  }

  return (
    <section className="surface space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <KeyRound className="h-4 w-4 text-brand" /> Transférer ma progression
      </h2>
      <p className="text-xs text-muted-foreground">
        Ce code identifie ta progression. Note-le : il permet de la retrouver sur un autre
        navigateur, ou dans l'application ajoutée à l'écran d'accueil.
      </p>

      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-xl border border-border bg-elevated px-3 py-2 text-[0.68rem]">
          {cle ?? "—"}
        </code>
        <button
          onClick={copier}
          className="tap rounded-xl border border-border bg-card p-2.5"
          aria-label="Copier mon code"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-semibold">Récupérer une progression</p>
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="ing-…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-xs"
        />
        <button
          onClick={recuperer}
          className="tap flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold"
        >
          <LogIn className="h-3.5 w-3.5" /> Utiliser ce code
        </button>
        <p className="text-[0.68rem] text-muted-foreground">
          Attention : la progression actuelle de cet appareil sera remplacée par celle du code
          saisi.
        </p>
      </div>

      {info ? <p className="text-xs text-muted-foreground">{info}</p> : null}
    </section>
  );
}
