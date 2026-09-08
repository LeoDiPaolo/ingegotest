import { Link } from "@tanstack/react-router";
import { Layers, Library, Settings, Zap } from "lucide-react";

const ONGLETS = [
  { to: "/", label: "Réviser", Icone: Zap },
  { to: "/elevation", label: "Élévation", Icone: Layers },
  { to: "/corpus", label: "Corpus", Icone: Library },
  { to: "/reglages", label: "Réglages", Icone: Settings },
] as const;

export function NavBas() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl px-2 py-1.5">
        {ONGLETS.map(({ to, label, Icone }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="tap flex flex-col items-center gap-1 rounded-2xl py-2 text-[0.7rem] font-bold transition-transform active:scale-95"
            >
              <Icone className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
