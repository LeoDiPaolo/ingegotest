import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

/* Envoi Web Push (RFC 8291) depuis le runtime serveur. */

export interface Message {
  titre: string;
  corps: string;
  tag?: string;
  url?: string;
}

export interface Abonnement {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

function clesVapid() {
  return {
    subject: process.env["VAPID_SUBJECT"] || "mailto:contact@ingego.app",
    publicKey: process.env["VAPID_PUBLIC_KEY"],
    privateKey: process.env["VAPID_PRIVATE_KEY"],
  };
}

/* Renvoie true si l'abonnement est toujours valide, false s'il faut le retirer. */
export async function envoyerA(ab: Abonnement, message: Message): Promise<boolean> {
  const subscription: PushSubscription = {
    endpoint: ab.endpoint,
    expirationTime: null,
    keys: { p256dh: ab.p256dh, auth: ab.auth },
  };

  const payload = await buildPushPayload(
    { data: message, options: { ttl: 12 * 3600, urgency: "normal" } },
    subscription,
    clesVapid(),
  );

  const reponse = await fetch(ab.endpoint, {
    method: "POST",
    headers: payload.headers,
    body: payload.body as unknown as BodyInit,
  });

  if (reponse.status === 404 || reponse.status === 410) return false;
  if (!reponse.ok) {
    console.error("push", reponse.status, await reponse.text().catch(() => ""));
  }
  return true;
}

/* Envoi ponctuel (test depuis les réglages) sur tous les appareils d'une clé. */
export async function envoyerAuxAbonnements(cle: string, message: Message) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("abonnements_push")
    .select("id, endpoint, p256dh, auth")
    .eq("cle", cle);
  if (error) {
    console.error("envoyerAuxAbonnements", error);
    throw new Error("Envoi impossible");
  }
  const abonnements = (data ?? []) as Abonnement[];
  let envoyes = 0;
  for (const ab of abonnements) {
    try {
      const vivant = await envoyerA(ab, message);
      if (vivant) envoyes += 1;
      else await supabaseAdmin.from("abonnements_push").delete().eq("id", ab.id);
    } catch (e) {
      console.error("envoyerA", e);
    }
  }
  return { envoyes, appareils: abonnements.length };
}
