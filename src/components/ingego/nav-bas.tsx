import { Link } from "@tanstack/react-router";
import { Home, BookOpen, Trophy, User } from "lucide-react";

const ONGLETS = [
  { to: "/", label: "Accueil", Icone: Home },
  { to: "/questions", label: "Leçons", Icone: BookOpen },
  { to: "/progres", label: "Progrès", Icone: Trophy },
  { to: "/profil", label: "Profil", Icone: User },
] as const;

export function NavBas() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl">
        {ONGLETS.map(({ to, label, Icone }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              search={to === "/" ? { q: undefined } : undefined}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="tap flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium"
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
