import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { AXE_BY_ID, FAMILLES, TYPES, type Question } from "@/lib/ingego/corpus";
import { graineDe, melange } from "@/lib/ingego/algo";
import { CarteFrance } from "@/components/ingego/carte-france";
import { GrapheBarres } from "@/components/ingego/graphe-barres";
import { Camembert } from "@/components/ingego/camembert";
import { SchemaPlan } from "@/components/ingego/schema-plan";
import { GrapheCourbe } from "@/components/ingego/graphe-courbe";
import { Organigramme } from "@/components/ingego/organigramme";
import { CoupeSol } from "@/components/ingego/coupe-sol";
import { Synoptique } from "@/components/ingego/synoptique";
import { Radar } from "@/components/ingego/radar";
import { CycleVie } from "@/components/ingego/cycle-vie";
import { Echelle } from "@/components/ingego/echelle";
import { TriChantier } from "@/components/ingego/tri-chantier";
import { CoupeParoi } from "@/components/ingego/coupe-paroi";
import { ParcoursPmr } from "@/components/ingego/parcours-pmr";
import { FacadeSolaire } from "@/components/ingego/facade-solaire";
import { PlanPluvial } from "@/components/ingego/plan-pluvial";
import { cn } from "@/lib/utils";

type Reponse = unknown;

const AUTO_NOTE = ["libre", "vf"];

function initiale(q: Question): Reponse {
  switch (q.type) {
    case "ordre":
      return melange(q.items ?? [], graineDe(q.id));
    case "libre":
      return "";
    case "frise":
    case "assoc":
    case "trous":
    case "tri":
    case "chantier":
    case "facade":
    case "pluvial":
      return {} as Record<string, number | string>;
    default:
      return null;
  }
}

function complet(q: Question, rep: Reponse): boolean {
  switch (q.type) {
    case "qcm":
    case "erreur":
    case "vf":
    case "carte":
    case "graphe":
    case "camembert":
    case "plan":
    case "courbe":
    case "organigramme":
    case "coupe":
    case "synoptique":
    case "radar":
    case "cycle":
    case "echelle":
    case "paroi":
    case "pmr":
      return rep !== null;
    case "libre":
      return true;
    case "ordre":
      return true;
    case "frise":
      return Object.keys(rep as object).length === (q.points ?? []).length;
    case "assoc":
      return Object.keys(rep as object).length === (q.paires ?? []).length;
    case "trous":
      return Object.keys(rep as object).length === (q.mots ?? []).length;
    case "tri":
      return Object.keys(rep as object).length === (q.elements ?? []).length;
    case "chantier":
      return Object.keys(rep as object).length === (q.chantier?.depots ?? []).length;
    case "facade":
      return Object.keys(rep as object).length === (q.facade?.faces ?? []).length;
    case "pluvial":
      return Object.keys(rep as object).length === (q.pluvial?.ouvrages ?? []).length;
    default:
      return false;
  }
}

function juste(q: Question, rep: Reponse): boolean {
  const m = rep as Record<string, number>;
  switch (q.type) {
    case "qcm":
      return rep === q.bonneReponse;
    case "erreur":
      return rep === q.phraseFautive;
    case "vf":
      return rep === q.vrai;
    case "carte":
      return rep === q.bonneZone;
    case "graphe":
      return rep === q.bonneBarre;
    case "camembert":
    case "plan":
    case "organigramme":
    case "coupe":
    case "synoptique":
    case "radar":
    case "cycle":
    case "echelle":
    case "paroi":
    case "pmr":
      return rep === q.bonneCible;
    case "courbe":
      return rep === q.bonnePoint;
    case "ordre":
      return (rep as string[]).every((s, i) => s === (q.items ?? [])[i]);
    case "frise":
      return (q.points ?? []).every((_, i) => m[i] === i);
    case "assoc":
      return (q.paires ?? []).every((_, i) => m[i] === i);
    case "trous":
      return (q.mots ?? []).every((mot, i) => (rep as Record<string, string>)[i] === mot);
    case "tri":
      return (q.elements ?? []).every((el, i) => m[i] === el[1]);
    case "chantier":
      return (q.chantier?.depots ?? []).every((d, i) => m[i] === d.col);
    case "facade":
      return (q.facade?.faces ?? []).every((f, i) => m[i] === f.col);
    case "pluvial":
      return (q.pluvial?.ouvrages ?? []).every((o, i) => m[i] === o.col);
    default:
      return false;
  }
}

