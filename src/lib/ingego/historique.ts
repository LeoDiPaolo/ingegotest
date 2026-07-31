import { useCallback, useEffect, useState } from "react";

export type Resultat = "ok" | "ko";
export type Historique = Record<string, Resultat>;
export type Commentaires = Record<string, string>;

const CLE = "ingego-beta-historique";
const CLE_COM = "ingego-beta-commentaires";

function lire<T>(cle: string): T {
  if (typeof localStorage === "undefined") return {} as T;
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function ecrire(cle: string, valeur: unknown) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* stockage indisponible */
  }
}

/* Historique local des questions déjà répondues, avec juste / à revoir,
   et observations libres saisies pendant la relecture bêta. */
export function useHistorique() {
  const [historique, setHistorique] = useState<Historique>({});
  const [commentaires, setCommentaires] = useState<Commentaires>({});

  useEffect(() => {
    setHistorique(lire<Historique>(CLE));
    setCommentaires(lire<Commentaires>(CLE_COM));
  }, []);

  const noter = useCallback((id: string, resultat: Resultat) => {
    setHistorique((h) => {
      const suivant = { ...h, [id]: resultat };
      ecrire(CLE, suivant);
      return suivant;
    });
  }, []);

  const commenter = useCallback((id: string, texte: string) => {
    setCommentaires((c) => {
      const suivant = { ...c };
      if (texte.trim()) suivant[id] = texte;
      else delete suivant[id];
      ecrire(CLE_COM, suivant);
      return suivant;
    });
  }, []);

  const reinitialiser = useCallback(() => {
    setHistorique({});
    try {
      localStorage.removeItem(CLE);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  return { historique, commentaires, noter, commenter, reinitialiser };
}

