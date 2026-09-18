import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* Accès à la progression : la table n'est plus joignable depuis le navigateur.
   Seul ce code serveur y accède, et uniquement sur la ligne correspondant à la
   clé secrète de l'appareil (identifiant aléatoire non devinable). */

const cleSchema = z
  .string()
  .trim()
  .min(20)
  .max(64)
  .regex(/^ing-[0-9a-fA-F-]{36}$/);

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
);

const etatSchema = z.object({
  cle: cleSchema,
  cartes: z.record(z.string(), jsonSchema),
  journal: z.array(jsonSchema).max(5000),
  reglages: z.record(z.string(), jsonSchema),
  commentaires: z.record(z.string(), z.string().max(4000)),
  gels: z.array(z.string().max(10)).max(500),
});

export const lireEtat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ cle: cleSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ligne, error } = await supabaseAdmin
      .from("etat_ingego")
      .select("cartes, journal, reglages, commentaires, gels")
      .eq("cle", data.cle)
      .maybeSingle();
    if (error) {
      console.error("lireEtat", error);
      throw new Error("Lecture de la progression impossible");
    }
    return ligne ?? null;
  });

export const ecrireEtat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => etatSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("etat_ingego")
      .upsert(data as never, { onConflict: "cle" });
    if (error) {
      console.error("ecrireEtat", error);
      throw new Error("Sauvegarde de la progression impossible");
    }
    return { ok: true };
  });
