// Edge Function: update-user
// Aggiorna campi opzionali di un utente: username, full_name, password.
// Il cambio username aggiorna anche l'email sintetica in auth.users.
// Solo superadmin.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const USERNAME_EMAIL_DOMAIN = "@diario.internal";
const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function auditLog(op: string, actor: string, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      op,
      actor,
      ts: new Date().toISOString(),
      ...payload,
    }),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const SUPERADMIN_EMAIL = Deno.env.get("SUPERADMIN_EMAIL");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPERADMIN_EMAIL) {
    return jsonResponse(
      { error: "Configurazione server incompleta (env mancanti)." },
      500,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Autenticazione richiesta." }, 401);
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: userData, error: authError } = await sb.auth.getUser(token);
  if (authError || !userData.user) {
    return jsonResponse({ error: "Token non valido." }, 401);
  }
  const actorEmail = userData.user.email ?? "";
  if (actorEmail !== SUPERADMIN_EMAIL) {
    return jsonResponse({ error: "Accesso riservato all'amministrazione." }, 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo richiesta non valido." }, 400);
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return jsonResponse({ error: "ID utente obbligatorio." }, 400);

  const rawUsername = body.username;
  const rawFullName = body.full_name;
  const rawPassword = body.password;

  const usernameUpdate = typeof rawUsername === "string";
  const fullNameUpdate = typeof rawFullName === "string";
  const passwordUpdate = typeof rawPassword === "string";

  if (!usernameUpdate && !fullNameUpdate && !passwordUpdate) {
    return jsonResponse({ error: "Nessun campo da aggiornare." }, 400);
  }

  let newUsername: string | null = null;
  let newFullName: string | null = null;
  let newPassword: string | null = null;

  if (usernameUpdate) {
    // Strict: la regex rifiuta maiuscole. La UI fa auto-lowercase per UX.
    newUsername = rawUsername.trim();
    if (!USERNAME_RE.test(newUsername)) {
      return jsonResponse(
        {
          error: "Username non valido. Usa 3-30 caratteri: lettere minuscole, numeri, underscore, punto.",
        },
        400,
      );
    }
    const { data: exists, error: err } = await sb
      .from("profiles")
      .select("id")
      .eq("username", newUsername)
      .neq("id", id)
      .maybeSingle();
    if (err) return jsonResponse({ error: `Errore DB: ${err.message}` }, 500);
    if (exists) return jsonResponse({ error: "Username già esistente." }, 409);
  }

  if (fullNameUpdate) {
    newFullName = rawFullName.trim();
    if (!newFullName) {
      return jsonResponse({ error: "Nome e cognome obbligatori." }, 400);
    }
    const { data: exists, error: err } = await sb
      .from("profiles")
      .select("id")
      .ilike("full_name", escapeLike(newFullName))
      .neq("id", id)
      .maybeSingle();
    if (err) return jsonResponse({ error: `Errore DB: ${err.message}` }, 500);
    if (exists) return jsonResponse({ error: "Nome e cognome già presenti." }, 409);
  }

  if (passwordUpdate) {
    newPassword = rawPassword;
    if (newPassword.length < 8) {
      return jsonResponse({ error: "Password troppo corta (minimo 8 caratteri)." }, 400);
    }
  }

  // Applica update auth.users (email e/o password)
  const authPatch: Record<string, string> = {};
  if (newUsername) authPatch.email = `${newUsername}${USERNAME_EMAIL_DOMAIN}`;
  if (newPassword) authPatch.password = newPassword;
  if (Object.keys(authPatch).length > 0) {
    const { error: authUpdateErr } = await sb.auth.admin.updateUserById(id, authPatch);
    if (authUpdateErr) {
      return jsonResponse(
        { error: `Aggiornamento auth fallito: ${authUpdateErr.message}.` },
        500,
      );
    }
  }

  // Applica update profile
  const profilePatch: Record<string, unknown> = {};
  if (newUsername) profilePatch.username = newUsername;
  if (newFullName) profilePatch.full_name = newFullName;
  if (Object.keys(profilePatch).length > 0) {
    const { error: profileUpdateErr } = await sb
      .from("profiles")
      .update(profilePatch)
      .eq("id", id);
    if (profileUpdateErr) {
      return jsonResponse(
        { error: `Aggiornamento profilo fallito: ${profileUpdateErr.message}.` },
        500,
      );
    }
  }

  auditLog("update-user", actorEmail, {
    targetId: id,
    fields: [
      usernameUpdate ? "username" : null,
      fullNameUpdate ? "full_name" : null,
      passwordUpdate ? "password" : null,
    ].filter(Boolean),
  });

  return jsonResponse({ ok: true, id });
});
