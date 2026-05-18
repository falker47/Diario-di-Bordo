import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { AdminShell } from "@/components/AdminShell";
import {
  ContributionEditor,
  type EditorSubmit,
} from "@/components/ContributionEditor";
import { isValidISODate, todayISO } from "@/lib/dates";

export default function NewContributionPage() {
  const { user, isSuperadmin } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { push } = useToast();

  if (isSuperadmin) {
    return (
      <AdminShell>
        <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          L'account amministratore non può creare contributi. Usa un account utente.
        </p>
      </AdminShell>
    );
  }

  const queryDate = params.get("date") ?? "";
  const initialDate = isValidISODate(queryDate) ? queryDate : todayISO();

  async function handleSubmit(data: EditorSubmit) {
    if (!user) throw new Error("Sessione mancante.");
    const { error } = await supabase.from("contributions").insert({
      diary_date: data.diary_date,
      section: data.section,
      title: data.title,
      text_content: data.text_content,
      media: data.media,
      author_id: user.id,
    });
    if (error) throw new Error(error.message);
    push("Contributo pubblicato.", "success");
    navigate("/admin");
  }

  return (
    <AdminShell>
      <h1 className="mb-4 text-xl font-semibold text-primary">Nuovo contributo</h1>
      <ContributionEditor
        initial={{
          diary_date: initialDate,
          section: "quotidiani",
          title: "",
          text_content: "",
          media: [],
        }}
        submitLabel="Pubblica"
        cancelTo="/admin"
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}
