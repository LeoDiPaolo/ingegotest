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
    `${p}, le réveil a sonné trois fois : deux fois pour lui, une fois pour toi.`,
    `Le café chauffe, le concours aussi. Un seul des deux t'attend vraiment, ${p}.`,
    `Bonjour ${p}. Ce matin, le bâtiment tient debout surtout grâce à ta révision.`,
    `Huit questions avant la première réunion : le seul moment où personne ne parle.`,
    `${p}, ton cerveau est déjà à son poste. Il aimerait savoir pourquoi.`,
    `Debout : les acronymes se sont reproduits pendant la nuit.`,
    `${p}, le jury dort encore. Avantage stratégique à saisir.`,
    `Ce matin, le seul obstacle entre toi et la réussite est un bouton vert.`,
    `${p}, huit questions : moins long qu'un ordre du jour, nettement plus utile.`,
    `Le Code général des collectivités t'a laissé un message vocal. Il est long.`,
    `${p}, les textes réglementaires ne se relisent pas seuls. On a testé, c'était calme.`,
    `Objectif du matin : comprendre un sigle avant le deuxième café.`,
    `${p}, on démarre par le début, comme les gens organisés.`,
    `Une mission avant 9 h et tu auras le droit d'être insupportable toute la journée.`,
    `${p}, le chantier du jour commence dans ta tête. Casque facultatif.`,
    `Bonne nouvelle : huit questions. Mauvaise nouvelle : elles arrivent dans l'ordre inverse de tes envies.`,
    `${p}, le concours externe n'a pas prévu de pause déjeuner. Prends de l'avance.`,
    `Réveil technique, ${p}. Aucune réunion préalable n'a été nécessaire.`,
    `Ta série ne se réveillera pas toute seule. Elle attend un clic, poliment.`,
    `${p}, tu vas apprendre des choses que personne ne te demandera en soirée.`,
    `Le premier candidat levé gagne. Le classement n'est pas officiel, mais il existe.`,
    `${p}, révise maintenant : plus tard, tu auras des arguments très convaincants.`,
    `Un matin, une mission, zéro justificatif à produire.`,
    `${p}, les questions sont prêtes depuis 6 h. Elles n'ont pas dormi non plus.`,
  ];
  const midi = [
    `${p}, entrée, plat, huit questions. Le dessert dépend de tes réponses.`,
    `Pause déjeuner : le seul créneau où le téléphone sert à quelque chose d'utile.`,
    `${p}, un QCM se digère mieux qu'une réunion de service.`,
    `Midi pile. Le jury déjeune, ses questions travaillent encore.`,
    `${p}, huit questions et tu peux retourner regarder le plafond en paix.`,
    `La cantine n'a pas de plat du jour réglementaire. L'application, si.`,
    `${p}, réviser en mangeant est autorisé. Les marchés publics, eux, restent formalisés.`,
    `Fenêtre de tir entre le sandwich et la reprise. Elle se referme à 14 h.`,
    `${p}, le café offre trente minutes d'illusion de lucidité. Utilise-les.`,
    `Rien de prévu ce midi ? Parfait, tout est déjà prêt.`,
    `${p}, une mission maintenant évite une culpabilité ce soir. Rentabilité immédiate.`,
    `Midi, l'heure idéale : personne ne viendra te demander ce que tu fais.`,
    `${p}, huit questions, zéro plateau obligatoire, zéro tour de table.`,
    `Ton cerveau digère. Réveille-le avec un seuil de marché public.`,
    `${p}, ce créneau est court. Comme les délais, comme les budgets.`,
    `Les collègues parlent du week-end, toi tu prépares un concours. Le contraste est saisissant.`,
    `${p}, on peut réussir un concours entre deux bouchées. C'est presque documenté.`,
    `Midi : le moment exact où les acronymes baissent leur garde.`,
    `${p}, huit questions maintenant et l'après-midi paraîtra presque justifiée.`,
    `Ceci n'est pas une convocation. C'est facultatif, et pourtant ça sert.`,
    `${p}, le plateau est vide. Le niveau, pas encore.`,
    `Une mission au déjeuner : la seule réunion dont tu maîtrises l'ordre du jour.`,
    `${p}, cinq minutes suffisent. Le reste, c'est une négociation avec toi-même.`,
    `Midi. Rien d'urgent, sauf le niveau suivant qui s'impatiente.`,
  ];
  const soir = [
    `${p}, la journée est finie. La mémoire, elle, fait des heures supplémentaires.`,
    `Dernier tour de chantier : huit questions, puis on éteint.`,
    `${p}, le canapé attend. Il attendra huit questions de plus.`,
    `L'ordinateur est éteint, le téléphone fait de la résistance.`,
    `${p}, la série du soir peut attendre. Pas celle de tes jours consécutifs.`,
    `Le jury croit que tu as arrêté. Laissons-le croire, ${p}.`,
    `${p}, huit questions avant la réunion plénière avec l'oreiller.`,
    `On clôture proprement, sans réserve ni procès-verbal.`,
    `${p}, réviser le soir : le seul dossier qui ne demande aucune validation hiérarchique.`,
    `Une mission maintenant, et demain matin tu seras insupportable de sérénité.`,
    `${p}, le niveau suivant ne se déverrouille pas pendant le sommeil. On a vérifié.`,
    `Il reste de la lumière, donc il reste des questions.`,
    `${p}, ta journée mérite une fin utile plutôt qu'un défilement infini.`,
    `Le concours n'a pas d'horaires. Il est très mal élevé, ${p}.`,
    `${p}, huit questions, puis silence total. Promis.`,
    `Ce soir, le seul chantier encore ouvert tient dans ta poche.`,
    `${p}, n'attends pas demain : demain a déjà son propre programme.`,
    `Fin de journée, début des réponses brillantes.`,
    `${p}, une mission courte contre une conscience tranquille. Le marché est honnête.`,
    `Les acronymes ne dorment jamais. C'est leur seul talent.`,
    `${p}, valider avant minuit compte pour aujourd'hui. Après, c'est demain.`,
    `Dernière ligne droite du jour. Elle fait huit questions de long.`,
    `${p}, programme du soir : réviser, puis prétendre que c'était facile.`,
    `Le patrimoine communal te remercie d'avance, ${p}.`,
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
        "— C'est terminé. — Quoi ? — Tout. — Le corpus ? — Oui. — Ah. Là c'est embêtant.",
        "— Il reste des questions ? — Non. — T'es sûr ? — Absolument pas. — Alors ? — Si, je suis sûr.",
        "— Vous avez tout validé ? — Oui. — Vraiment tout ? — Oui. — Alors on fait quoi ? — On recommence à s'inquiéter.",
        "— Le jury a une question. — Laquelle ? — Il cherche encore.",
        "— Tu veux une médaille ? — Non. — Pourquoi ? — Elle serait redondante avec 100 %.",
        "— Objectif atteint. — Et maintenant ? — Maintenant, c'est le concours qui a peur.",
      ],
      graine,
    );
  }
  const s = objectif.restantes > 1 ? "s" : "";
  const verbe = objectif.restantes > 1 ? "restent" : "reste";
  return piocher(
    [
      `— Il reste combien ? — ${objectif.restantes}. — Pour quoi ? — Le niveau ${objectif.niveau} de ${objectif.axe}. — Ah oui, quand même.`,
      `— Tu as validé combien ? — ${objectif.validees}. — Et il en reste ? — ${objectif.restantes} pour ${objectif.axe}. — Donc presque rien. — Techniquement, oui.`,
      `— On y est presque. — À combien ? — ${objectif.restantes} question${s}. — C'est peu. — C'est exactement ce que je disais hier.`,
      `— C'est quoi le plan ? — ${objectif.axe}, niveau ${objectif.niveau}. — Et ensuite ? — Ensuite il y a un ensuite.`,
      `— ${objectif.restantes} question${s} ${verbe}. — Et si j'en fais une seule ? — Alors il en restera moins. — Logique implacable.`,
      `— ${objectif.validees}/${objectif.total}. — C'est bien ? — C'est mieux que ${objectif.validees - 1}.`,
      `— Le niveau ${objectif.niveau} de ${objectif.axe} tombe dans ${objectif.restantes} question${s}. — Et s'il ne tombe pas ? — Alors il reste debout, et c'est vexant.`,
      `— Tu comptes ? — Oui. — Combien ? — ${objectif.restantes}. — Recompte. — ${objectif.restantes}. — Bon.`,
      `— Objectif du jour ? — ${objectif.axe}, niveau ${objectif.niveau}. — Et objectif de la vie ? — Pareil, mais en plus long.`,
      `— Encore ${objectif.restantes} pour ${objectif.axe}. — Ça se fait en combien de temps ? — Ça dépend de toi. — Mauvaise réponse.`,
      `— ${objectif.validees} validées. — Et le reste ? — Le reste, c'est le suspense.`,
      `— Il reste ${objectif.restantes} question${s} au niveau ${objectif.niveau}. — On les fait maintenant ? — Ou jamais. — Choisis « maintenant ».`,
      `— Tu veux une bonne nouvelle ? — Oui. — ${objectif.restantes} question${s} et ${objectif.axe} est bouclé. — Et la mauvaise ? — Je l'ai oubliée.`,
      `— C'est quoi le prochain dossier ? — ${objectif.axe}. — Il est difficile ? — Il est surtout là.`,
      `— ${objectif.restantes} question${s} avant le niveau suivant. — Et après le niveau suivant ? — Le niveau d'après. — Formidable.`,
      `— ${objectif.validees}/${objectif.total} au compteur. — On arrondit ? — Non, on révise.`,
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
          `— Tu en as fait combien ? — ${missionsAujourdhui}. — Et tu reviens ? — Oui. — Pourquoi ? — Pour le principe.`,
          `— On s'arrête ? — Après ${missionsAujourdhui} mission${pluriel} ? — Oui. — Non.`,
          `— C'est raisonnable, ${missionsAujourdhui} mission${pluriel} ? — Non. — Donc on continue ? — Évidemment.`,
          `— Chef, il recommence. — Grave ? — Non, c'est la mission ${missionsAujourdhui + 1}.`,
          `— Tu es fatigué ? — Oui. — Tu veux arrêter ? — Non. — Tu es sûr ? — Absolument pas.`,
          `— ${missionsAujourdhui} mission${pluriel} aujourd'hui. — C'est beaucoup ? — Ça dépend de demain.`,
          `— Encore une ? — Oui. — Et après ? — Après quoi ? — L'encore une.`,
          `— Tu révises toujours ? — Oui. — Depuis quand ? — Depuis que j'ai commencé.`,
          `— Il a fait ${missionsAujourdhui} mission${pluriel}. — Et il veut quoi ? — Une de plus. — Et après ? — Le concours.`,
          `— Tu comptes t'arrêter un jour ? — Oui. — Quand ? — Quand j'aurai fini. — Fini quoi ? — Voilà.`,
          `— Pourquoi tu reviens ? — Pour vérifier. — Vérifier quoi ? — Que c'est toujours là. — C'est toujours là.`,
          `— C'est ta ${missionsAujourdhui + 1}ᵉ mission. — Et alors ? — Rien, je notais.`,
          `— Tu veux un conseil ? — Oui. — Fais-en une autre. — C'était pas un conseil, ça. — Non.`,
          `— Il paraît que tu es motivé. — Qui a dit ça ? — Le compteur : ${missionsAujourdhui}.`,
          `— Tu as déjà joué. — Oui. — Donc tu peux te reposer. — Techniquement. — Mais ? — Mais non.`,
          `— Encore une mission ? — Une petite. — Elles sont toutes petites. — C'est bien le problème.`,
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
          `— ${n} jours d'affilée. — C'est une habitude ? — Non, c'est une jurisprudence.`,
          `— Tu vas casser la série ? — Non. — T'es sûr ? — Absolument pas. — Alors fais la mission.`,
          `— Ça fait combien de jours ? — ${n}. — De suite ? — Oui. — Et demain ? — Demain aussi, apparemment.`,
          `— Il tient depuis ${n} jours. — Et il s'arrête quand ? — Personne ne sait, même pas lui.`,
          `— ${n} jours sans interruption. — C'est un record ? — C'est surtout ${n} jours.`,
          `— Pourquoi tu continues ? — Pour la série. — Et la série sert à quoi ? — À continuer.`,
          progression,
          `— La série est à ${n}. — Et si je saute un jour ? — Alors elle est à 1. — Bien joué, le suspense.`,
          `— Tu es régulier. — Depuis ${n} jours. — C'est de la discipline ? — C'est de la superstition.`,
          `— ${n} jours de suite, chapeau. — Merci. — Ça ne dispense pas d'aujourd'hui. — Ah.`,
          `— Il a fait ${n} jours. — Il veut un trophée ? — Il veut surtout le niveau suivant.`,
          `— On note la série quelque part ? — Oui. — Où ? — Ici. — Alors il faut la nourrir.`,
          `— ${n} jours. — C'est beaucoup. — C'est huit questions, ${n} fois. — Dit comme ça.`,
          `— Tu t'arrêtes ? — Jamais. — Jamais c'est long. — Alors disons demain soir.`,
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
          `— Il est où ? — Parti. — Depuis combien de temps ? — ${inactivite} jours. — Donc depuis qu'il est parti.`,
          `— Tu as révisé récemment ? — Oui. — Quand ? — Il y a ${inactivite} jours. — Récemment, donc.`,
          `— On reprend ? — Doucement. — C'est-à-dire ? — Huit questions. — Ce n'est pas doucement.`,
          `— ${inactivite} jours de pause. — C'était prévu ? — Non. — C'était utile ? — Non plus.`,
          `— Le cerveau est en maintenance. — Elle finit quand ? — Maintenant.`,
          `— Tu veux une excuse ? — Oui. — J'en ai deux. — Vas-y. — J'ai oublié les deux.`,
          progression,
          `— Il revient. — Après ${inactivite} jours ? — Oui. — Il a un justificatif ? — Non, il a mieux : de la motivation.`,
          `— Ça fait ${inactivite} jours. — Et alors ? — Et alors les questions, elles, sont restées.`,
          `— Tu te souviens du niveau ? — Oui. — Lequel ? — Un niveau. — Voilà pourquoi on reprend.`,
          `— Pause terminée ? — Oui. — Officiellement ? — Non, mais moralement.`,
          `— ${inactivite} jours sans mission. — Le chantier est arrêté ? — Non, il attend, poliment.`,
          `— On repart de zéro ? — Non. — De ${inactivite} jours en arrière ? — Non plus. — De maintenant, alors.`,
          `— Tu comptes revenir ? — Un jour. — Quel jour ? — Celui-là.`,
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
          `— Il reste des questions ? — ${dues}. — Elles sont difficiles ? — Elles sont surtout patientes.`,
          `— ${dues} question${dues > 1 ? "s" : ""} à reprendre. — Maintenant ? — Non, plus tard. — Plus tard quand ? — Maintenant.`,
          `— Tu as un plan ? — Oui. — Il est où ? — Dans l'application. — Donc tu as un plan. — Techniquement.`,
          `— Ces ${dues} question${dues > 1 ? "s" : ""} résistent. — Pourquoi ? — Parce que personne ne les a encore attaquées.`,
          `— Tu veux les faire ? — Non. — Tu vas les faire ? — Oui. — Parfait.`,
          `— C'est long ? — Non. — C'est dur ? — Non. — Alors pourquoi on attend ? — Excellente question.`,
          `— On les reprend une par une ? — Oui. — Et si j'en rate une ? — Elle revient. — Toujours ? — Toujours.`,
          `— ${dues} point${dues > 1 ? "s" : ""} en suspens. — En suspens de quoi ? — De toi.`,
          `— Tu crois qu'elles vont se valider seules ? — Non. — Tu as essayé ? — Longuement.`,
          `— Il y a un raccourci ? — Oui. — Lequel ? — Répondre juste.`,
          `— ${dues} question${dues > 1 ? "s" : ""} non validée${dues > 1 ? "s" : ""}. — C'est grave ? — Non, c'est réparable. — Quand ? — Devine.`,
          `— Tu préfères quoi : maintenant ou jamais ? — Jamais. — Mauvaise réponse, on recommence.`,
          `— Ces questions te connaissent. — Ah bon ? — Oui, vous vous êtes déjà croisés. Ça s'est mal passé.`,
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
          "— On commence ? — Par quoi ? — Huit questions. — Et après ? — Après, la journée.",
          "— C'est urgent ? — Non. — C'est utile ? — Oui. — Bon, alors c'est urgent.",
          "— Tu as le temps ? — Non. — Tu as cinq minutes ? — Oui. — C'est le même temps.",
          progression,
          "— Pourquoi maintenant ? — Parce que personne ne t'a encore écrit un mail.",
          "— Huit questions, ça sert à quoi ? — À en avoir huit de moins.",
          "— Le concours se révise tout seul ? — Non. — Tu as vérifié ? — Deux fois.",
          "— Tu veux une réunion ou une mission ? — Une mission. — Bonne réponse, la réunion n'existait pas.",
          "— Chef, on commence. — Par le début ? — Oui. — Original.",
          "— Tu as un objectif ? — Oui. — Lequel ? — Finir cette mission. — Ambitieux, mais atteignable.",
          "— On fait court ? — Oui. — Combien ? — Huit. — Parfait, j'en attendais douze.",
          "— Tu es prêt ? — Non. — Tu commences quand même ? — C'est le principe.",
          "— Le jury est prêt ? — Non. — Alors c'est le moment.",
          "— Une mission avant le café ? — Après le café. — Donc jamais. — Donc maintenant.",
          "— Tu veux progresser ? — Oui. — Il faut cliquer. — Ah, il y a une contrepartie.",
          "— C'est parti. — Où ? — Ici. — Ah, pratique.",
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
