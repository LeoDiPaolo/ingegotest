import { useCallback, useEffect, useRef, useState } from "react";
import { ecrireEtat, lireEtat } from "./etat.functions";
import { normaliserReglages, type Carte, type Etat, type Reglages } from "./algo";
import {
  COMMENTAIRES_TRAITES,
  IDS_CORRIGES,
  IDS_REVUS,
  VERSION_COMMENTAIRES,
  VERSION_CORRECTIONS,
  VERSION_REVISIONS,
} from "./corrections";

/* Sauvegarde de la progression : écriture immédiate sur l'appareil (réactivité,
   utilisable hors ligne sur un chantier) puis synchronisation avec la base.
   La ligne est identifiée par une clé d'appareil tirée au hasard : aucun compte
   à créer, mais la progression est bien conservée côté serveur. */

export interface Entree {
  id: string;
  note: number;
  jour: string;
  t: number;
}

export interface Donnees {
  cartes: Etat;
  journal: Entree[];
  reglages: Reglages;
  commentaires: Record<string, string>;
}

const CLE_LOCALE = "ingego-donnees";
const CLE_APPAREIL = "ingego-cle-appareil";
const CLE_PURGE = "ingego-purge";
const CLE_PURGE_COM = "ingego-purge-commentaires";
const CLE_PURGE_REV = "ingego-purge-revisions";

export const VIDE: Donnees = {
  cartes: {},
  journal: [],
  reglages: normaliserReglages(null),
  commentaires: {},
};

function cleAppareil() {
  if (typeof localStorage === "undefined") return null;
  let c = localStorage.getItem(CLE_APPAREIL);
  if (!c) {
    c = `ing-${crypto.randomUUID()}`;
    localStorage.setItem(CLE_APPAREIL, c);
  }
  return c;
}

function lireLocal(): Donnees {
  if (typeof localStorage === "undefined") return VIDE;
  try {
    const brut = localStorage.getItem(CLE_LOCALE);
    if (!brut) return VIDE;
    const d = JSON.parse(brut) as Partial<Donnees>;
    return {
      cartes: d.cartes ?? {},
      journal: d.journal ?? [],
      reglages: normaliserReglages(d.reglages),
      commentaires: d.commentaires ?? {},
    };
  } catch {
    return VIDE;
  }
}

function ecrireLocal(d: Donnees) {
  try {
    localStorage.setItem(CLE_LOCALE, JSON.stringify(d));
  } catch {
    /* stockage indisponible */
  }
}

/* Les questions corrigées après coup repartent à zéro : la progression acquise
   portait sur un énoncé qui n'existe plus. */
function aPurger(cle: string, version: string): boolean {
  try {
    return (localStorage.getItem(cle) || "") !== version;
  } catch {
    return false;
  }
}

function marquerPurge(cle: string, version: string) {
  try {
    localStorage.setItem(cle, version);
  } catch {
    /* ignore */
  }
}

function purger(
  d: Donnees,
  purgeCartes: boolean,
  purgeCom: boolean,
  purgeRev: boolean,
): Donnees {
  let sortie = d;
  if (purgeCartes) {
    const cartes = { ...sortie.cartes };
    for (const id of IDS_CORRIGES) delete cartes[id];
    sortie = { ...sortie, cartes };
  }
  if (purgeRev) {
    const cartes = { ...sortie.cartes };
    for (const id of IDS_REVUS) delete cartes[id];
    sortie = { ...sortie, cartes };
  }
  if (purgeCom) {
    const commentaires = { ...sortie.commentaires };
    for (const id of COMMENTAIRES_TRAITES) delete commentaires[id];
    sortie = { ...sortie, commentaires };
  }
  return sortie;
}


/* Fusion appareil ↔ serveur : pour chaque question on garde la révision la plus récente. */
function fusionner(local: Donnees, distant: Donnees): Donnees {
  const cartes: Etat = { ...distant.cartes };
  for (const [id, c] of Object.entries(local.cartes)) {
    const d = cartes[id];
    if (!d || (c as Carte).dernier >= d.dernier) cartes[id] = c;
  }
  const vus = new Set<string>();
  const journal = [...distant.journal, ...local.journal]
    .filter((e) => {
      const k = `${e.id}|${e.t}`;
      if (vus.has(k)) return false;
      vus.add(k);
      return true;
    })
    .sort((a, b) => a.t - b.t)
    .slice(-3000);
  return {
    cartes,
    journal,
    reglages: local.reglages,
    commentaires: { ...distant.commentaires, ...local.commentaires },
  };
}

