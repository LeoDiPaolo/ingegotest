import { cn } from "@/lib/utils";

export interface NoeudOrga {
  l: string;
  sub?: string;
  /** rattachement : indice du nœud parent dans la liste (absent = racine) */
  parent?: number;
  /** nœud de contexte, non cliquable */
  fixe?: boolean;
}

export interface DonneesOrga {
  titre?: string;
  noeuds: NoeudOrga[];
}

/**
 * Organigramme cliquable : on répond en désignant un acteur du schéma.
 * Rendu en colonne (lisible sur mobile) avec rail de rattachement.
 */
export function Organigramme({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesOrga;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { noeuds, titre } = donnees;
  const racines = noeuds.map((n, i) => ({ n, i })).filter(({ n }) => n.parent === undefined);

  const etat = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "ok" as const;
      if (i === selection) return "ko" as const;
      return "neutre" as const;
    }
    return i === selection ? "choisi" : "neutre";
  };

  const classe = (e: ReturnType<typeof etat>) =>
    cn(
      "tap w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
      e === "neutre" && "border-border bg-card text-foreground",
      e === "choisi" && "border-primary bg-primary/15",
      e === "ok" && "border-success bg-success/15",
      e === "ko" && "border-destructive bg-destructive/15",
    );

  const Carte = ({ i }: { i: number }) => {
    const n = noeuds[i];
    const contenu = (
      <>
        <span className="block text-sm leading-snug font-medium">{n.l}</span>
        {n.sub && <span className="mt-0.5 block text-xs text-muted-foreground">{n.sub}</span>}
      </>
    );
    if (n.fixe) return <div className={cn(classe("neutre"), "opacity-70")}>{contenu}</div>;
    return (
      <button
        type="button"
        disabled={corrige}
        aria-pressed={selection === i}
        onClick={() => onSelect(i)}
        className={cn(classe(etat(i)), !corrige && "cursor-pointer")}
      >
        {contenu}
      </button>
    );
  };

  const enfantsDe = (i: number) => noeuds.map((n, j) => ({ n, j })).filter(({ n }) => n.parent === i);

  const Branche = ({ i, niveau }: { i: number; niveau: number }) => {
    const enfants = enfantsDe(i);
    return (
      <li className="relative">
        <Carte i={i} />
        {enfants.length > 0 && (
          <ul className="mt-2 space-y-2 border-l border-dashed border-plan-line/60 pl-3">
            {enfants.map(({ j }) => (
              <Branche key={j} i={j} niveau={niveau + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-4">
      {titre && (
        <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">{titre}</p>
      )}
      <ul className="space-y-2">
        {racines.map(({ i }) => (
          <Branche key={i} i={i} niveau={0} />
        ))}
      </ul>
      {!corrige && (
        <p className="text-xs text-muted-foreground">Touchez l'acteur qui répond à la question.</p>
      )}
    </div>
  );
}
