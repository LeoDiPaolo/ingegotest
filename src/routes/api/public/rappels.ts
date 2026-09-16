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
    `— Tu sais réviser ? — Oui. — Le matin ? — Non, mais j'apprends vite, ${p}.`,
    `— Chef, on a un problème. — Grave ? — Non, il s'appelle « niveau 2 ».`,
    `— Pourquoi t'as pris un casque ? — Pour me protéger. — De quoi ? — Aucune idée, mais je suis couvert.`,
    `— Vous êtes ingénieur ? — Pas encore. — Vous avez pourtant un casque. — J'ai aussi une lampe, ça fait pas de moi un phare.`,
    `— On est où ? — Au travail. — Comment tu sais ? — Il y a du café. — Ça pourrait être une gare.`,
    `— Vous avez un plan ? — Oui. — Il est où ? — Dans l'application, ${p}.`,
    `— T'as vu le programme ? — Oui. — Il ressemble à quoi ? — À quelque chose qui ne voulait pas être révisé.`,
    `— Il faut rester calme. — Je suis calme. — Tu trembles. — C'est ma façon d'être calme avec conviction.`,
    `— Tu connais le code ? — Oui. — C'est quoi ? — Un code. Général des collectivités, ${p}.`,
    `— On a trois minutes avant la réunion ! — Et après ? — Après quoi ? — Les trois minutes.`,
    `— J'ai trouvé une trace. — Écrite ? — Non, de pas. — Ah. — Enfin, de chaussure. — Donc c'est une trace écrite ? — Non.`,
    `— Pourquoi tu chuchotes ? — Pour pas réveiller le jury. — Il dort ? — Pour l'instant, ${p}.`,
    `— Tu crois qu'il t'a tout dit ? — Impossible. — Pourquoi ? — Le sujet a l'air beaucoup trop clair pour être honnête.`,
    `— Où est la motivation ? — Elle est partie. — Depuis quand ? — Depuis qu'elle est partie.`,
    `— Vous avez déjà passé un oral ? — Oui. — Et ça s'est bien passé ? — Non, j'ai répondu aux questions.`,
    `— Il faut commencer discrètement. — Comment ? — Huit questions. — Et si c'est dur ? — Alors on sera moins discrets.`,
    `— J'ai une mauvaise nouvelle. — Laquelle ? — J'en ai deux. — Et la bonne ? — J'ai oublié la deuxième.`,
    `— T'as les clés du chantier ? — Non. — Elles sont où ? — Dans ma poche. — Donc tu les as. — Pour maintenir le suspense, ${p}.`,
    `— C'est quoi ton métier ? — Futur ingénieur territorial. — Dans quel service ? — Si je le dis, ça devient une fiche de poste.`,
    `— Pourquoi les autres candidats ont un plan ? — Parce que nous, on a oublié le nôtre. — Non : on a l'application.`,
    `— On doit réviser avant midi. — Pourquoi midi ? — Parce qu'après, c'est l'après-midi. — Et alors ? — On aura perdu une matinée.`,
    `— Tu penses que ça a un sens ? — Bien sûr. — Lequel ? — Je sais pas, mais il doit être quelque part, ${p}.`,
    `— Attention, derrière toi ! — Quoi ? — Rien. Je vérifiais si tu étais réveillé.`,
    `— C'est terminé. — Quoi ? — Tout. — La révision ? — Non. — Alors quoi ? — Mon café.`,
  ];
  const midi = [
    `— Tu manges quoi ? — Un sandwich. — Et après ? — Huit questions. — C'est le dessert ? — C'est le plat principal, ${p}.`,
    `— Chef, on a un créneau. — Long ? — Non, il fait cinq minutes et il est déjà là.`,
    `— Pourquoi t'as pris une fourchette ? — Pour manger. — Et tu vas manger quoi ? — Ça dépend des questions.`,
    `— Vous êtes en pause ? — Non. — Vous avez pourtant un plateau. — J'ai aussi un stylo, ça fait pas de moi un dossier.`,
    `— On est où ? — À la cantine. — Comment tu sais ? — Il y a des plateaux. — Ça pourrait être une commission.`,
    `— Vous avez un plan pour cet après-midi ? — Oui. — Il est où ? — Il commence maintenant, ${p}.`,
    `— T'as vu l'heure ? — Oui. — Elle ressemble à quoi ? — À une heure qui ne voulait pas être productive.`,
    `— Il faut digérer calmement. — Je suis calme. — Tu relis tes fiches en mangeant. — C'est ma façon de digérer avec conviction.`,
    `— Tu connais le seuil ? — Oui. — C'est quoi ? — Un seuil. — Lequel ? — Voilà, c'est exactement la question.`,
    `— On a douze minutes avant la reprise ! — Et après ? — Après quoi ? — Les douze minutes.`,
    `— J'ai trouvé une erreur. — Grave ? — Non, de raisonnement. — Ah. — Enfin, de lecture. — Donc c'est grave ? — Non.`,
    `— Pourquoi tu révises en silence ? — Pour pas qu'on m'entende. — Qui ? — Les collègues qui proposent un deuxième café.`,
    `— Tu crois que ce QCM est simple ? — Impossible. — Pourquoi ? — Il a l'air beaucoup trop gentil pour être honnête.`,
    `— Où est passée la matinée ? — Elle est partie. — Depuis combien de temps ? — Depuis qu'elle est partie.`,
    `— Vous avez déjà révisé à midi ? — Oui. — Et ça s'est bien passé ? — Non, j'ai appris des choses.`,
    `— Il faut réviser discrètement. — Comment ? — Sans bruit. — Et si le téléphone sonne ? — Alors on sera moins discrets.`,
    `— J'ai deux nouvelles. — Vas-y. — La première : c'est l'heure. — Et la deuxième ? — Je l'ai oubliée.`,
    `— T'as ton téléphone ? — Non. — Il est où ? — Dans ma main. — Donc tu l'as. — Techniquement, ${p}.`,
    `— C'est quoi ce document ? — Un marché public. — De quel type ? — Si je te le dis, tu ne manges plus.`,
    `— Pourquoi les sujets ont toujours un piège ? — Parce que les candidats ont généralement oublié le leur.`,
    `— On doit finir avant 14 h. — Pourquoi 14 h ? — Parce qu'après, c'est 14 h 01. — Et alors ? — On aura perdu une minute.`,
    `— Tu crois que ce chapitre a un sens ? — Bien sûr. — Lequel ? — On le saura à la question 8, ${p}.`,
    `— Attention, une réunion ! — Où ? — Nulle part. Je testais tes réflexes.`,
    `— C'est fini. — Quoi ? — Tout. — La pause ? — Non. — Alors quoi ? — Mon sandwich.`,
  ];
  const soir = [
    `— Tu rentres ? — Oui. — Tout de suite ? — Non, dans huit questions, ${p}.`,
    `— Chef, on a un dossier en retard. — Lequel ? — Celui qu'on n'a pas encore ouvert.`,
    `— Pourquoi t'as pris une lampe ? — Pour éclairer. — Éclairer quoi ? — Ça dépend de ce que je trouve.`,
    `— Vous êtes chef de projet ? — Non. — Vous avez pourtant un planning. — J'ai aussi un agenda, ça fait pas de moi un calendrier.`,
    `— On est où ? — À la fin de la journée. — Comment tu sais ? — Il fait sombre. — Ça pourrait être un sous-sol.`,
    `— Vous avez un plan pour demain ? — Oui. — Il est où ? — Il dépend de ce soir.`,
    `— T'as vu le niveau suivant ? — Oui. — Il ressemble à quoi ? — À quelqu'un qui ne voulait pas être déverrouillé.`,
    `— Il faut rester serein. — Je suis serein. — Tu relis trois fois la même ligne. — C'est ma façon d'être serein avec méthode.`,
    `— Tu connais la procédure ? — Oui. — Laquelle ? — Une procédure. — Formalisée ? — Voilà le sujet du jour, ${p}.`,
    `— On a huit questions avant la nuit ! — Et après ? — Après quoi ? — Les huit questions.`,
    `— J'ai trouvé une faille. — Juridique ? — Non, dans mes révisions. — Ah. — Enfin, dans ma mémoire. — Donc juridique ? — Non.`,
    `— Pourquoi tu révises à voix basse ? — Pour pas qu'on m'entende. — Qui ? — Les gens qui veulent regarder une série.`,
    `— Tu crois que cette réponse est bonne ? — Impossible. — Pourquoi ? — Elle a l'air beaucoup trop évidente pour être honnête.`,
    `— Où est ta motivation ? — Partie. — Depuis combien de temps ? — Depuis qu'elle est partie. — Elle revient à la question 3.`,
    `— Vous avez déjà terminé une mission le soir ? — Oui. — Et ça s'est bien passé ? — Non, j'ai progressé.`,
    `— Il faut finir discrètement. — Comment ? — Sans bruit. — Et si je crie en validant ? — Alors on sera moins discrets.`,
    `— J'ai une bonne nouvelle. — Laquelle ? — J'en ai deux. — Et la mauvaise ? — J'ai oublié la deuxième.`,
    `— Tu as fini ta journée ? — Non. — Tu as éteint l'ordinateur. — Techniquement oui. — Alors ? — Il reste le téléphone, ${p}.`,
    `— C'est quoi ton objectif ? — Secret. — Ah bon ? — Oui. — Lequel ? — Si je te le dis, il devient moins motivant.`,
    `— Pourquoi le jury a toujours une question de plus ? — Parce que les candidats ont généralement une réponse de moins.`,
    `— On doit valider avant minuit. — Pourquoi minuit ? — Parce qu'après, c'est demain. — Et alors ? — On aura perdu une journée.`,
    `— Tu penses que tout ça sert ? — Bien sûr. — À quoi ? — Je sais pas, mais ça servira quelque part.`,
    `— Attention, derrière toi ! — Quoi ? — Rien. Je vérifiais si tu fonctionnais encore à cette heure-ci.`,
    `— C'est terminé. — Quoi ? — Tout. — La journée ? — Non. — Alors quoi ? — Les excuses.`,
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
      `Plus que ${objectif.restantes} question${s} pour valider le niveau ${objectif.niveau} de ${objectif.axe}. Le jury cache déjà les clés.`,
      `${objectif.validees} questions validées. Prochaine cible : ${objectif.axe}, niveau ${objectif.niveau}. Éric a dessiné le plan au dos d'un ticket.`,
      `Le niveau ${objectif.niveau} de ${objectif.axe} est à ${objectif.restantes} question${s} du dénouement. Alain Chabat réclame un ralenti.`,
      `${objectif.restantes} question${s} ${verbe} avant de boucler ${objectif.axe}, niveau ${objectif.niveau}. Le castor a déjà sorti la clé de 12.`,
      `Objectif rapproché : ${objectif.axe}, niveau ${objectif.niveau}. Encore ${objectif.restantes}, sauf si Ramzy recompte.`,
      `${objectif.validees}/${objectif.total} validées. ${objectif.axe} est le prochain niveau à faire tomber, sans permis de démolir.`,
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
          `${n} jours d'affilée : ce serait dommage de casser la série maintenant. Le castor a déjà imprimé les tee-shirts.`,
          `Ta série de ${n} jours tient encore à une mission. Alain Chabat tient la caméra.`,
          `${n} jours au compteur. Éric garde le rythme, Ramzy cherche le compteur.`,
          `${n} jours de suite. À ce stade, c'est une jurisprudence et le greffe est perplexe.`,
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
          `${inactivite} jours sans révision : tes cartes prennent la poussière et facturent le ménage.`,
          `Le concours avance, toi non depuis ${inactivite} jours. Éric propose de mettre les warnings.`,
          `On repart doucement ? Huit questions, zéro kiné, un castor en soutien psychologique.`,
          `${inactivite} jours de pause. Le cerveau a fini sa maintenance, mais la pièce restante inquiète Ramzy.`,
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
          `${dues} question${dues > 1 ? "s non validées attendent" : " non validée attend"}. Pas de panique : Éric a un plan, donc aucune garantie.`,
          `${dues} point${dues > 1 ? "s" : ""} à reprendre. Le béton sèche, la mémoire aussi, Ramzy tient le sèche-cheveux.`,
          `Il reste du travail, mais aucun PowerPoint de 86 diapositives n'est prévu.`,
          `Mission courte, effet durable. Comme une bonne clause, mais sans juriste caché dans le placard.`,
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
          "Une mission de huit questions pour bien démarrer. Alain Chabat fournit le faux départ.",
          "Rien d'urgent, mais une mission ne fait jamais de mal. Sauf au jury, émotionnellement.",
          "Objectif du jour : une mission, pas plus. Éric a déjà déposé un amendement.",
          progression,
          "Huit questions. Moins long qu'un ordre du jour, plus utile qu'un tour de table.",
          "Une petite mission avant que les acronymes ne se reproduisent.",
          "Le concours ne se révise pas tout seul. On a vérifié deux fois.",
          "Quelques questions, zéro réunion, résultat immédiat. Concept refusé par trois directions pilotes.",
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
