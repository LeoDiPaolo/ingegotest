import { useCallback, useEffect, useState } from "react";

export type Resultat = "ok" | "ko";
export type Historique = Record<string, Resultat>;

const CLE = "ingego-beta-historique";

function lire(): Historique {
  if (typeof localStorage === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as Historique) : {};
  } catch {
    return {};
  }
}

/* Historique local des questions déjà répondues, avec juste / à revoir. */
export function useHistorique() {
  const [historique, setHistorique] = useState<Historique>({});

  useEffect(() => {
    setHistorique(lire());
  }, []);

  const noter = useCallback((id: string, resultat: Resultat) => {
    setHistorique((h) => {
      const suivant = { ...h, [id]: resultat };
      try {
        localStorage.setItem(CLE, JSON.stringify(suivant));
      } catch {
        /* stockage indisponible */
      }
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

  return { historique, noter, reinitialiser };
}
