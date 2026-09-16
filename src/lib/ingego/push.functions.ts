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
  prenom: z.string().trim().max(40).nullable().optional(),
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
        prenom: data.prenom?.trim() || null,
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
      titre: "— Ça marche ? — Oui. — T'es sûr ? — Tu viens de le lire.",
      corps: "— C'était un test. — Et le résultat ? — Tu le tiens dans la main.",
      tag: "ingego-test",
    });
  });

/* Mise à jour du prénom utilisé dans les notifications, pour tous les
   appareils rattachés à cette clé. */
export const enregistrerPrenom = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ cle: cleSchema, prenom: z.string().trim().max(40) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("abonnements_push")
      .update({ prenom: data.prenom || null } as never)
      .eq("cle", data.cle);
    if (error) {
      console.error("enregistrerPrenom", error);
      throw new Error("Enregistrement du prénom impossible");
    }
    return { ok: true };
  });
