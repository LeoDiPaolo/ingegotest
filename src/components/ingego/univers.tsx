import {
  Award,
  BookOpenCheck,
  Building2,
  FileCheck2,
  Gavel,
  HardHat,
  Landmark,
  Leaf,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { AXE_BY_ID, type Axe } from "@/lib/ingego/corpus";
import { cn } from "@/lib/utils";

const ICONES: Record<string, LucideIcon> = {
  A1: HardHat,
  A2: Gavel,
  A3: Wrench,
  A4: Building2,
  A5: Leaf,
  A6: Landmark,
  A7: BookOpenCheck,
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
  onClick,
}: {
  axe: Axe;
  acquis: number;
  total: number;
  onClick?: () => void;
}) {
  const part = total ? acquis / total : 0;
  const palier = part >= 0.8 ? "Maîtrisé" : part >= 0.35 ? "En chantier" : "À explorer";
  const atteint = palierAtteint(part);
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
          {atteint ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold"
              style={{ backgroundColor: `${axe.couleur}22`, color: axe.couleur }}
            >
              {Math.round(atteint * 100)} %
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {palier} · {acquis}/{total}
        </p>
        <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full transition-[width] duration-700"
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
