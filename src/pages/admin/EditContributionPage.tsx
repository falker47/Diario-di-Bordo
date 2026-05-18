import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { AdminShell } from "@/components/AdminShell";
import {
  ContributionEditor,
  type EditorSubmit,
} from "@/components/ContributionEditor";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorBox } from "@/components/ui/ErrorBox";
import type { ContributionWithAuthor } from "@/types";

export default function EditContributionPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/admin" replace />;
  return <EditContributionInner contributionId={id} />;
}

function EditContributionInner({ contributionId }: { contributionId: string }) {
  const { user, isSuperadmin } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const [contribution, setContribution] =
    useState<ContributionWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const id = contributionId;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error: err } = await supabase
        .from("contributions")
        .select("*, author:profiles(username, full_name, is_active)")
        .eq("id", id)
        .maybeSingle()
        .returns<ContributionWithAuthor>();
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError("Contributo non trovato.");
        setLoading(false);
        return;
      }
      setContribution(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <AdminShell>
        <Spinner />
      </AdminShell>
    );
  }
  if (error) {
    return (
      <AdminShell>
        <ErrorBox message={error} />
      </AdminShell>
    );
  }
  if (!contribution) return null;

  if (!isSuperadmin && contribution.author_id !== user?.id) {
    return (
      <AdminShell>
        <ErrorBox message="Non puoi modificare questo contributo." />
      </AdminShell>
    );
  }

  const cancelTo = isSuperadmin
    ? "/superadmin/posts"
    : `/giorno/${contribution.diary_date}`;
  const superadminEditingOthers =
    isSuperadmin && contribution.author_id !== user?.id;

  async function handleSubmit(data: EditorSubmit) {
    const { error: err } = await supabase
      .from("contributions")
      .update({
        diary_date: data.diary_date,
        section: data.section,
        title: data.title,
        text_content: data.text_content,
        media: data.media,
      })
      .eq("id", id);
    if (err) throw new Error(err.message);
    push("Modifiche salvate.", "success");
    navigate(isSuperadmin ? "/superadmin/posts" : `/giorno/${data.diary_date}`);
  }

  return (
    <AdminShell>
      <h1 className="mb-4 text-xl font-semibold text-primary">Modifica contributo</h1>

      {superadminEditingOthers && (
        <div className="mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          Stai modificando come amministrazione il contributo di{" "}
          <strong>{contribution.author?.full_name ?? "autore sconosciuto"}</strong>.
          Le modifiche saranno tracciate come "modifica" (data visibile
          pubblicamente, non chi ha modificato).
        </div>
      )}

      <ContributionEditor
        initial={{
          diary_date: contribution.diary_date,
          section: contribution.section,
          title: contribution.title ?? "",
          text_content: contribution.text_content ?? "",
          media: contribution.media ?? [],
        }}
        submitLabel="Salva modifiche"
        cancelTo={cancelTo}
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}
