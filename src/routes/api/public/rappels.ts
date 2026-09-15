import { createFileRoute } from "@tanstack/react-router";
import { AXES, CORPUS } from "@/lib/ingego/corpus";

/* Envoi des rappels du matin, du midi et du soir. Appelée par la planification
   de la base et protégée par un jeton partagé. */

interface Carte {
  p?: number;
  vu?: boolean;
}

interface Entree {
  id?: string;
  jour?: string;
}

interface Ligne {
  cle: string;
  cartes: Record<string, Carte> | null;
  journal: Entree[] | null;
}

interface AbonnementLigne {
  id: string;
  cle: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  prenom: string | null;
  dernier_envoi: string | null;
  dernier_creneau: string | null;
}

type Creneau = "matin" | "midi" | "soir";

interface ObjectifProgression {
  axe: string;
  niveau: number;
  restantes: number;
  validees: number;
  total: number;
}

function jourParis(date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function decalerJour(jour: string, jours: number): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

/* Nombre de jours consécutifs de missions terminant aujourd'hui ou hier. */
function serie(jours: Set<string>, aujourdhui: string): number {
  let depart = aujourdhui;
  if (!jours.has(depart)) {
    depart = decalerJour(aujourdhui, -1);
    if (!jours.has(depart)) return 0;
  }
  let n = 0;
  let curseur = depart;
  while (jours.has(curseur)) {
    n += 1;
    curseur = decalerJour(curseur, -1);
  }
  return n;
}

/* Une graine différente est utilisée pour chaque partie du message afin que
   titre et corps ne reviennent pas toujours dans la même combinaison. */
function piocher(liste: string[], graine: number): string {
  return liste[graine % liste.length] as string;
}

function grainePour(cle: string, jour: string, creneau: string): number {
  let h = 7;
  for (const c of `${cle}|${jour}|${creneau}`) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return h;
}

function accroche(prenom: string | null, creneau: Creneau, graine: number): string {
  const p = prenom?.trim() || "chef";
  const matin = [
    `Debout ${p}, le béton n'attend pas.`,
    `Café, casque, IngéGo, ${p}.`,
    `${p}, réveil du cerveau dans 3… 2…`,
    `Bonjour ${p}. Le jury fait déjà semblant d'être prêt.`,
    `${p}, petite mission avant le grand monde.`,
    `Le jour se lève. Le niveau aussi, ${p}.`,
    `Matin calme, neurones affûtés, ${p}.`,
    `${p}, même le castor a ouvert un œil.`,
    `Réveil technique, ${p}. Sans réunion préalable.`,
    `Éric, Ramzy et ${p} entrent dans une mission…`,
    `${p}, Alain Chabat ne fera pas la voix off tout seul.`,
    `Bonjour ${p}. Autorisation de réviser accordée.`,
  ];
  const midi = [
    `${p}, le dessert peut attendre 5 minutes.`,
    `Pause déjeuner, cerveau toujours ouvert.`,
    `${p}, menu du jour : 8 questions, sauce concours.`,
    `Un QCM entre la poire et le Code civil ?`,
    `${p}, le café réclame une mission en accompagnement.`,
    `Midi. Le moment exact où le jury baisse sa garde.`,
    `${p}, pas de sieste avant validation du chantier.`,
    `Éric et Ramzy hésitent. À toi de trancher, ${p}.`,
    `${p}, ceci n'est pas une réunion : ça sera bref.`,
    `Pause réglementaire. Révision facultativement obligatoire.`,
    `${p}, Alain Chabat valide ce créneau. Probablement.`,
    `Le niveau mijote, ${p}. On soulève le couvercle ?`,
  ];
  const soir = [
    `${p}, dernier tour de chantier.`,
    `Le bureau ferme, pas la mémoire.`,
    `${p}, une mission et générique de fin.`,
    `Fin de journée. Début des réponses brillantes.`,
    `${p}, le jury croit que tu as terminé.`,
    `On clôture proprement, sans réserve ?`,
    `${p}, huit questions avant extinction des feux.`,
    `Même Alain Chabat n'a pas trouvé meilleure conclusion.`,
    `${p}, contrôle technique des neurones.`,
    `Dernier round. Éric et Ramzy gardent le chrono.`,
    `${p}, petite mission, grande dignité.`,
    `Le castor range ses plans après cette mission.`,
  ];
  const liste = creneau === "matin" ? matin : creneau === "midi" ? midi : soir;
  return piocher(liste, graine);
}

function objectifProgression(
  cartes: Record<string, Carte>,
  graine: number,
): ObjectifProgression | null {
  const validees = CORPUS.filter((q) => (cartes[q.id]?.p ?? 0) >= 1).length;
  const objectifs = AXES.flatMap((axe) => {
    const questions = CORPUS.filter((q) => q.axe === axe.id);
    const nonValidees = questions.filter((q) => (cartes[q.id]?.p ?? 0) < 1);
    if (!nonValidees.length) return [];
    const niveau = Math.min(...nonValidees.map((q) => q.niv));
    const restantes = questions.filter(
      (q) => q.niv === niveau && (cartes[q.id]?.p ?? 0) < 1,
    ).length;
    return [{ axe: axe.court, niveau, restantes, validees, total: CORPUS.length }];
  }).sort((a, b) => a.restantes - b.restantes || a.axe.localeCompare(b.axe, "fr"));

  if (!objectifs.length) return null;
  const minimum = objectifs[0]?.restantes ?? 0;
  const plusProches = objectifs.filter((o) => o.restantes === minimum);
  return plusProches[graine % plusProches.length] ?? null;
}

function texteObjectif(objectif: ObjectifProgression | null, graine: number): string {
  if (!objectif) {
    return piocher(
      [
        "Tout est validé. Le jury peut commencer à s'inquiéter.",
        "Corpus terminé : le castor demande officiellement une médaille.",
        "100 % validé. Même Alain Chabat n'avait pas prévu ce scénario.",
      ],
      graine,
    );
  }
  const s = objectif.restantes > 1 ? "s" : "";
  const verbe = objectif.restantes > 1 ? "restent" : "reste";
  return piocher(
    [
      `Plus que ${objectif.restantes} question${s} pour valider le niveau ${objectif.niveau} de ${objectif.axe}.`,
      `${objectif.validees} questions validées. Prochaine cible : niveau ${objectif.niveau} de ${objectif.axe}.`,
      `Le niveau ${objectif.niveau} de ${objectif.axe} est à ${objectif.restantes} question${s} du dénouement.`,
      `${objectif.restantes} question${s} ${verbe} avant de boucler ${objectif.axe}, niveau ${objectif.niveau}.`,
      `Objectif rapproché : ${objectif.axe}, niveau ${objectif.niveau}. Encore ${objectif.restantes}.`,
      `${objectif.validees}/${objectif.total} validées. ${objectif.axe} est le prochain niveau à faire tomber.`,
      `Plot twist : il ne reste que ${objectif.restantes} question${s} au niveau ${objectif.niveau} de ${objectif.axe}.`,
      `Éric et Ramzy en enlèvent deux… non. Il en reste exactement ${objectif.restantes} pour ${objectif.axe}.`,
    ],
    graine,
  );
}

function messagePour(
  ligne: Ligne | undefined,
  aujourdhui: string,
  creneau: Creneau,
  prenom: string | null,
  cle: string,
) {
  const cartes = Object.values(ligne?.cartes ?? {});
  /* Questions encore à valider du premier coup : vues mais ratées, elles
     restent en jeu jusqu'à leur validation définitive. */
  const dues = cartes.filter((c) => c && c.vu && (c.p ?? 0) === 0).length;

  const joursSession = new Set(
    (ligne?.journal ?? [])
      .filter((e) => e && e.id === "__session" && typeof e.jour === "string")
      .map((e) => e.jour as string),
  );
  if (joursSession.has(aujourdhui)) return null;

  const jourDernier = [...joursSession].sort().pop();
  const inactivite = jourDernier
    ? Math.round(
        (Date.parse(`${aujourdhui}T12:00:00Z`) - Date.parse(`${jourDernier}T12:00:00Z`)) / 86400000,
      )
    : null;

  const graine = grainePour(cle, aujourdhui, creneau);
  const titre = accroche(prenom, creneau, graine);
  const n = serie(joursSession, aujourdhui);
  const objectif = objectifProgression(ligne?.cartes ?? {}, graine + 17);
  const progression = texteObjectif(objectif, graine + 31);

  if (n >= 3) {
    return {
      titre,
      corps: piocher(
        [
          `${n} jours d'affilée : ce serait dommage de casser la série maintenant.`,
          `Ta série de ${n} jours tient encore à une mission.`,
          `${n} jours au compteur. On garde le rythme ?`,
          `${n} jours de suite. À ce stade, c'est une jurisprudence.`,
          `Série de ${n} jours : le castor refuse de redescendre du podium.`,
          `${n} jours sans lâcher. Éric et Ramzy préparent déjà le biopic.`,
          progression,
        ],
        graine + 7,
      ),
      tag: "ingego-serie",
    };
  }

  if (inactivite !== null && inactivite >= 3) {
    return {
      titre,
      corps: piocher(
        [
          `${inactivite} jours sans révision : tes cartes prennent la poussière.`,
          `Le concours avance, toi non depuis ${inactivite} jours.`,
          `On repart doucement ? 8 questions suffisent aujourd'hui.`,
          `${inactivite} jours de pause. Le cerveau a fini sa maintenance.`,
          `Après ${inactivite} jours, même le Code de la commande publique demande des nouvelles.`,
          `Retour de mission après ${inactivite} jours. Aucun justificatif demandé.`,
          progression,
        ],
        graine + 11,
      ),
      tag: "ingego-relance",
    };
  }

  if (dues > 0) {
    return {
      titre,
      corps: piocher(
        [
          progression,
          `${dues} question${dues > 1 ? "s non validées attendent" : " non validée attend"}. Pas de panique, juste du panache.`,
          `${dues} point${dues > 1 ? "s" : ""} à reprendre. Le béton sèche, la mémoire aussi.`,
          `Il reste du travail, mais aucun PowerPoint de 86 diapositives n'est prévu.`,
          `Mission courte, effet durable. Comme une bonne clause, mais plus drôle.`,
          `Le niveau ne va pas se valider par télépathie. Alain Chabat a essayé.`,
          `${dues} question${dues > 1 ? "s" : ""} encore en jeu. À toi de faire le tri, littéralement parfois.`,
        ],
        graine + 19,
      ),
      tag: "ingego-rappel",
    };
  }

  if (creneau === "matin") {
    return {
      titre,
      corps: piocher(
        [
          "Une mission de 8 questions pour bien démarrer.",
          "Rien d'urgent, mais une mission ne fait jamais de mal.",
          "Objectif du jour : une mission, pas plus.",
          progression,
          "Huit questions. Moins long qu'un ordre du jour, plus utile qu'un tour de table.",
          "Une petite mission avant que les acronymes ne se reproduisent.",
          "Le concours ne se révise pas tout seul. On a vérifié deux fois.",
          "Quelques questions, zéro réunion, résultat immédiat.",
        ],
        graine + 23,
      ),
      tag: "ingego-matin",
    };
  }

  return null;
}

async function traiter(request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  /* Le token quotidien est stocké en base pour que le job pg_cron et la route
     partagent la même valeur, sans dépendre d'un secret d'environnement. */
  const { data: ligneConfig } = await supabaseAdmin
    .from("config_rappels" as never)
    .select("valeur")
    .eq("cle", "RAPPELS_TOKEN")
    .maybeSingle();
  const jeton =
    (ligneConfig as { valeur?: string } | null)?.valeur ?? process.env["RAPPELS_TOKEN"] ?? "";

  const fourni =
    request.headers.get("x-rappels-token") ?? new URL(request.url).searchParams.get("token") ?? "";
  if (!jeton || fourni !== jeton) {
    return new Response("Non autorisé", { status: 401 });
  }
  const aujourdhui = jourParis();
  const params = new URL(request.url).searchParams;
  const demande = params.get("creneau");
  const creneau: Creneau =
    demande === "matin" || demande === "midi" || demande === "soir" ? demande : "soir";

  /* La planification tourne en UTC : chaque créneau est déclenché aux deux
     heures possibles (été / hiver) et l'heure de Paris tranche. On extrait
     l'heure via formatToParts : le format fr-FR ajoute un suffixe (« 08 h »)
     qui rendait la conversion numérique invalide. */
  const parties = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const heureParis = Number(parties.find((p) => p.type === "hour")?.value ?? NaN);
  const heureAttendue = creneau === "matin" ? 8 : creneau === "midi" ? 12 : 18;
  if (params.get("forcer") !== "1" && Number.isFinite(heureParis) && heureParis !== heureAttendue) {
    return Response.json({ jour: aujourdhui, creneau, ignore: "hors créneau", heureParis });
  }

  const { data: abonnementsBruts, error: erreurAb } = await supabaseAdmin
    .from("abonnements_push")
    .select("id, cle, endpoint, p256dh, auth, prenom, dernier_envoi, dernier_creneau");
  if (erreurAb) {
    console.error("rappels/abonnements", erreurAb);
    return new Response("Erreur", { status: 500 });
  }

  /* Un envoi par créneau et par jour : matin, midi et fin de journée. */
  const abonnements = ((abonnementsBruts ?? []) as unknown as AbonnementLigne[]).filter(
    (a) => !(a.dernier_envoi === aujourdhui && a.dernier_creneau === creneau),
  );
  if (abonnements.length === 0) {
    return Response.json({ jour: aujourdhui, envoyes: 0, appareils: 0 });
  }

  const cles = [...new Set(abonnements.map((a) => a.cle))];
  const { data: etats, error: erreurEtat } = await supabaseAdmin
    .from("etat_ingego")
    .select("cle, cartes, journal")
    .in("cle", cles);
  if (erreurEtat) {
    console.error("rappels/etats", erreurEtat);
    return new Response("Erreur", { status: 500 });
  }

  const parCle = new Map<string, Ligne>();
  for (const l of (etats ?? []) as unknown as Ligne[]) parCle.set(l.cle, l);

  const dejaEnvoye = new Set<string>();
  const { envoyerA } = await import("@/lib/ingego/push.server");
  let envoyes = 0;

  for (const ab of abonnements) {
    if (dejaEnvoye.has(ab.cle)) continue;
    const message = messagePour(parCle.get(ab.cle), aujourdhui, creneau, ab.prenom, ab.cle);
    if (!message) continue;
    try {
      const vivant = await envoyerA(ab, message);
      if (!vivant) {
        await supabaseAdmin.from("abonnements_push").delete().eq("id", ab.id);
        continue;
      }
      await supabaseAdmin
        .from("abonnements_push")
        .update({ dernier_envoi: aujourdhui, dernier_creneau: creneau } as never)
        .eq("id", ab.id);
      dejaEnvoye.add(ab.cle);
      envoyes += 1;
    } catch (e) {
      console.error("rappels/envoi", e);
    }
  }

  return Response.json({ jour: aujourdhui, creneau, envoyes, appareils: abonnements.length });
}

export const Route = createFileRoute("/api/public/rappels")({
  server: {
    handlers: {
      POST: async ({ request }) => traiter(request),
      GET: async ({ request }) => traiter(request),
    },
  },
});
