import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  carteNeuve,
  normaliserReglages,
  planifier,
  type Carte,
  type Etat,
  type Reglages,
} from "@/lib/ingego/algo";

interface CarteRow {
  question_id: string;
  p: number;
  e: number;
  du: number;
  reps: number;
  echecs: number;
  vu: boolean;
  dernier: number;
}

export interface EntreeJournal {
  question_id: string;
  note: number;
  jour: string;
}

function versEtat(rows: CarteRow[]): Etat {
  const etat: Etat = {};
  for (const r of rows) {
    etat[r.question_id] = {
      p: Number(r.p),
      e: Number(r.e),
      du: Number(r.du),
      reps: Number(r.reps),
      echecs: Number(r.echecs),
      vu: r.vu,
      dernier: Number(r.dernier),
    };
  }
  return etat;
}

export function useProgression(userId: string | undefined) {
  const qc = useQueryClient();

  const cartes = useQuery({
    queryKey: ["cartes", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Etat> => {
      const { data, error } = await supabase
        .from("cartes")
        .select("question_id, p, e, du, reps, echecs, vu, dernier");
      if (error) throw error;
      return versEtat((data ?? []) as CarteRow[]);
    },
  });

  const reglages = useQuery({
    queryKey: ["reglages", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Reglages> => {
      const { data, error } = await supabase.from("reglages").select("data").maybeSingle();
      if (error) throw error;
      return normaliserReglages((data?.data ?? null) as Partial<Reglages> | null);
    },
  });

  const journal = useQuery({
    queryKey: ["journal", userId],
    enabled: !!userId,
    queryFn: async (): Promise<EntreeJournal[]> => {
      const { data, error } = await supabase
        .from("journal")
        .select("question_id, note, jour")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as EntreeJournal[];
    },
  });

  const noter = useMutation({
    mutationFn: async ({ questionId, note }: { questionId: string; note: number }) => {
      if (!userId) throw new Error("Non connecté");
      const etat = qc.getQueryData<Etat>(["cartes", userId]) ?? {};
      const avant: Carte = etat[questionId] ?? carteNeuve();
      const apres = planifier(avant, note, Date.now());

      const { error } = await supabase.from("cartes").upsert(
        {
          user_id: userId,
          question_id: questionId,
          p: apres.p,
          e: apres.e,
          du: apres.du,
          reps: apres.reps,
          echecs: apres.echecs,
          vu: apres.vu,
          dernier: apres.dernier,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,question_id" },
      );
      if (error) throw error;

      const { error: errJ } = await supabase
        .from("journal")
        .insert({ user_id: userId, question_id: questionId, note });
      if (errJ) throw errJ;

      return { questionId, apres };
    },
    onSuccess: ({ questionId, apres }) => {
      qc.setQueryData<Etat>(["cartes", userId], (old) => ({ ...(old ?? {}), [questionId]: apres }));
      qc.invalidateQueries({ queryKey: ["journal", userId] });
    },
  });

  const enregistrerReglages = useMutation({
    mutationFn: async (r: Reglages) => {
      if (!userId) throw new Error("Non connecté");
      const { error } = await supabase
        .from("reglages")
        .upsert(
          { user_id: userId, data: r as unknown as Record<string, never>, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      return r;
    },
    onSuccess: (r) => qc.setQueryData(["reglages", userId], r),
  });

  const majReglages = useCallback(
    (partiel: Partial<Reglages>) => {
      const actuel = reglages.data ?? normaliserReglages(null);
      enregistrerReglages.mutate(normaliserReglages({ ...actuel, ...partiel }));
    },
    [reglages.data, enregistrerReglages],
  );

  return useMemo(
    () => ({
      etat: cartes.data ?? {},
      reglages: reglages.data ?? normaliserReglages(null),
      journal: journal.data ?? [],
      chargement: cartes.isLoading || reglages.isLoading,
      noter,
      majReglages,
    }),
    [cartes.data, cartes.isLoading, reglages.data, reglages.isLoading, journal.data, noter, majReglages],
  );
}
