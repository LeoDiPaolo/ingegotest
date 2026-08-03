import { useCallback, useEffect, useState } from "react";
import { IDS_CORRIGES, VERSION_CORRECTIONS } from "./corrections";

export type Resultat = "ok" | "ko";
export type Historique = Record<string, Resultat>;
export type Commentaires = Record<string, string>;

const CLE = "ingego-beta-historique";
const CLE_COM = "ingego-beta-commentaires";
const CLE_PURGE = "ingego-beta-purge";

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

/* Les questions corrigées repartent à zéro : l'ancienne réponse était fausse,
   la progression enregistrée dessus ne doit pas rester acquise. */
function purger(h: Historique): Historique {
  let deja = "";
  try {
    deja = localStorage.getItem(CLE_PURGE) || "";
  } catch {
    return h;
  }
  if (deja === VERSION_CORRECTIONS) return h;
  const suivant = { ...h };
  for (const id of IDS_CORRIGES) delete suivant[id];
  ecrire(CLE, suivant);
  try {
    localStorage.setItem(CLE_PURGE, VERSION_CORRECTIONS);
  } catch {
    /* stockage indisponible */
  }
  return suivant;
}

/* Historique local des questions déjà répondues, avec juste / à revoir,
   et observations libres saisies pendant la relecture bêta. */
export function useHistorique() {
  const [historique, setHistorique] = useState<Historique>({});
  const [commentaires, setCommentaires] = useState<Commentaires>({});

  useEffect(() => {
    setHistorique(purger(lire<Historique>(CLE)));
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

