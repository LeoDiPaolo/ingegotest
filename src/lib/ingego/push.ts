import {
  enregistrerAbonnement,
  enregistrerPrenom,
  supprimerAbonnement,
  testerRappel,
} from "./push.functions";

const CLE_PRENOM = "ingego-prenom";

export function lirePrenom(): string {
  try {
    return localStorage.getItem(CLE_PRENOM) ?? "";
  } catch {
    return "";
  }
}

export async function definirPrenom(prenom: string): Promise<void> {
  const p = prenom.trim().slice(0, 40);
  try {
    localStorage.setItem(CLE_PRENOM, p);
  } catch {
    /* stockage indisponible */
  }
  const cle = cleAppareil();
  if (!cle) return;
  await enregistrerPrenom({ data: { cle, prenom: p } }).catch(() => undefined);
}

/* Rappels de révision côté navigateur : enregistrement du service worker,
   demande de permission et abonnement Web Push. */

export const CLE_PUBLIQUE_VAPID =
  "BI5vmLZZgMFFKyPsC2BNv8IupIHS92Pp08YBlMHHYH72MdH4CQfMKg3PircyIMUoDbL9q_s9yaRHnWYEbSDDCuI";

const CLE_APPAREIL = "ingego-cle-appareil";

function cleAppareil(): string | null {
  try {
    return localStorage.getItem(CLE_APPAREIL);
  } catch {
    return null;
  }
}

function base64UrlVersOctets(base64: string): Uint8Array {
  const complet = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const brut = atob(complet);
  const octets = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
  return octets;
}

function octetsVersBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const octets = new Uint8Array(buffer);
  let binaire = "";
  for (const o of octets) binaire += String.fromCharCode(o);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* Le service worker ne sert qu'aux notifications : pas de cache, donc rien à
   invalider. On évite tout de même l'aperçu intégré, qui tourne en iframe. */
export function environnementCompatible(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;
  if (window.top !== window.self) return false;
  return true;
}

export function surIosNonInstalle(): boolean {
  if (typeof navigator === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const installe =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !installe;
}

export async function enregistrerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!environnementCompatible()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (e) {
    console.error("service worker", e);
    return null;
  }
}

export async function etatRappels(): Promise<"impossible" | "actif" | "inactif" | "refuse"> {
  if (!environnementCompatible()) return "impossible";
  if (Notification.permission === "denied") return "refuse";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const abonnement = await reg?.pushManager.getSubscription();
  return abonnement ? "actif" : "inactif";
}

export async function activerRappels(): Promise<"actif" | "refuse" | "impossible"> {
  if (!environnementCompatible()) return "impossible";
  const cle = cleAppareil();
  if (!cle) return "impossible";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "refuse";

  const reg = (await enregistrerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  await navigator.serviceWorker.ready;

  const abonnement =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlVersOctets(CLE_PUBLIQUE_VAPID) as BufferSource,
    }));

  await enregistrerAbonnement({
    data: {
      cle,
      endpoint: abonnement.endpoint,
      p256dh: octetsVersBase64Url(abonnement.getKey("p256dh")),
      auth: octetsVersBase64Url(abonnement.getKey("auth")),
      fuseau: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
      prenom: lirePrenom() || null,
    },
  });

  return "actif";
}

export async function desactiverRappels(): Promise<void> {
  if (!environnementCompatible()) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const abonnement = await reg?.pushManager.getSubscription();
  if (!abonnement) return;
  const endpoint = abonnement.endpoint;
  await abonnement.unsubscribe().catch(() => undefined);
  await supprimerAbonnement({ data: { endpoint } }).catch(() => undefined);
}

export async function envoyerTest(): Promise<{ envoyes: number; appareils: number } | null> {
  const cle = cleAppareil();
  if (!cle) return null;
  return testerRappel({ data: { cle } });
}
