import logoAsset from "@/assets/ingego-logo.png.asset.json";
import castorAsset from "@/assets/ingego-castor.png.asset.json";
import iconAsset from "@/assets/ingego-icon.png.asset.json";
import { cn } from "@/lib/utils";

/** Verrou de marque : le lockup complet (castor + mot-clé + accroche). */
export function LogoIngego({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="IngéGo — réussissez votre concours d'ingénieur territorial bâtiment"
      className={cn("h-auto w-full max-w-xs select-none", className)}
      draggable={false}
    />
  );
}

/** Mascotte seule, pour les moments d'émotion (accueil, réussite, fin de session). */
export function Castor({
  className,
  alt = "",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={castorAsset.url}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("h-auto select-none", className)}
      draggable={false}
    />
  );
}

/** Pastille carrée (barre de navigation, avatars, en-têtes compacts). */
export function PastilleIngego({ className }: { className?: string }) {
  return (
    <img
      src={iconAsset.url}
      alt="IngéGo"
      className={cn("h-9 w-9 rounded-xl select-none", className)}
      draggable={false}
    />
  );
}

/** Mot-clé typographique seul, quand l'image serait trop lourde. */
export function MotIngego({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-2xl font-semibold text-primary", className)}>
      Ingé<span className="text-brand">Go</span>
    </span>
  );
}
