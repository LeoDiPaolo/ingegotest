import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* Abonnements aux rappels. Comme la progression, la table n'est joignable que
   depuis le serveur, sur la ligne correspondant à la clé secrète de l'appareil. */

const cleSchema = z
  .string()
  .trim()
  .min(20)
  .max(64)
  .regex(/^ing-[0-9a-fA-F-]{36}$/);

const abonnementSchema = z.object({
  cle: cleSchema,
  endpoint: z.string().trim().url().max(2000).startsWith("https://"),
  p256dh: z.string().trim().min(10).max(255),
  auth: z.string().trim().min(4).max(255),
  fuseau: z.string().trim().max(64).default("Europe/Paris"),
});

export const enregistrerAbonnement = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => abonnementSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("abonnements_push").upsert(
      {
        cle: data.cle,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        fuseau: data.fuseau,
      } as never,
      { onConflict: "endpoint" },
    );
    if (error) {
      console.error("enregistrerAbonnement", error);
      throw new Error("Activation des rappels impossible");
    }
    return { ok: true };
  });

export const supprimerAbonnement = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ endpoint: z.string().trim().url().max(2000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("abonnements_push")
      .delete()
      .eq("endpoint", data.endpoint);
    if (error) {
      console.error("supprimerAbonnement", error);
      throw new Error("Désactivation des rappels impossible");
    }
    return { ok: true };
  });

/* Envoi immédiat d'une notification de test sur les appareils de cette clé. */
export const testerRappel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ cle: cleSchema }).parse(data))
  .handler(async ({ data }) => {
    const { envoyerAuxAbonnements } = await import("./push.server");
    return envoyerAuxAbonnements(data.cle, {
      titre: "IngéGo",
      corps: "Notification de test : tout fonctionne.",
      tag: "ingego-test",
    });
  });
