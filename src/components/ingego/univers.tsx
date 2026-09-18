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
import { useId } from "react";
import { AXE_BY_ID, type Axe } from "@/lib/ingego/corpus";
import type { Palier } from "@/lib/ingego/badges";
import { cn } from "@/lib/utils";

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

/* Contour d'engrenage : alternance dent/creux sur un cercle. */
function pointsEngrenage(
  cx: number,
  cy: number,
  rCreux: number,
  rDent: number,
  dents: number,
): string {
  const pts: string[] = [];
  const pas = (Math.PI * 2) / dents;
  const largeurDent = pas * 0.32;
  for (let i = 0; i < dents; i++) {
    const centre = i * pas - Math.PI / 2;
    const angles = [
      centre - largeurDent * 1.5,
      centre - largeurDent,
      centre + largeurDent,
      centre + largeurDent * 1.5,
    ];
    const rayons = [rCreux, rDent, rDent, rCreux];
    angles.forEach((angle, idx) => {
      pts.push(
        `${(cx + rayons[idx] * Math.cos(angle)).toFixed(1)},${(cy + rayons[idx] * Math.sin(angle)).toFixed(1)}`,
      );
    });
  }
  return pts.join(" ");
}

const ENGRENAGE_LG = pointsEngrenage(50, 50, 34, 48, 12);
const ENGRENAGE_SM = pointsEngrenage(50, 50, 34, 48, 8);

/* Couronne de laurier réservée au palier spécial. */
const LAURIERS = Array.from({ length: 7 }, (_, i) => i).flatMap((i) =>
  [-1, 1].map((sens) => {
    const t = 0.12 + i * 0.12;
    const angle = Math.PI / 2 + sens * (Math.PI * 0.85 * t);
    const r = 37;
    return {
      cle: `${sens}-${i}`,
      x: 50 + r * Math.cos(angle),
      y: 50 + r * Math.sin(angle),
      rotation: (angle * 180) / Math.PI + (sens > 0 ? 100 : 80),
    };
  }),
);

/* Médaille : vrai badge visuel, verrouillé ou débloqué. */
export function Medaille({
  libelle,
  legende,
  couleur,
  acquis,
  taille = "sm",
  icone: Icone = Award,
  palier,
}: {
  libelle: string;
  legende?: string;
  couleur?: string;
  acquis: boolean;
  taille?: "sm" | "lg";
  icone?: LucideIcon;
  palier?: Palier;
}) {
  const teintes: Record<Palier, string> = {
    bronze: "#B87333",
    argent: "#9CA3AF",
    or: "#D4AF37",
    special: couleur ?? "var(--color-brand)",
  };
  const c = palier ? teintes[palier] : (couleur ?? "var(--color-brand)");
  const grand = taille === "lg";
  const special = palier === "special";
  const id = useId().replace(/:/g, "");
  const remplissage = acquis ? `url(#grad-${id})` : "var(--color-elevated)";
  const trait = acquis ? c : "var(--color-border)";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "relative grid aspect-square place-items-center transition-transform",
          grand ? "w-28 drop-shadow-[var(--shadow-lift)]" : "w-full max-w-16",
          !acquis && "opacity-45 grayscale",
        )}
        style={{ color: acquis ? c : "var(--color-muted-foreground)" }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <radialGradient id={`grad-${id}`} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor={`color-mix(in oklab, ${c} 35%, white)`} />
              <stop offset="100%" stopColor={c} />
            </radialGradient>
            {grand ? <path id={`arc-${id}`} d="M 16,56 A 34,34 0 1 1 84,56" fill="none" /> : null}
          </defs>
          {special ? (
            <>
              <circle cx="50" cy="50" r="40" fill={remplissage} stroke={trait} strokeWidth={3} />
              {LAURIERS.map((f) => (
                <ellipse
                  key={f.cle}
                  cx={f.x}
                  cy={f.y}
                  rx={4.5}
                  ry={2}
                  fill={trait}
                  opacity={0.55}
                  transform={`rotate(${f.rotation} ${f.x} ${f.y})`}
                />
              ))}
            </>
          ) : (
            <polygon
              points={grand ? ENGRENAGE_LG : ENGRENAGE_SM}
              fill={remplissage}
              stroke={trait}
              strokeWidth={grand ? 2 : 1.3}
            />
          )}
          <circle
            cx="50"
            cy="50"
            r={special ? 31 : 30}
            fill="var(--color-card)"
            opacity={0.88}
            stroke={trait}
            strokeWidth={1}
          />
          <circle
            cx="50"
            cy="50"
            r={special ? 27 : 26}
            fill="none"
            stroke={trait}
            strokeDasharray="2 3"
            strokeWidth={0.8}
            opacity={0.5}
          />
          {grand ? (
            <text
              className="text-[5.5px] font-bold tracking-[0.15em] uppercase"
              fill={trait}
              opacity={0.8}
            >
              <textPath href={`#arc-${id}`} startOffset="50%" textAnchor="middle">
                Service public · Construction
              </textPath>
            </text>
          ) : null}
        </svg>
        <div className="relative flex flex-col items-center leading-none">
          <Icone className={grand ? "h-5 w-5" : "h-3 w-3"} strokeWidth={2.4} />
          <span
            className={cn(
              "mt-0.5 font-extrabold tabular-nums",
              grand ? "text-xl" : "text-[0.65rem]",
            )}
          >
            {libelle}
          </span>
        </div>
        {acquis ? (
          <span className="absolute -right-1 -bottom-1 grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground ring-2 ring-card">
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
