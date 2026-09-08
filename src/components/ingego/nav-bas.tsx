import { Link } from "@tanstack/react-router";
import { Layers, Library, Settings, Zap } from "lucide-react";
import { PastilleIngego } from "@/components/ingego/marque";

const ONGLETS = [
  { to: "/", label: "Réviser", Icone: Zap },
  { to: "/elevation", label: "Élévation", Icone: Layers },
  { to: "/corpus", label: "Corpus", Icone: Library },
  { to: "/reglages", label: "Réglages", Icone: Settings },
] as const;

export function NavBas() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 shadow-[0_-8px_30px_-20px_color-mix(in_oklab,var(--color-primary)_35%,transparent)] backdrop-blur">
      <ul className="relative mx-auto flex max-w-5xl px-2 py-1.5">
        {ONGLETS.map(({ to, label, Icone }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="tap group flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[0.68rem] font-bold transition-transform active:scale-95"
            >
              {to === "/" ? (
                <span className="-mt-4 grid h-11 w-11 place-items-center rounded-full border-4 border-card bg-primary shadow-[var(--shadow-card)]">
                  <PastilleIngego className="h-8 w-8 rounded-full" />
                </span>
              ) : (
                <span className="grid h-7 w-9 place-items-center rounded-full bg-elevated group-data-[status=active]:bg-primary/10">
                  <Icone className="h-4.5 w-4.5" />
                </span>
              )}
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
