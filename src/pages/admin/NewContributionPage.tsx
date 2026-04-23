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
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
      text_content: data.text_content,
      media: data.media,
      author_id: user.id,
    });
    if (error) throw new Error(error.message);
    push("Contributo pubblicato.", "success");
    navigate(`/giorno/${data.diary_date}`);
  }

  return (
    <AdminShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Nuovo contributo</h1>
      <ContributionEditor
        initial={{
          diary_date: initialDate,
          section: "quotidiani",
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
