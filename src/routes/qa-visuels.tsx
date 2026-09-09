import { createFileRoute } from "@tanstack/react-router";
import { CORPUS } from "@/lib/ingego/corpus";
import { Exercice } from "@/components/ingego/exercice";

const IDS = [
  "pm-01",
  "fa-01",
  "ep-01",
  "ch-01",
  "ch-02",
  "pa-01",
  "pa-02",
  "cs-01",
  "sy-01",
  "rd-01",
  "cy-01",
  "ec-01",
  "gr-01",
  "cm-01",
  "pl-01",
  "co-01",
  "og-01",
  "ca-01",
  "n1-01",
  "n1-02",
  "n1-03",
  "n1-18",
  "n1-42",
];

export const Route = createFileRoute("/qa-visuels")({
  component: Page,
  head: () => ({ meta: [{ title: "QA visuels" }] }),
});

function Page() {
  const qs = CORPUS.filter((q) => IDS.includes(q.id));
  return (
    <div className="mx-auto max-w-md space-y-8 p-4">
      {qs.map((q) => (
        <section key={q.id} data-qid={q.id} className="rounded-2xl border border-border p-3">
          <p className="mb-2 text-xs text-muted-foreground">{q.id}</p>
          <Exercice q={q} numero={1} total={IDS.length} onNote={() => {}} />
        </section>
      ))}
    </div>
  );
}
