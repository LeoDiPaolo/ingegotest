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
        "Tout est validé. Le jury va devoir inventer de nouvelles questions.",
        "100 % du corpus. À ce stade, ce serait à toi de corriger les copies.",
        "Plus une seule question en jeu. Silence radio du côté du concours.",
        "Corpus terminé. Tu peux désormais ennuyer tes collègues avec de vraies certitudes.",
        "Tout validé, aucune réserve. Réception prononcée sans procès-verbal.",
        "Fin du corpus. La suite s'appelle le concours, et il n'a rien vu venir.",
      ],
      graine,
    );
  }
  const s = objectif.restantes > 1 ? "s" : "";
  const verbe = objectif.restantes > 1 ? "restent" : "reste";
  return piocher(
    [
      `Encore ${objectif.restantes} question${s} et le niveau ${objectif.niveau} de ${objectif.axe} tombe. Il ne le sait pas encore.`,
      `${objectif.validees}/${objectif.total} validées. Le compteur préfère nettement quand il monte.`,
      `${objectif.restantes} question${s} ${verbe} sur ${objectif.axe}, niveau ${objectif.niveau}. Ce n'est pas énorme, c'est juste là.`,
      `Le niveau ${objectif.niveau} de ${objectif.axe} tient encore debout à ${objectif.restantes} question${s} près.`,
      `Objectif du jour : ${objectif.axe}, niveau ${objectif.niveau}. Distance restante : ${objectif.restantes} question${s}.`,
      `${objectif.validees} validées, et ${objectif.restantes} qui font semblant d'être difficiles sur ${objectif.axe}.`,
      `${objectif.restantes} question${s} avant de fermer le niveau ${objectif.niveau} de ${objectif.axe}. Ensuite on ouvre le suivant, évidemment.`,
      `Plus que ${objectif.restantes} sur ${objectif.axe}. À ce rythme, le jury va s'inquiéter.`,
      `Le niveau ${objectif.niveau} de ${objectif.axe} résiste depuis ${objectif.restantes} question${s}. C'est presque de l'insolence.`,
      `${objectif.validees}/${objectif.total}. Statistiquement, cela s'appelle avancer.`,
      `${objectif.restantes} question${s} entre toi et le niveau suivant de ${objectif.axe}. Aucun recours possible.`,
      `${objectif.axe}, niveau ${objectif.niveau} : ${objectif.restantes} question${s} et le dossier est clos.`,
      `Il ${verbe} ${objectif.restantes} question${s}. Les faire prend moins de temps que d'y penser.`,
      `${objectif.validees} questions validées, zéro réunion nécessaire. Continuons ainsi.`,
      `${objectif.axe} est à ${objectif.restantes} question${s} de la fin du niveau ${objectif.niveau}. Fenêtre de tir ouverte.`,
      `Encore ${objectif.restantes} et ${objectif.axe} passe au niveau ${objectif.niveau + 1}. En théorie.`,
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
          `Déjà ${missionsAujourdhui} mission${pluriel} aujourd'hui. Personne ne t'en demandait autant, et c'est bien le problème.`,
          `Mission ${missionsAujourdhui + 1} disponible. Le corpus commence à se sentir harcelé.`,
          `${missionsAujourdhui} mission${pluriel} au compteur : tu es officiellement en excès de zèle.`,
          `Tu as déjà révisé aujourd'hui. Excellente raison de recommencer.`,
          `Le concours n'impose aucun quota journalier. Regrettable, pour lui.`,
          `${missionsAujourdhui} mission${pluriel} faite${pluriel}. La suivante est plus courte : elle ment.`,
          `Repos mérité, ou huit questions. Les deux se ressemblent beaucoup.`,
          `Après ${missionsAujourdhui} mission${pluriel}, ton cerveau réclame une prime. Propose-lui une mission.`,
          `Tu es en avance. C'est exactement le moment où les autres candidats s'arrêtent.`,
          `Mission ${missionsAujourdhui + 1} : la version où tu es déjà échauffé.`,
          `Tu pourrais t'arrêter là. Tu pourrais aussi ne pas t'arrêter là.`,
          `${missionsAujourdhui} mission${pluriel} aujourd'hui : ce sera difficile à raconter modestement.`,
          `Le niveau suivant a remarqué ton activité. Il ferme les volets.`,
          `Une mission de plus et la journée devient statistiquement anormale.`,
          `Tu as déjà donné. Le corpus, lui, n'a rien donné du tout.`,
          `${missionsAujourdhui} mission${pluriel}. On note, on félicite, on recommence.`,
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
          `${n} jours d'affilée. Ce n'est plus une habitude, c'est une jurisprudence.`,
          `La série est à ${n} jours. Fragile, susceptible, et elle te regarde.`,
          `${n} jours consécutifs : huit questions de plus et personne n'en saura rien.`,
          `Casser une série de ${n} jours un soir de flemme serait un gâchis administratif.`,
          `${n} jours sans interruption. Même les services publics ne font pas ça.`,
          `Ta régularité commence à ressembler à une stratégie. Entretenons le malentendu.`,
          progression,
          `${n} jours de suite. Le jury l'ignore, mais il devrait s'inquiéter.`,
          `Série de ${n} jours : aucune raison valable de la transformer en souvenir.`,
          `${n} jours, soit huit questions ${n} fois. Dit comme ça, c'est presque raisonnable.`,
          `La série tient. Elle tiendra encore exactement une mission de plus.`,
          `${n} jours d'affilée : à ce stade, arrêter demanderait un vrai effort.`,
          `Rien ne prouve que la série porte chance. Rien ne prouve le contraire non plus.`,
          `${n} jours, et pas un seul justificatif d'absence. Exemplaire.`,
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
          `${inactivite} jours sans mission. Les questions, elles, n'ont pas bougé d'un centimètre.`,
          `Absence remarquée : ${inactivite} jours. Aucun justificatif ne sera exigé.`,
          `Après ${inactivite} jours, on reprend petit : huit questions, c'est presque rien.`,
          `${inactivite} jours de pause. La maintenance du cerveau est officiellement terminée.`,
          `Le concours a continué d'avancer pendant ces ${inactivite} jours. Sans prévenir.`,
          `Reprise en douceur, sans réunion de lancement ni note de cadrage.`,
          progression,
          `${inactivite} jours plus tard, le niveau est exactement là où tu l'as laissé.`,
          `Tes fiches ont pris ${inactivite} jours de poussière. Un clic suffit à tout dépoussiérer.`,
          `${inactivite} jours d'absence : le dossier est resté ouvert, poliment.`,
          `On ne repart pas de zéro. On repart de maintenant.`,
          `Après ${inactivite} jours, la première question sera la plus dure. Les sept autres beaucoup moins.`,
          `Pause terminée. Officieusement, mais fermement.`,
          `${inactivite} jours sans réviser, c'est ${inactivite} jours offerts aux autres candidats.`,
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
          `${dues} question${dues > 1 ? "s" : ""} attendent leur validation. Très patientes, mais pas éternelles.`,
          `${dues} point${dues > 1 ? "s" : ""} en suspens. En suspens de toi, précisément.`,
          `Ces ${dues} question${dues > 1 ? "s" : ""} t'ont déjà croisé. Ça s'était mal passé.`,
          `${dues} question${dues > 1 ? "s" : ""} non validée${dues > 1 ? "s" : ""} : aucune ne se réglera par télépathie.`,
          `Le raccourci existe : répondre juste du premier coup. Il n'y en a pas d'autre.`,
          `${dues} reprise${dues > 1 ? "s" : ""} au programme. Court, indolore, légèrement vexant.`,
          `Il reste ${dues} question${dues > 1 ? "s" : ""} à faire tomber. Elles comptent sur ta procrastination.`,
          `${dues} question${dues > 1 ? "s" : ""} en jeu : moins long qu'une réunion, plus utile qu'un compte rendu.`,
          `Ces questions ne sont pas difficiles. Elles sont juste toujours là.`,
          `${dues} question${dues > 1 ? "s" : ""} à valider du premier coup. Le suspense est intégral.`,
          `Tu ne les feras pas plus tard. Historiquement, plus tard n'existe pas.`,
          `${dues} question${dues > 1 ? "s" : ""} te résistent. C'est un peu insolent, pour des questions.`,
          `Huit questions maintenant et le stock de reprises baisse à vue d'œil.`,
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
          "Rien d'urgent ce matin. Juste huit questions et une conscience tranquille.",
          "Aucune carte en retard : le moment idéal pour prendre de l'avance.",
          "Cinq minutes suffisent. Tu en passeras dix à hésiter, autant commencer.",
          progression,
          "Le concours ne se révise pas tout seul. On a vérifié deux fois.",
          "Une mission avant le café, c'est ambitieux. Après le café, c'est raisonnable.",
          "Huit questions : le seul engagement de la journée que tu maîtrises entièrement.",
          "Commencer par le début reste la méthode la plus sous-estimée.",
          "Personne ne t'a encore écrit de mail. Profite de cette fenêtre historique.",
          "Objectif du jour : une mission. Pas deux. Enfin, si, mais une suffit.",
          "Le jury n'est pas prêt non plus. Sauf que lui n'a pas d'application.",
          "Huit questions maintenant, et la journée pourra faire ce qu'elle veut.",
          "Tu n'es pas prêt ? Parfait, c'est précisément l'objet de l'exercice.",
          "Aucune réunion, aucun tour de table, un résultat immédiat.",
          "Petite mission avant que les acronymes ne se multiplient dans la journée.",
          "Progresser demande un clic. C'est le seul prérequis réglementaire.",
          "Le niveau suivant est plus proche que le prochain jour férié.",
          "Une mission courte : tu auras fini avant d'avoir trouvé une excuse.",
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
