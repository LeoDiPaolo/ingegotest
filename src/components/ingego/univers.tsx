import {
  Award,
  Building2,
  FileCheck2,
  Gavel,
  GraduationCap,
  HardHat,
  Landmark,
  Cpu,
  Leaf,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { AXE_BY_ID, type Axe } from "@/lib/ingego/corpus";
import type { Palier } from "@/lib/ingego/badges";
import { cn } from "@/lib/utils";
import badgeBronzeAsset from "@/assets/badge-bronze.png";
import badgeArgentAsset from "@/assets/badge-argent.png";
import badgeOrAsset from "@/assets/badge-or.png";
import badgeSpecialAsset from "@/assets/badge-special.png";

const COQUILLES: Record<Palier, string> = {
  bronze: badgeBronzeAsset,
  argent: badgeArgentAsset,
  or: badgeOrAsset,
  special: badgeSpecialAsset,
};

/* Couleur du numéro gravé : celle du badge, légèrement foncée pour rester lisible sur le métal. */
const TEINTES: Record<Palier, string> = {
  bronze: "#8C5A2B",
  argent: "#7B8494",
  or: "#A8842A",
  special: "#2F8F6B",
};

export const ICONES: Record<string, LucideIcon> = {
  A1: HardHat,
  A2: Gavel,
  A3: Wrench,
  A4: Building2,
  A5: Leaf,
  A6: Landmark,
  A8: GraduationCap,
  A9: Cpu,
};

export function IconeAxe({
  axe,
  className,
  active = false,
}: {
  axe: Axe | string;
  className?: string;
  active?: boolean;
}) {
  const valeur = typeof axe === "string" ? AXE_BY_ID[axe] : axe;
  const Icone = ICONES[valeur?.id] ?? FileCheck2;
  return (
    <span
      className={cn(
        "grid aspect-square place-items-center rounded-full border-2 shadow-[0_3px_0_color-mix(in_oklab,currentColor_28%,transparent)] transition-transform",
        active ? "scale-105 bg-card" : "bg-elevated",
        className,
      )}
      style={{ color: valeur?.couleur, borderColor: `${valeur?.couleur}66` }}
    >
      <Icone className="h-[48%] w-[48%]" strokeWidth={2.2} />
    </span>
  );
}

/* Paliers de progression par catégorie : 10 %, 25 %, 50 %, 75 %, 100 %. */
export const PALIERS_PART = [0.1, 0.25, 0.5, 0.75, 1];

export const palierAtteint = (part: number) =>
  [...PALIERS_PART].reverse().find((p) => part >= p) ?? null;

export function BadgeMaitrise({
  axe,
  acquis,
  total,
  vus = 0,
  onClick,
}: {
  axe: Axe;
  acquis: number;
  total: number;
  vus?: number;
  onClick?: () => void;
}) {
  const part = total ? acquis / total : 0;
  const partVue = total ? Math.max(part, vus / total) : 0;
  const atteint = palierAtteint(part);
  /* On n'arrondit jamais au palier supérieur avant qu'il soit réellement atteint :
     36 validations sur 367 valent 9,8 %, et non un badge 10 % déjà acquis. */
  const pct = (v: number) => (v > 0 && v < 0.01 ? 1 : Math.floor(v * 100));
  /* Prochain palier et réussites manquantes : message orienté objectif. */
  const prochain = PALIERS_PART.find((p) => part < p) ?? null;
  const restants = prochain != null ? Math.max(1, Math.ceil(prochain * total) - acquis) : 0;
  const palier =
    part >= 1
      ? "Catégorie maîtrisée"
      : part > 0
        ? `${pct(part)} % maîtrisé`
        : partVue > 0
          ? "Premières réussites en cours"
          : "À découvrir";
  const sousTitre =
    prochain != null
      ? `Prochain badge à ${Math.round(prochain * 100)} % · encore ${restants} réussite${restants > 1 ? "s" : ""}`
      : "Tous les badges sont débloqués";
  const Balise = onClick ? "button" : "div";
  return (
    <Balise
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-[var(--shadow-card)]",
        onClick && "tap transition-transform active:scale-[0.98]",
      )}
    >
      <div className="relative">
        <IconeAxe axe={axe} className="h-14 w-14" active={part >= 0.8} />
        {part >= 0.8 ? (
          <span className="absolute -right-1 -bottom-1 grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground ring-2 ring-card">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold">{axe.court}</p>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold"
            style={{ backgroundColor: `${axe.couleur}22`, color: axe.couleur }}
          >
            {atteint ? `Badge ${Math.round(atteint * 100)} %` : `${pct(part)} %`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">{palier}</span>
          {" · "}
          {sousTitre}
        </p>
        <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
            style={{ width: `${partVue * 100}%`, backgroundColor: `${axe.couleur}55` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
            style={{ width: `${part * 100}%`, backgroundColor: axe.couleur }}
          />
          {PALIERS_PART.slice(0, 4).map((p) => (
            <span
              key={p}
              className="absolute top-0 h-full w-px bg-card/80"
              style={{ left: `${p * 100}%` }}
            />
          ))}
        </div>
      </div>
      {part >= 0.8 ? <Award className="h-5 w-5 shrink-0 text-brand" /> : null}
    </Balise>
  );
}

/* Médaille : image de badge gravée par palier, numéro en surimpression. */
export function Medaille({
  libelle,
  legende,
  acquis,
  taille = "sm",
  palier = "bronze",
}: {
  libelle?: string;
  legende?: string;
  couleur?: string;
  acquis: boolean;
  taille?: "sm" | "lg" | "xl";
  palier?: Palier;
}) {
  const grand = taille !== "sm";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "relative aspect-square transition-transform",
          taille === "xl"
            ? "w-28 drop-shadow-[var(--shadow-lift)]"
            : grand
              ? "w-28 drop-shadow-[var(--shadow-lift)]"
              : "w-full max-w-16",
          !acquis && "opacity-45 grayscale",
        )}
      >
        <img
          src={COQUILLES[palier]}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full select-none object-contain"
          draggable={false}
        />
        {libelle ? (
          <span
            className={cn(
              "absolute inset-0 grid place-items-center font-black tabular-nums",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.45),0_2px_3px_rgba(0,0,0,0.45)]",
              taille === "xl" ? "text-3xl" : grand ? "text-2xl" : "text-sm",
            )}
            style={{ color: TEINTES[palier] }}
          >
            {libelle}
          </span>
        ) : null}
        {acquis ? (
          <span
            className={cn(
              "absolute grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground ring-2 ring-card",
              taille === "xl" ? "right-[10%] bottom-[6%]" : "-right-1 -bottom-1",
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      {legende ? (
        <p
          className={cn(
            "text-center font-bold text-muted-foreground",
            grand ? "text-sm" : "text-[0.6rem]",
          )}
        >
          {legende}
        </p>
      ) : null}
    </div>
  );
}
