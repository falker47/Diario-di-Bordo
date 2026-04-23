// Edge Function: create-user
// Crea auth.users (email sintetica {username}@diario.internal) + profilo.
// Solo superadmin. In caso di fallimento sul profilo, rollback dell'auth user.

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
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

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

  // NB: validazione strict. Non normalizziamo a lowercase server-side:
  // la regex rifiuta maiuscole. La UI lato client farà auto-lowercase per UX.
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const firstName = typeof body.first_name === "string" ? body.first_name.trim() : "";
  const lastName = typeof body.last_name === "string" ? body.last_name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_RE.test(username)) {
    return jsonResponse(
      {
        error:
          "Username non valido. Usa 3-20 caratteri: lettere minuscole, numeri, underscore.",
      },
      400,
    );
  }
  if (password.length < 8) {
    return jsonResponse({ error: "Password troppo corta (minimo 8 caratteri)." }, 400);
  }
  if (!firstName || !lastName) {
    return jsonResponse({ error: "Nome e cognome obbligatori." }, 400);
  }

  const fullName = `${firstName} ${lastName}`;

  // Duplicato username
  const { data: usernameExists, error: usernameErr } = await sb
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (usernameErr) {
    return jsonResponse({ error: `Errore DB: ${usernameErr.message}` }, 500);
  }
  if (usernameExists) {
    return jsonResponse({ error: "Username già esistente." }, 409);
  }

  // Duplicato full_name (case-insensitive)
  const { data: fullNameExists, error: fullNameErr } = await sb
    .from("profiles")
    .select("id")
    .ilike("full_name", escapeLike(fullName))
    .maybeSingle();
  if (fullNameErr) {
    return jsonResponse({ error: `Errore DB: ${fullNameErr.message}` }, 500);
  }
  if (fullNameExists) {
    return jsonResponse({ error: "Nome e cognome già presenti." }, 409);
  }

  const email = `${username}${USERNAME_EMAIL_DOMAIN}`;

  // Step 1: crea auth user
  const { data: authCreated, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !authCreated.user) {
    return jsonResponse(
      {
        error: `Creazione utente fallita: ${createErr?.message ?? "errore sconosciuto"}.`,
      },
      500,
    );
  }
  const userId = authCreated.user.id;

  // Step 2: crea profilo (rollback auth user se fallisce)
  const { error: profileErr } = await sb.from("profiles").insert({
    id: userId,
    username,
    full_name: fullName,
    is_active: true,
  });
  if (profileErr) {
    await sb.auth.admin.deleteUser(userId).catch(() => {
      // Loggiamo ma non blocchiamo la risposta d'errore originale.
      console.error(
        JSON.stringify({
          op: "create-user.rollback-failed",
          userId,
          reason: "auth.deleteUser failed during rollback",
        }),
      );
    });
    return jsonResponse(
      { error: `Creazione profilo fallita: ${profileErr.message}.` },
      500,
    );
  }

  auditLog("create-user", actorEmail, { userId, username, fullName });

  return jsonResponse({
    ok: true,
    user: { id: userId, username, full_name: fullName, is_active: true },
  });
});
