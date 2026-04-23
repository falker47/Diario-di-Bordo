import { supabase } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callFn<T>(name: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessione scaduta. Effettua di nuovo l'accesso.");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  let payload: { error?: string; ok?: boolean; [k: string]: unknown } = {};
  try {
    payload = await res.json();
  } catch {
    // noop
  }

  if (!res.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : `Errore del server (HTTP ${res.status}).`;
    throw new Error(message);
  }

  return payload as T;
}

export type CreatedUser = {
  ok: true;
  user: { id: string; username: string; full_name: string; is_active: boolean };
};

export function createUserFn(input: {
  username: string;
  first_name: string;
  last_name: string;
  password: string;
}) {
  return callFn<CreatedUser>("create-user", input);
}

export function updateUserFn(input: {
  id: string;
  username?: string;
  full_name?: string;
  password?: string;
}) {
  return callFn<{ ok: true; id: string }>("update-user", input);
}

export function deactivateUserFn(id: string) {
  return callFn<{ ok: true; id: string }>("deactivate-user", { id });
}

export function reactivateUserFn(id: string) {
  return callFn<{ ok: true; id: string }>("reactivate-user", { id });
}
