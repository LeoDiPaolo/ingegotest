/**
 * Bandeau illustré affiché en haut d'une question.
 * Une illustration par grand sujet, choisie à partir de l'axe et du sous-thème.
 * Les images ne portent aucune donnée chiffrée : elles situent le contexte,
 * l'information pédagogique reste dans le texte de la question.
 */
import urbanisme from "@/assets/ill/urbanisme.jpg";
import accessibilite from "@/assets/ill/accessibilite.jpg";
import diagnostics from "@/assets/ill/diagnostics.jpg";
import chantier from "@/assets/ill/chantier.jpg";
import maitriseOuvrage from "@/assets/ill/maitrise-ouvrage.jpg";
import marches from "@/assets/ill/marches.jpg";
import execution from "@/assets/ill/execution.jpg";
import reception from "@/assets/ill/reception.jpg";
import achatResponsable from "@/assets/ill/achat-responsable.jpg";
import normes from "@/assets/ill/normes.jpg";
import thermique from "@/assets/ill/thermique.jpg";
import incendie from "@/assets/ill/incendie.jpg";
import pathologies from "@/assets/ill/pathologies.jpg";
import patrimoine from "@/assets/ill/patrimoine.jpg";
import energie from "@/assets/ill/energie.jpg";
import gtb from "@/assets/ill/gtb.jpg";
import coutGlobal from "@/assets/ill/cout-global.jpg";
import maintenance from "@/assets/ill/maintenance.jpg";
import basCarbone from "@/assets/ill/bas-carbone.jpg";
import reemploi from "@/assets/ill/reemploi.jpg";
import biosources from "@/assets/ill/biosources.jpg";
import numerique from "@/assets/ill/numerique.jpg";
import climat from "@/assets/ill/climat.jpg";
import foncier from "@/assets/ill/foncier.jpg";
import territoires from "@/assets/ill/territoires.jpg";
import actes from "@/assets/ill/actes.jpg";
import statut from "@/assets/ill/statut.jpg";
import finances from "@/assets/ill/finances.jpg";
import concours from "@/assets/ill/concours.jpg";
import servicePublic from "@/assets/ill/service-public.jpg";

interface Ill {
  src: string;
  alt: string;
}

const I = (src: string, alt: string): Ill => ({ src, alt });

const TABLE: Record<string, Ill[]> = {
  A1: [
    I(urbanisme, "Bureau d'instruction d'un permis de construire en mairie"),
    I(accessibilite, "Entrée accessible d'un bâtiment public avec rampe et bande de guidage"),
    I(diagnostics, "Sondages de sol et prélèvements avant travaux"),
    I(chantier, "Chantier sécurisé : échafaudage, filets, clôture et équipements de protection"),
    I(maitriseOuvrage, "Réunion entre maître d'ouvrage et maître d'œuvre autour des plans"),
  ],
  A2: [
    I(marches, "Dossiers de consultation et plis d'un marché public"),
    I(marches, "Dossiers de consultation et plis d'un marché public"),
    I(marches, "Analyse des offres d'un marché public"),
    I(execution, "Suivi d'exécution d'un chantier avec planning"),
    I(reception, "Visite de réception d'un bâtiment achevé"),
    I(achatResponsable, "Matériaux et filières d'achat responsable"),
  ],
  A3: [
    I(normes, "Détail constructif en coupe et plan technique coté"),
    I(normes, "Détail constructif en coupe et plan technique coté"),
    I(thermique, "Façade isolée avec image thermique et pont thermique de balcon"),
    I(accessibilite, "Cheminement accessible vers un établissement recevant du public"),
    I(incendie, "Dispositifs de sécurité incendie dans un ERP"),
    I(pathologies, "Pathologies du bâtiment : fissures, moisissures, condensation"),
  ],
  A4: [
    I(patrimoine, "Parc immobilier public : écoles, gymnase, mairie, centre technique"),
    I(energie, "Suivi des consommations d'énergie d'un bâtiment public"),
    I(gtb, "Armoire d'automatisme et supervision technique du bâtiment"),
    I(coutGlobal, "Cycle de vie et coût global d'un bâtiment"),
    I(maintenance, "Maintenance et contrôles techniques d'un bâtiment"),
    I(maintenance, "Contrôles réglementaires périodiques des installations"),
  ],
  A5: [
    I(basCarbone, "Construction bois bas carbone et comparaison d'impacts"),
    I(reemploi, "Déconstruction sélective et tri des matériaux réemployables"),
    I(biosources, "Échantillons de matériaux biosourcés et leurs ressources"),
    I(numerique, "Maquette numérique BIM et relevé scanner d'un bâtiment"),
    I(climat, "Adaptation d'un espace public à la chaleur et à la pluie"),
    I(foncier, "Densification urbaine et préservation des terres agricoles"),
  ],
  A6: [
    I(territoires, "Communes, intercommunalités, département et région"),
    I(actes, "Acte administratif local, affichage et contrôle de légalité"),
    I(statut, "Statut et carrière dans la fonction publique territoriale"),
    I(statut, "Cadre d'emplois et déroulement de carrière"),
    I(statut, "Droits, obligations et déontologie de l'agent public"),
    I(statut, "Dialogue social et organisation du temps de travail"),
    I(statut, "Comparaison des trois versants de la fonction publique"),
    I(finances, "Budget et finances d'une collectivité"),
    I(territoires, "Débats sur l'organisation territoriale"),
  ],
  A7: [
    I(concours, "Préparation du concours : écrit et oral devant jury"),
    I(territoires, "Institutions et décentralisation"),
    I(territoires, "Collectivités, EPCI et répartition des compétences"),
    I(servicePublic, "Accueil des usagers d'un service public"),
    I(statut, "Accès, droits et carrière dans la fonction publique"),
    I(actes, "Pouvoirs du maire et actes locaux"),
    I(finances, "Budget et finances locales"),
    I(marches, "Marchés publics et loi MOP"),
    I(urbanisme, "Urbanisme, ERP et IGH"),
    I(patrimoine, "Patrimoine bâti, transition et métiers du BTP"),
  ],
  A8: [
    I(concours, "Lecture et cadrage du sujet de la note"),
    I(concours, "Plan, titres et forme de la copie"),
    I(concours, "Exploitation du dossier et gestion du temps"),
    I(concours, "Partie propositions de la note"),
    I(concours, "Entretien avec le jury : déroulé et posture"),
    I(concours, "Culture territoriale attendue à l'oral"),
    I(concours, "Motivation et projet professionnel"),
  ],
  A9: [
    I(numerique, "Cadre juridique européen de l'intelligence artificielle"),
    I(numerique, "Gouvernance et stratégie de déploiement de l'IA"),
    I(numerique, "Cas d'usage et expérimentations d'IA"),
    I(climat, "Éthique et impact environnemental de l'IA"),
  ],
};

export function illustrationDe(axe: string, stIdx: number): Ill | null {
  const l = TABLE[axe];
  if (!l) return null;
  return l[stIdx] ?? l[0] ?? null;
}

export function IllustrationTheme({
  axe,
  stIdx,
  couleur,
}: {
  axe: string;
  stIdx: number;
  couleur: string;
}) {
  const ill = illustrationDe(axe, stIdx);
  if (!ill) return null;
  return (
    <figure
      className="-mx-1 overflow-hidden rounded-2xl border-2 shadow-sm"
      style={{ borderColor: `${couleur}33` }}
    >
      <img
        src={ill.src}
        alt={ill.alt}
        loading="lazy"
        width={1152}
        height={576}
        className="h-28 w-full object-cover sm:h-36"
      />
    </figure>
  );
}
