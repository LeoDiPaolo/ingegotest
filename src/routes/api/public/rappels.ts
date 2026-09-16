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
    `${p}, réveil du cerveau dans 3… 2… Alain Chabat a oublié le 1.`,
    `Bonjour ${p}. Le jury fait déjà semblant d'être prêt, quelle conscience professionnelle.`,
    `${p}, petite mission avant le grand monde et ses tableaux Excel.`,
    `Le jour se lève. Le niveau aussi, ${p}. Éric et Ramzy beaucoup moins.`,
    `Matin calme, neurones affûtés, ${p}. Aucun PowerPoint n'a été blessé.`,
    `${p}, même le castor a ouvert un œil.`,
    `Réveil technique, ${p}. Sans réunion préalable.`,
    `Éric, Ramzy et ${p} entrent dans une mission…`,
    `${p}, Alain Chabat ne fera pas la voix off tout seul.`,
    `Bonjour ${p}. Autorisation de réviser accordée.`,
    `${p}, le café a lu le règlement. Il demande un deuxième café.`,
    `Aube, béton, questions : le nouveau film d'Alain Chabat, avec ${p}.`,
    `${p}, le jury dort encore. C'est légalement le meilleur moment.`,
    `Le castor a pointé à 8 h 29, ${p}. Quelle lèche.`,
    `${p}, une mission au réveil : même Éric et Ramzy trouvent ça conceptuel.`,
    `Le cerveau de ${p} démarre. Windows demande une mise à jour de 47 minutes.`,
    `${p}, aujourd'hui on bâtit du savoir. Le permis est tacite.`,
    `Bonjour ${p}. Le café est maître d'ouvrage, tu es maître d'œuvre.`,
    `${p}, huit questions avant que quelqu'un dise « synergie ».`,
    `Le soleil se lève sur IngéGo. Budget prévisionnel : zéro euro, trois neurones.`,
    `${p}, Alain Chabat appelle ça « Astérix et la mission matinale ».`,
    `Éric a la question, Ramzy a les réponses, ${p} a intérêt à vérifier.`,
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
    `${p}, formule du midi : entrée, plat, huit questions, déni.`,
    `Le sandwich de ${p} exige une étude d'impact avant la première bouchée.`,
    `Midi pile. Éric révise, Ramzy tient la fourchette.`,
    `${p}, le jury déjeune. Attaque surprise autorisée par Alain Chabat.`,
    `Une mission avec le café, ${p}. Le digestif reste hors programme.`,
    `${p}, pause méridienne : expression administrative pour dire « mange vite ».`,
    `Le castor a réservé une table pour huit questions et ${p}.`,
    `${p}, ton cerveau demande la carte. Il n'y a que des QCM.`,
    `Alain Chabat présente : « La Cité de la peur de rater une question ».`,
    `${p}, aujourd'hui la cantine sert du niveau supérieur sauce concours.`,
    `Éric et Ramzy ont partagé l'addition. Il te reste la mission, ${p}.`,
    `${p}, cinq minutes de révision : moins indigeste qu'un compte rendu.`,
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
    `${p}, le soleil se couche, le Code général reste beaucoup trop éveillé.`,
    `Prime time : ${p} contre huit questions. Alain Chabat commente.`,
    `${p}, une dernière mission avant la réunion plénière avec l'oreiller.`,
    `Éric ferme le bureau, Ramzy ouvre IngéGo. Logique impeccable.`,
    `${p}, le cerveau réclame la fermeture administrative. Recours rejeté.`,
    `Le castor a mis son pyjama de chantier. Il attend juste ${p}.`,
    `${p}, soirée questions-réponses. Le buffet est une métaphore.`,
    `Alain Chabat présente « Mission Cléopâtre », mais avec plus de marchés publics.`,
    `${p}, huit questions avant Netflix. Ceci est une mesure compensatoire.`,
    `Le jury pense que tu regardes une série. Techniquement, oui : ta série.`,
    `${p}, les neurones ferment à 19 h. Le préavis n'a pas été respecté.`,
    `Éric, Ramzy, un castor et ${p} : personne ne sait qui a le dossier.`,
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
        "Tout est validé. Éric et Ramzy demandent un recours gracieux.",
        "Corpus plié : le castor rachète le centre de gestion.",
        "100 % validé. Le jury cherche discrètement une question bonus sur Google.",
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
      `${objectif.restantes} question${s} avant le niveau ${objectif.niveau} de ${objectif.axe}. Le castor a déjà commandé les petits fours.`,
      `${objectif.validees} validées : Alain Chabat veut les droits de l'adaptation au cinéma.`,
      `Encore ${objectif.restantes} pour ${objectif.axe}, niveau ${objectif.niveau}. Éric compte, Ramzy recompte, fais-le toi-même.`,
      `${objectif.validees}/${objectif.total} : le jury vient de renverser son café sur le barème.`,
      `Le niveau ${objectif.niveau} de ${objectif.axe} tient à ${objectif.restantes} question${s}. Suspense budgétairement maîtrisé.`,
      `${objectif.restantes} question${s} ${verbe}. Le castor refuse de livrer ${objectif.axe} avec des réserves.`,
      `Prochaine victime consentante : ${objectif.axe}, niveau ${objectif.niveau}. Alain Chabat prépare le générique.`,
      `${objectif.validees} questions au compteur. Éric et Ramzy contestent le chronométrage.`,
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
  const missionsAujourdhui = (ligne?.journal ?? []).filter(
    (e) => e && e.id === "__session" && e.jour === aujourdhui,
  ).length;

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

  if (missionsAujourdhui > 0) {
    const pluriel = missionsAujourdhui > 1 ? "s" : "";
    return {
      titre,
      corps: piocher(
        [
          `${missionsAujourdhui} mission${pluriel} aujourd'hui. Le jury demande une pause syndicale.`,
          `Déjà ${missionsAujourdhui} mission${pluriel}. Éric et Ramzy soupçonnent un montage accéléré.`,
          `${missionsAujourdhui} mission${pluriel} au compteur : le castor veut désormais être payé en heures sup.`,
          `Tu as déjà joué ${missionsAujourdhui} fois aujourd'hui. Alain Chabat prépare la suite, évidemment.`,
          `Encore une mission ? Après ${missionsAujourdhui}, ça devient une franchise cinématographique.`,
          `${missionsAujourdhui} mission${pluriel} terminée${missionsAujourdhui > 1 ? "s" : ""}. Le bouton « raisonnable » reste introuvable.`,
          `Le jury avait prévu ${missionsAujourdhui} mission${pluriel}. Mauvaise nouvelle pour lui : l'application fonctionne encore.`,
          `Déjà ${missionsAujourdhui} passage${pluriel}. Éric tient le registre, Ramzy a perdu le registre.`,
          `Mission numéro ${missionsAujourdhui + 1} ? Le castor appelle ça une réunion de chantier imprévue.`,
          `${missionsAujourdhui} mission${pluriel} aujourd'hui : même le café commence à croire en toi.`,
          `Tu as déjà fait ${missionsAujourdhui} mission${pluriel}. Alain Chabat exige maintenant une scène post-générique.`,
          `${missionsAujourdhui} mission${pluriel} bouclée${missionsAujourdhui > 1 ? "s" : ""}. La prochaine est un avenant, pas une obsession.`,
          `Éric dit stop après ${missionsAujourdhui}. Ramzy dit encore une. Le castor s'abstient.`,
          `Après ${missionsAujourdhui} mission${pluriel}, le cerveau de ${prenom?.trim() || "chef"} demande un marché négocié.`,
          `${missionsAujourdhui} mission${pluriel} dans la journée : le jury révise désormais de son côté.`,
          `Tu reviens après ${missionsAujourdhui} mission${pluriel} ? C'est beau, inquiétant, mais surtout beau.`,
        ],
        graine + 43,
      ),
      tag: "ingego-encore",
    };
  }

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
          `${n} jours de suite : Alain Chabat négocie déjà la saison 2.`,
          `Série de ${n} jours. Le jury appelle ça de l'acharnement réglementaire.`,
          `${n} jours au compteur : Éric compte les jours, Ramzy compte sur toi.`,
          `${n} jours d'affilée. Le castor a fait graver la plaque beaucoup trop tôt.`,
          `Jour ${n} : aucune réunion de crise, juste huit questions. Quel luxe.`,
          `${n} jours de série. Netflix souhaite récupérer le concept.`,
          `${n} jours sans rupture de service public. Le préfet ne dira rien, mais il pense très fort.`,
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
          `${inactivite} jours d'absence : Éric avait la clé, Ramzy avait oublié la porte.`,
          `Après ${inactivite} jours, Alain Chabat annonce sobrement « il est reviendu ».`,
          `${inactivite} jours sans mission. Le castor a déclaré le chantier en sommeil.`,
          `Pause de ${inactivite} jours : même les acronymes ont eu le temps de se reproduire.`,
          `${inactivite} jours plus tard, le jury avait baissé sa garde et monté son chauffage.`,
          `Le cerveau sort de ${inactivite} jours de congé. Les RTT n'étaient pas validées.`,
          `${inactivite} jours de silence : Éric et Ramzy ont rempli le procès-verbal au hasard.`,
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
          `${dues} question${dues > 1 ? "s" : ""} à reprendre. Éric a les fiches, Ramzy a fait un avion avec.`,
          `${dues} petit${dues > 1 ? "s" : ""} caillou${dues > 1 ? "x" : ""} dans la chaussure du castor. Oui, il porte des chaussures.`,
          `Encore ${dues} question${dues > 1 ? "s" : ""}. Alain Chabat appelle ça un rappel, pas une suite opportuniste.`,
          `${dues} point${dues > 1 ? "s" : ""} résiste${dues > 1 ? "nt" : ""}. Le jury nie toute implication.`,
          `Il reste ${dues} question${dues > 1 ? "s" : ""} non validée${dues > 1 ? "s" : ""}. Le PowerPoint de crise a été annulé.`,
          `${dues} reprise${dues > 1 ? "s" : ""} au programme : Éric relit, Ramzy improvise, toi tu réponds.`,
          `${dues} question${dues > 1 ? "s" : ""} demande${dues > 1 ? "nt" : ""} une seconde chance. C'est très français administrativement.`,
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
          "Huit questions avant le premier mail « pour information ». Profite.",
          "Une mission matinale : Alain Chabat garantit zéro poursuite de chars.",
          "Le castor a sorti le casque. Éric et Ramzy cherchent encore le chantier.",
          "Objectif : huit réponses et aucune note de cadrage de 94 pages.",
          "Le jury n'est pas prêt. C'est précisément notre stratégie.",
          "Une mission au calme, avant l'ouverture officielle du grand cirque administratif.",
          "Huit questions : assez pour progresser, pas assez pour créer une commission.",
          "Le cerveau est ouvert au public. Fermeture exceptionnelle après la mission.",
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