export function useDonnees() {
  const [donnees, setDonnees] = useState<Donnees>(VIDE);
  const [pret, setPret] = useState(false);
  const [synchro, setSynchro] = useState<"local" | "en-cours" | "ok" | "erreur">("local");
  const cle = useRef<string | null>(null);
  const attente = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dernier = useRef<Donnees>(VIDE);

  const pousser = useCallback((d: Donnees) => {
    dernier.current = d;
    ecrireLocal(d);
    if (!cle.current) return;
    if (attente.current) clearTimeout(attente.current);
    attente.current = setTimeout(async () => {
      setSynchro("en-cours");
      try {
        await ecrireEtat({
          data: {
            cle: cle.current!,
            cartes: dernier.current.cartes as never,
            journal: dernier.current.journal as never,
            reglages: dernier.current.reglages as never,
            commentaires: dernier.current.commentaires,
          },
        });
        setSynchro("ok");
      } catch {
        setSynchro("erreur");
      }
    }, 800);
  }, []);

  useEffect(() => {
    let vivant = true;
    const purgeCartes = aPurger(CLE_PURGE, VERSION_CORRECTIONS);
    /* Les commentaires déjà traités sont retirés à chaque ouverture : la version
       seule ne suffisait pas (une copie pouvait revenir du serveur plus tard). */
    const purgeCom = true;
    void CLE_PURGE_COM;
    void VERSION_COMMENTAIRES;
    const purgeRev = aPurger(CLE_PURGE_REV, VERSION_REVISIONS);
    const local = purger(lireLocal(), purgeCartes, purgeCom, purgeRev);
    setDonnees(local);
    dernier.current = local;
    setPret(true);
    cle.current = cleAppareil();

    (async () => {
      if (!cle.current) return;
      setSynchro("en-cours");
      let data: Awaited<ReturnType<typeof lireEtat>> = null;
      try {
        data = await lireEtat({ data: { cle: cle.current } });
      } catch {
        if (vivant) setSynchro("erreur");
        return;
      }
      if (!vivant) return;
      if (data) {
        const distant: Donnees = {
          cartes: (data.cartes as unknown as Etat) ?? {},
          journal: (data.journal as unknown as Entree[]) ?? [],
          reglages: normaliserReglages(data.reglages as unknown as Partial<Reglages>),
          commentaires: (data.commentaires as unknown as Record<string, string>) ?? {},
        };
        const fusion = purger(
          fusionner(dernier.current, distant),
          purgeCartes,
          purgeCom,
          purgeRev,
        );
        setDonnees(fusion);
        pousser(fusion);
        if (purgeCartes) marquerPurge(CLE_PURGE, VERSION_CORRECTIONS);
        if (purgeCom) marquerPurge(CLE_PURGE_COM, VERSION_COMMENTAIRES);
        if (purgeRev) marquerPurge(CLE_PURGE_REV, VERSION_REVISIONS);
      } else {
        pousser(dernier.current);
        if (purgeCartes) marquerPurge(CLE_PURGE, VERSION_CORRECTIONS);
        if (purgeCom) marquerPurge(CLE_PURGE_COM, VERSION_COMMENTAIRES);
        if (purgeRev) marquerPurge(CLE_PURGE_REV, VERSION_REVISIONS);
      }

      setSynchro("ok");
    })();
    return () => {
      vivant = false;
    };
  }, [pousser]);

  const maj = useCallback(
    (transformer: (d: Donnees) => Donnees) => {
      setDonnees((d) => {
        const suivant = transformer(d);
        pousser(suivant);
        return suivant;
      });
    },
    [pousser],
  );

  const enregistrerCarte = useCallback(
    (id: string, carte: Carte, note: number, t: number) =>
      maj((d) => ({
        ...d,
        cartes: { ...d.cartes, [id]: carte },
        journal: [
          ...d.journal,
          { id, note, jour: new Date(t).toISOString().slice(0, 10), t },
        ].slice(-3000),
      })),
    [maj],
  );

  const majReglages = useCallback(
    (r: Partial<Reglages>) =>
      maj((d) => ({ ...d, reglages: normaliserReglages({ ...d.reglages, ...r }) })),
    [maj],
  );

  const commenter = useCallback(
    (id: string, texte: string) =>
      maj((d) => {
        const commentaires = { ...d.commentaires };
        if (texte.trim()) commentaires[id] = texte;
        else delete commentaires[id];
        return { ...d, commentaires };
      }),
    [maj],
  );

  const reinitialiser = useCallback(() => maj(() => ({ ...VIDE })), [maj]);

  return {
    donnees,
    pret,
    synchro,
    enregistrerCarte,
    majReglages,
    commenter,
    reinitialiser,
    maj,
  };
}

/* Série de jours consécutifs avec au moins une session terminée. */
export function serieJours(joursTermines: string[]) {
  const set = new Set(joursTermines);
  let n = 0;
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
