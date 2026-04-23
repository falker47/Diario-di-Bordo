import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/hooks/useToast";
import { createUserFn, updateUserFn } from "@/lib/superadminFns";
import type { Profile } from "@/types";

type Mode = "create" | "update";

export function UserFormModal({
  mode,
  target,
  onClose,
  onSuccess,
}: {
  mode: Mode;
  target: Profile | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { push } = useToast();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "update" && target) {
      setUsername(target.username);
      setFullName(target.full_name);
      setFirstName("");
      setLastName("");
      setPassword("");
    } else {
      setUsername("");
      setFirstName("");
      setLastName("");
      setFullName("");
      setPassword("");
    }
    setFormError(null);
  }, [mode, target]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
    };
  }, [onClose, submitting]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (mode === "create") {
      if (!username.trim() || !firstName.trim() || !lastName.trim() || !password) {
        setFormError("Tutti i campi sono obbligatori.");
        return;
      }
      setSubmitting(true);
      try {
        await createUserFn({
          username: username.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
        });
        push("Utente creato.", "success");
        onSuccess();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore sconosciuto.";
        setFormError(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // update
    if (!target) return;
    const patch: {
      id: string;
      username?: string;
      full_name?: string;
      password?: string;
    } = { id: target.id };

    const trimmedUsername = username.trim();
    const trimmedFullName = fullName.trim();
    if (trimmedUsername && trimmedUsername !== target.username) {
      patch.username = trimmedUsername;
    }
    if (trimmedFullName && trimmedFullName !== target.full_name) {
      patch.full_name = trimmedFullName;
    }
    if (password) patch.password = password;

    if (Object.keys(patch).length === 1) {
      setFormError("Nessun campo modificato.");
      return;
    }

    setSubmitting(true);
    try {
      await updateUserFn(patch);
      push("Utente aggiornato.", "success");
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={() => !submitting && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="user-form-title" className="text-base font-semibold text-slate-900">
          {mode === "create" ? "Nuovo utente" : `Modifica ${target?.full_name ?? ""}`}
        </h2>

        <label className="block text-sm font-medium text-slate-700">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            pattern="[a-z0-9_]{3,20}"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="es. lucia"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <span className="mt-1 block text-xs text-slate-500">
            3-20 caratteri, lettere minuscole, numeri, underscore.
          </span>
        </label>

        {mode === "create" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-slate-700">
              Nome
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Cognome
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>
        ) : (
          <label className="block text-sm font-medium text-slate-700">
            Nome completo
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>
        )}

        <label className="block text-sm font-medium text-slate-700">
          {mode === "create" ? "Password" : "Nuova password (opzionale)"}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={mode === "update" ? "Lascia vuoto per non cambiare" : ""}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          {mode === "create" && (
            <span className="mt-1 block text-xs text-slate-500">Minimo 8 caratteri.</span>
          )}
        </label>

        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting
              ? "Attendere…"
              : mode === "create"
                ? "Crea utente"
                : "Salva modifiche"}
          </button>
        </div>
      </form>
    </div>
  );
}
