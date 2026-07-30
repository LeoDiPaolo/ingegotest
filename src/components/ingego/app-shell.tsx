import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, ChartNoAxesColumn, Play, Sliders } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MotIngego, PastilleIngego } from "@/components/ingego/marque";


const ONGLETS = [
  { to: "/", label: "Aujourd'hui", icon: CalendarCheck },
  { to: "/session", label: "Session", icon: Play },
  { to: "/progression", label: "Progression", icon: ChartNoAxesColumn },
  { to: "/reglages", label: "Réglages", icon: Sliders },
] as const;

export function AppShell({
  titre,
  surTitre,
  action,
  children,
}: {
  titre: string;
  surTitre?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/90 px-5 pt-4 pb-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5">
          <PastilleIngego className="h-7 w-7 rounded-lg" />
          <MotIngego className="text-lg" />
        </div>
        <div className="mx-auto mt-3 grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            {surTitre ? (
              <p className="text-[0.7rem] font-medium tracking-[0.18em] text-brand uppercase">
                {surTitre}
              </p>
            ) : null}
            <h1 className="truncate text-3xl text-primary">{titre}</h1>
          </div>
          {action}
        </div>
      </header>


      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {ONGLETS.map(({ to, label, icon: Icon }) => {
            const actif = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "tap flex flex-col items-center gap-1 py-3 text-[0.68rem] transition-colors",
                    actif ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={actif ? 2.3 : 1.7} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