const optionClass = (etat: "neutre" | "choisi" | "ok" | "ko") =>
  cn(
    "tap w-full rounded-xl border px-4 py-3 text-left text-sm leading-snug transition-colors",
    etat === "neutre" && "border-border bg-elevated text-foreground",
    etat === "choisi" && "border-primary bg-primary/15 text-foreground",
    etat === "ok" && "border-success bg-success/15 text-foreground",
    etat === "ko" && "border-destructive bg-destructive/15 text-foreground",
  );

const selectClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring";

export function Exercice({
  q,
  numero,
  total,
  onNote,
  onCorrige,
}: {
  q: Question;
  numero: number;
  total: number;
  onNote: (note: number) => void;
  onCorrige?: (juste: boolean) => void;
}) {
  const [rep, setRep] = useState<Reponse>(() => initiale(q));
  const [corrige, setCorrige] = useState(false);

  const axe = AXE_BY_ID[q.axe];
  const famille = FAMILLES[q.fam];
  const estJuste = useMemo(() => (corrige ? juste(q, rep) : false), [corrige, q, rep]);
  const autoNote = AUTO_NOTE.includes(q.type);

  const melangeMots = useMemo(
    () => melange([...(q.mots ?? []), ...(q.leurres ?? [])], graineDe(q.id)),
    [q],
  );
  const melangeDroite = useMemo(
    () => melange((q.paires ?? []).map((p, i) => ({ texte: p[1], i })), graineDe(q.id + "d")),
    [q],
  );
  const melangeFrise = useMemo(
    () => melange((q.points ?? []).map((p, i) => ({ texte: p[1], i })), graineDe(q.id + "f")),
    [q],
  );

  const setMap = (cle: number, valeur: number | string) =>
    setRep((r: Reponse) => ({ ...(r as object), [cle]: valeur }));

  function deplacer(i: number, d: number) {
    setRep((r: Reponse) => {
      const l = [...(r as string[])];
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      [l[i], l[j]] = [l[j], l[i]];
      return l;
    });
  }

  return (
    <article className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[0.68rem]">
        <span
          className="rounded-full px-2.5 py-1 font-semibold"
          style={{ backgroundColor: `${axe.couleur}22`, color: axe.couleur }}
        >
          {axe.court} · {q.sousTheme}
        </span>
        <span className="rounded-full bg-elevated px-2.5 py-1 text-muted-foreground">
          {TYPES[q.type]}
        </span>
        <span className="rounded-full bg-elevated px-2.5 py-1 text-muted-foreground">
          Niveau {q.niveau}
        </span>
        <span className="ml-auto text-muted-foreground">
          {numero} / {total}
        </span>
      </div>

      <h2 className="text-xl leading-snug">{q.question}</h2>

      {/* ---------- SAISIE ---------- */}
      {q.type === "qcm" && (
        <div className="space-y-2">
          {(q.options ?? []).map((o, i) => (
            <button
              key={i}
              disabled={corrige}
              onClick={() => setRep(i)}
              className={optionClass(
                corrige
                  ? i === q.bonneReponse
                    ? "ok"
                    : rep === i
                      ? "ko"
                      : "neutre"
                  : rep === i
                    ? "choisi"
                    : "neutre",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {q.type === "carte" && (
        <CarteFrance
          echelle={q.echelle ?? "regions"}
          selection={(rep as string | null) ?? null}
          onSelect={(code) => setRep(code || null)}
          bonneZone={q.bonneZone}
          corrige={corrige}
          codesAutorises={q.zonesAutorisees}
        />
      )}

      {q.type === "graphe" && q.graphe && (
        <GrapheBarres
          donnees={q.graphe}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneBarre={q.bonneBarre}
          corrige={corrige}
        />
      )}

      {q.type === "camembert" && q.camembert && (
        <Camembert
          donnees={q.camembert}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "plan" && q.plan && (
        <SchemaPlan
          donnees={q.plan}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "courbe" && q.courbe && (
        <GrapheCourbe
          donnees={q.courbe}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonnePoint={q.bonnePoint}
          corrige={corrige}
        />
      )}

      {q.type === "organigramme" && q.orga && (
        <Organigramme
          donnees={q.orga}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "coupe" && q.coupe && (
        <CoupeSol
          donnees={q.coupe}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "synoptique" && q.synoptique && (
        <Synoptique
          donnees={q.synoptique}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "radar" && q.radar && (
        <Radar
          donnees={q.radar}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}



      {q.type === "cycle" && q.cycle && (
        <CycleVie
          donnees={q.cycle}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "echelle" && q.echelle_g && (
        <Echelle
          donnees={q.echelle_g}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "chantier" && q.chantier && (
        <TriChantier
          donnees={q.chantier}
          reponses={rep as Record<string, number>}
          onAffecter={(i, col) => setMap(i, col)}
          corrige={corrige}
        />
      )}

      {q.type === "paroi" && q.paroi && (
        <CoupeParoi
          donnees={q.paroi}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "pmr" && q.pmr && (
        <ParcoursPmr
          donnees={q.pmr}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "facade" && q.facade && (
        <FacadeSolaire
          donnees={q.facade}
          reponses={rep as Record<string, number>}
          onAffecter={(i, col) => setMap(i, col)}
          corrige={corrige}
        />
      )}

      {q.type === "pluvial" && q.pluvial && (
        <PlanPluvial
          donnees={q.pluvial}
          reponses={rep as Record<string, number>}
          onAffecter={(i, col) => setMap(i, col)}
          corrige={corrige}
        />
      )}

      {q.type === "erreur" && (
        <div className="space-y-2">
          {(q.segments ?? []).map((s, i) => (
            <button
              key={i}
              disabled={corrige}
              onClick={() => setRep(i)}
              className={optionClass(
                corrige
                  ? i === q.phraseFautive
                    ? "ok"
                    : rep === i
                      ? "ko"
                      : "neutre"
                  : rep === i
                    ? "choisi"
                    : "neutre",
              )}
            >
              {corrige && i === q.phraseFautive ? (
                <span className="mb-1 block text-[0.68rem] font-semibold tracking-[0.12em] text-success uppercase">
                  Phrase fautive
                </span>
              ) : null}
              {s}
            </button>
          ))}
          <p className="text-xs text-muted-foreground">
            Les phrases se lisent à la suite. Touchez celle qui est fautive : en correction, elle
            apparaît en vert, et votre choix erroné éventuel en rouge.
          </p>
        </div>
      )}


      {q.type === "vf" && (
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              disabled={corrige}
              onClick={() => setRep(v)}
              className={optionClass(
                corrige
                  ? v === q.vrai
                    ? "ok"
                    : rep === v
                      ? "ko"
                      : "neutre"
                  : rep === v
                    ? "choisi"
                    : "neutre",
              )}
            >
              <span className="font-semibold">{v ? "Vrai" : "Faux"}</span>
            </button>
          ))}
        </div>
      )}

      {q.type === "libre" && (
        <textarea
          value={rep as string}
          onChange={(e) => setRep(e.target.value)}
          disabled={corrige}
          rows={6}
          placeholder="Formulez votre réponse comme devant un jury, puis comparez."
          className="w-full rounded-xl border border-input bg-background p-3 text-base leading-relaxed text-foreground outline-none focus:border-ring"
        />
      )}

      {q.type === "ordre" && (
        <ol className="space-y-2">
          {(rep as string[]).map((s, i) => (
            <li
              key={s}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
                corrige
                  ? s === (q.items ?? [])[i]
                    ? "border-success bg-success/10"
                    : "border-destructive bg-destructive/10"
                  : "border-border bg-elevated",
              )}
            >
              <span className="min-w-0">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {s}
              </span>
              {!corrige && (
                <span className="flex shrink-0 gap-1">
                  <button
                    onClick={() => deplacer(i, -1)}
                    className="tap rounded-md bg-background p-1.5"
                    aria-label="Monter"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deplacer(i, 1)}
                    className="tap rounded-md bg-background p-1.5"
                    aria-label="Descendre"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {q.type === "ordre" && corrige && !estJuste && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-3">
          <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
            Ordre attendu
          </p>
          <ol className="mt-2 space-y-1.5">
            {(q.items ?? []).map((s, i) => (
              <li key={s} className="text-sm leading-snug">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}


      {q.type === "frise" && (
        <div className="space-y-2">
          {(q.points ?? []).map((p, i) => {
            const choisi = (rep as Record<string, number>)[i];
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-3",
                  corrige
                    ? choisi === i
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : "border-border bg-elevated",
                )}
              >
                <p className="font-display text-lg">{p[0]}</p>
                {corrige ? (
                  <p className="mt-1 text-sm text-muted-foreground">{p[1]}</p>
                ) : (
                  <select
                    value={choisi ?? ""}
                    onChange={(e) => setMap(i, Number(e.target.value))}
                    className={cn(selectClass, "mt-2")}
                  >
                    <option value="">Choisir l'événement…</option>
                    {melangeFrise.map((o) => (
                      <option key={o.i} value={o.i}>
                        {o.texte}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {q.type === "assoc" && (
        <div className="space-y-2">
          {(q.paires ?? []).map((p, i) => {
            const choisi = (rep as Record<string, number>)[i];
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-3",
                  corrige
                    ? choisi === i
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : "border-border bg-elevated",
                )}
              >
                <p className="text-sm font-semibold">{p[0]}</p>
                {corrige ? (
                  <p className="mt-1 text-sm text-muted-foreground">{p[1]}</p>
                ) : (
                  <select
                    value={choisi ?? ""}
                    onChange={(e) => setMap(i, Number(e.target.value))}
                    className={cn(selectClass, "mt-2")}
                  >
                    <option value="">Associer…</option>
                    {melangeDroite.map((o) => (
                      <option key={o.i} value={o.i}>
                        {o.texte}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {q.type === "trous" && (
        <div className="space-y-3">
          <p className="rounded-xl border border-border bg-elevated p-3 text-sm leading-relaxed">
            {(q.texte ?? "").split(/(\{\d+\})/).map((frag, k) => {
              const m = frag.match(/^\{(\d+)\}$/);
              if (!m) return <span key={k}>{frag}</span>;
              const idx = Number(m[1]) - 1;
              const val = (rep as Record<string, string>)[idx];
              const bon = (q.mots ?? [])[idx];
              return (
                <span
                  key={k}
                  className={cn(
                    "mx-0.5 rounded px-1.5 py-0.5 font-semibold",
                    corrige
                      ? val === bon
                        ? "bg-success/25"
                        : "bg-destructive/25"
                      : val
                        ? "bg-primary/20"
                        : "bg-background text-muted-foreground",
                  )}
                >
                  {corrige ? bon : (val ?? `…${idx + 1}`)}
                </span>
              );
            })}
          </p>
          {!corrige &&
            (q.mots ?? []).map((_, idx) => (
              <select
                key={idx}
                value={(rep as Record<string, string>)[idx] ?? ""}
                onChange={(e) => setMap(idx, e.target.value)}
                className={selectClass}
              >
                <option value="">Trou {idx + 1}…</option>
                {melangeMots.map((mot) => (
                  <option key={mot} value={mot}>
                    {mot}
                  </option>
                ))}
              </select>
            ))}
        </div>
      )}

      {q.type === "tri" && (
        <div className="space-y-2">
          {(q.elements ?? []).map((el, i) => {
            const choisi = (rep as Record<string, number>)[i];
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-3",
                  corrige
                    ? choisi === el[1]
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : "border-border bg-elevated",
                )}
              >
                <p className="text-sm leading-snug">{el[0]}</p>
                {corrige ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    → {(q.colonnes ?? [])[el[1]]}
                  </p>
                ) : (
                  <select
                    value={choisi ?? ""}
                    onChange={(e) => setMap(i, Number(e.target.value))}
                    className={cn(selectClass, "mt-2")}
                  >
                    <option value="">Classer dans…</option>
                    {(q.colonnes ?? []).map((c, ci) => (
                      <option key={ci} value={ci}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- VALIDATION ET CORRECTION ---------- */}
      {!corrige ? (
        <button
          onClick={() => {
            setCorrige(true);
            onCorrige?.(juste(q, rep));
          }}
          disabled={!complet(q, rep)}
          className="tap w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {q.type === "libre" ? "Voir la réponse attendue" : "Valider"}
        </button>
      ) : (
        <div className="space-y-4">
          {!autoNote || q.type === "vf" ? (
            <p
              className={cn(
                "flex items-center gap-2 text-sm font-semibold",
                estJuste ? "text-success" : "text-destructive",
              )}
            >
              {estJuste ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {estJuste ? "Réponse juste" : "Réponse à revoir"}
            </p>
          ) : null}

          {q.type === "libre" && (
            <div className="rounded-xl border border-success/40 bg-success/10 p-3">
              <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
                Réponse attendue
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {q.options?.[q.bonneReponse ?? 0] ?? ""}
              </p>
            </div>
          )}

          {q.type === "vf" && q.justification && (
            <div className="rounded-xl border border-border bg-elevated p-3">
              <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
                Justification
              </p>
              <p className="mt-1 text-sm leading-relaxed">{q.justification}</p>
            </div>
          )}

          {q.correction && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
                Correction
              </p>
              <p className="mt-1 text-sm leading-relaxed">{q.correction}</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
              Ce qu'il faut retenir
            </p>
            <p className="mt-1 text-sm leading-relaxed">{q.explication}</p>
            <p className="mt-3 text-xs" style={{ color: famille.c }}>
              {famille.nom}
              {q.derniereVerification ? ` · vérifié ${q.derniereVerification}` : ""}
            </p>
            {q.aVerifier ? (
              <p className="mt-2 text-xs text-warning">À revérifier : {q.aVerifier}</p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {autoNote
                ? "Évaluez votre restitution : c'est elle qui règle la prochaine échéance."
                : "Comment était la reprise ?"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(autoNote
                ? ([
                    [0, "Raté"],
                    [1, "Difficile"],
                    [2, "Correct"],
                    [3, "Évident"],
                  ] as const)
                : estJuste
                  ? ([
                      [1, "Difficile"],
                      [2, "Bien"],
                      [3, "Évident"],
                    ] as const)
                  : ([[0, "Continuer"]] as const)
              ).map(([note, label]) => (
                <button
                  key={note}
                  onClick={() => onNote(note)}
                  className={cn(
                    "tap rounded-xl border py-3 text-sm font-semibold",
                    note === 0
                      ? "border-destructive/50 bg-destructive/15 text-foreground"
                      : note === 3
                        ? "border-success/50 bg-success/15 text-foreground"
                        : "border-border bg-elevated text-foreground",
                    !autoNote && !estJuste && "col-span-2",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
