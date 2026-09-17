import { useCallback, useEffect, useRef, useState } from "react";
import { ecrireEtat, lireEtat } from "./etat.functions";
import { JAMAIS, JOUR, normaliserReglages, type Carte, type Etat, type Reglages } from "./algo";
import { CORPUS } from "./corpus";
import {
  COMMENTAIRES_TRAITES,
  IDS_REVUS,
  VERSION_COMMENTAIRES,
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
const CLE_PURGE_COM = "ingego-purge-commentaires";
const CLE_PURGE_REV = "ingego-purge-revisions";
const CLE_RESTAURATION_REV = "ingego-restauration-revisions";

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

/* Transfert de progression : la clé est visible dans les Réglages, et peut être
   collée sur un autre appareil (ou dans la version installée sur l'écran
   d'accueil, qui possède son propre stockage). */
export function cleAppareilVisible(): string | null {
  return cleAppareil();
}

export const FORMAT_CLE = /^ing-[0-9a-fA-F-]{36}$/;

export function changerCleAppareil(nouvelle: string) {
  const c = nouvelle.trim();
  if (!FORMAT_CLE.test(c)) throw new Error("Clé invalide");
  localStorage.setItem(CLE_APPAREIL, c);
  localStorage.removeItem(CLE_LOCALE);
  window.location.reload();
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

function aPurger(cle: string, version: string): boolean {
  try {
    return (localStorage.getItem(cle) || "") !== version;
  } catch {
    return false;
  }
}

/* La version 2026-09-11a a supprimé par erreur les cartes revues. On restaure
   celles dont le journal prouve une réussite, sans les remettre dans la mission
   en cours. Les corrections de contenu suivantes ne toucheront plus aux cartes. */
function restaurerValidationsRevues(d: Donnees, maintenant: number): Donnees {
  try {
    const purgeAppliquee = localStorage.getItem(CLE_PURGE_REV) === VERSION_REVISIONS;
    const dejaRestauree = localStorage.getItem(CLE_RESTAURATION_REV) === VERSION_REVISIONS;
    if (!purgeAppliquee || dejaRestauree) return d;
  } catch {
    return d;
  }

  const cartes = { ...d.cartes };
  for (const id of new Set(IDS_REVUS)) {
    if (cartes[id]?.p && cartes[id].p >= 1) continue;
    const reussites = d.journal.filter((entree) => entree.id === id && entree.note > 0);
    if (!reussites.length) continue;
    const derniere = reussites.reduce((a, b) => (a.t >= b.t ? a : b));
    cartes[id] = {
      p: 1,
      e: 2.3,
      du: maintenant + JOUR,
      reps: d.journal.filter((entree) => entree.id === id).length,
      echecs: d.journal.filter((entree) => entree.id === id && entree.note === 0).length,
      vu: true,
      dernier: derniere.t,
    };
  }
  return { ...d, cartes };
}

/* Rattrapage général : une question est validée dès qu'elle a été réussie au
   premier passage d'une mission (et non d'une journée : plusieurs missions
   peuvent avoir lieu le même jour). Les repères "__session" du journal
   délimitent les missions. La carte est alors rétablie définitivement
   (échéance JAMAIS) sans revenir en jeu. Ce filet tourne à chaque chargement :
   une validation prouvée par le journal ne peut plus disparaître. */
export function restaurerToutesValidations(d: Donnees): Donnees {
  const journal = [...d.journal]
    .filter((e) => e && typeof e.t === "number")
    .sort((a, b) => a.t - b.t);

  /* Les anciennes versions n'enregistraient qu'une fin de mission par jour.
     On reconstitue donc aussi les missions historiques : 8 questions uniques,
     puis toutes les reprises résolues. Une longue interruption sépare deux
     missions anciennes même si leur marqueur manque. */
  const premieres = new Map<string, Entree>();
  let mission = 0;
  let precedente = 0;
  let vues = new Set<string>();
  let erreurs = new Set<string>();
  const tailleMission = Math.max(1, d.reglages.parSession || 8);
  const nouvelleMission = () => {
    mission += 1;
    vues = new Set<string>();
    erreurs = new Set<string>();
  };

  for (const e of journal) {
    if (e.id === "__mission_start" || e.id === "__session") {
      nouvelleMission();
      precedente = e.t;
      continue;
    }
    if (precedente && e.t - precedente > 2 * 60 * 60 * 1000 && vues.size) {
      nouvelleMission();
    }
    const k = `${e.id}|${mission}`;
    if (!premieres.has(k)) premieres.set(k, e);
    vues.add(e.id);
    if (e.note <= 0) erreurs.add(e.id);
    else erreurs.delete(e.id);
    precedente = e.t;
    if (vues.size >= tailleMission && erreurs.size === 0) nouvelleMission();
  }

  const validees = new Map<string, number>();
  for (const e of premieres.values()) {
    if (e.note <= 0) continue;
    validees.set(e.id, Math.max(validees.get(e.id) ?? 0, e.t));
  }

  const cartes = { ...d.cartes };
  for (const [id, t] of validees) {
    const existante = cartes[id];
    if (existante && existante.du >= JAMAIS) continue;
    cartes[id] = existante
      ? { ...existante, p: Math.max(existante.p, 1), du: JAMAIS, vu: true }
      : { p: 1, e: 2.3, du: JAMAIS, reps: 1, echecs: 0, vu: true, dernier: t };
  }
  return { ...d, cartes };
}

function marquerPurge(cle: string, version: string) {
  try {
    localStorage.setItem(cle, version);
  } catch {
    /* ignore */
  }
}

/* Alignement des compteurs : les questions retirées du corpus (doublons
   supprimés) laissaient des cartes et des entrées de journal orphelines. Elles
   n'apparaissent nulle part dans l'application mais gonflaient les totaux
   enregistrés. On les élague à chaque chargement pour que le compte affiché,
   le compte local et le compte serveur soient toujours identiques. */
const MARQUEURS = new Set(["__session", "__mission_start"]);
function elaguer(d: Donnees): Donnees {
  const connus = new Set(CORPUS.map((q) => q.id));
  const cartes: Etat = {};
  for (const [id, c] of Object.entries(d.cartes)) if (connus.has(id)) cartes[id] = c as Carte;
  const journal = d.journal.filter((e) => connus.has(e.id) || MARQUEURS.has(e.id));
  const commentaires: Record<string, string> = {};
  for (const [id, v] of Object.entries(d.commentaires)) if (connus.has(id)) commentaires[id] = v;
  return { ...d, cartes, journal, commentaires };
}

/* Une correction de contenu ne retire plus jamais une carte : seules les
   observations déjà traitées sont nettoyées. */
function purger(d: Donnees, purgeCom: boolean): Donnees {
  let sortie = d;
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
    const locale = c as Carte;
    /* Une copie plus récente ne peut jamais écraser une validation définitive
       provenant de l'autre copie. */
    if (!d || locale.du >= JAMAIS || (d.du < JAMAIS && locale.dernier >= d.dernier)) {
      cartes[id] = locale;
    }
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
    .slice(-20000);
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
    /* Une observation traitée n'est purgée qu'une fois pour cette version. Une
       nouvelle observation sur la même question doit pouvoir être conservée. */
    const purgeCom = aPurger(CLE_PURGE_COM, VERSION_COMMENTAIRES);
    const local = restaurerToutesValidations(
      restaurerValidationsRevues(elaguer(purger(lireLocal(), purgeCom)), Date.now()),
    );
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
        const fusion = restaurerToutesValidations(
          restaurerValidationsRevues(
            elaguer(purger(fusionner(dernier.current, distant), purgeCom)),
            Date.now(),
          ),
        );
        setDonnees(fusion);
        pousser(fusion);
        if (purgeCom) marquerPurge(CLE_PURGE_COM, VERSION_COMMENTAIRES);
        marquerPurge(CLE_RESTAURATION_REV, VERSION_REVISIONS);
      } else {
        pousser(dernier.current);
        if (purgeCom) marquerPurge(CLE_PURGE_COM, VERSION_COMMENTAIRES);
        marquerPurge(CLE_RESTAURATION_REV, VERSION_REVISIONS);
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
        ].slice(-20000),
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
