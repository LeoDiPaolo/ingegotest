import { useEffect, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import {
  activerRappels,
  definirPrenom,
  desactiverRappels,
  envoyerTest,
  etatRappels,
  lirePrenom,
  surIosNonInstalle,
} from "@/lib/ingego/push";

type Etat = "chargement" | "impossible" | "actif" | "inactif" | "refuse";

export function CarteRappels() {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [occupe, setOccupe] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [iosNonInstalle, setIosNonInstalle] = useState(false);
  const [prenom, setPrenom] = useState("");

  useEffect(() => {
    setIosNonInstalle(surIosNonInstalle());
    setPrenom(lirePrenom());
    void etatRappels().then(setEtat);
  }, []);

  function enregistrerLePrenom(valeur: string) {
    setPrenom(valeur);
    void definirPrenom(valeur);
  }

  async function basculer() {
    setOccupe(true);
    setInfo(null);
    try {
      if (etat === "actif") {
        await desactiverRappels();
        setEtat("inactif");
      } else {
        const resultat = await activerRappels();
        setEtat(resultat);
        if (resultat === "refuse") {
          setInfo("Les notifications sont bloquées dans les réglages du téléphone.");
        }
      }
    } catch (e) {
      console.error(e);
      setInfo("Impossible de modifier les rappels pour le moment.");
    } finally {
      setOccupe(false);
    }
  }

  async function tester() {
    setOccupe(true);
    setInfo(null);
    try {
      const resultat = await envoyerTest();
      setInfo(
        resultat && resultat.envoyes > 0
          ? "Notification de test envoyée."
          : "Aucun appareil n'a pu être joint.",
      );
    } catch (e) {
      console.error(e);
      setInfo("L'envoi de test a échoué.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <section className="surface space-y-3 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Bell className="h-4 w-4 text-brand" /> Rappels de révision
      </h2>
      <p className="text-xs text-muted-foreground">
        Un rappel par jour en fin d'après-midi, seulement si des cartes t'attendent ou si ta série
        est en jeu.
      </p>

      {iosNonInstalle ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 p-2.5 text-xs">
          Sur iPhone, ajoute d'abord IngéGo à l'écran d'accueil (Partager → Sur l'écran d'accueil),
          puis ouvre l'application depuis son icône pour activer les rappels.
        </p>
      ) : null}

      {etat === "impossible" ? (
        <p className="text-xs text-muted-foreground">
          Cet appareil ou ce navigateur ne permet pas les rappels.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            onClick={basculer}
            disabled={occupe || etat === "chargement"}
            className="tap flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold disabled:opacity-50"
          >
            {etat === "actif" ? (
              <>
                <BellOff className="h-4 w-4" /> Désactiver les rappels
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" /> Activer les rappels
              </>
            )}
          </button>

          {etat === "actif" ? (
            <button
              onClick={tester}
              disabled={occupe}
              className="tap flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated py-2.5 text-xs font-semibold disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Envoyer une notification de test
            </button>
          ) : null}
        </div>
      )}

      {info ? <p className="text-xs text-muted-foreground">{info}</p> : null}
    </section>
  );
}
