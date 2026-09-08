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
  A3: Building2,
  A4: Wrench,
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

export function BadgeMaitrise({
  axe,
  acquis,
  total,
}: {
  axe: Axe;
  acquis: number;
  total: number;
}) {
  const part = total ? acquis / total : 0;
  const palier = part >= 0.8 ? "Maîtrisé" : part >= 0.35 ? "En chantier" : "À explorer";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="relative">
        <IconeAxe axe={axe} className="h-14 w-14" active={part >= 0.8} />
        {part >= 0.8 ? (
          <span className="absolute -right-1 -bottom-1 grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground ring-2 ring-card">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{axe.court}</p>
        <p className="text-xs text-muted-foreground">{palier}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full" style={{ width: `${part * 100}%`, backgroundColor: axe.couleur }} />
        </div>
      </div>
      {part >= 0.8 ? <Award className="h-5 w-5 text-brand" /> : null}
    </div>
  );
}