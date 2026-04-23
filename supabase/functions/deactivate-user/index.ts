// Edge Function: deactivate-user
// Set profiles.is_active = false + ban auth user (~100 anni) per impedire login.
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

// ~100 anni — in pratica permanente. Rimosso da reactivate-user.
const BAN_DURATION = "876000h";

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

  // Ban auth user
  const { error: banErr } = await sb.auth.admin.updateUserById(id, {
    ban_duration: BAN_DURATION,
  });
  if (banErr) {
    return jsonResponse({ error: `Ban utente fallito: ${banErr.message}.` }, 500);
  }

  // Set profile inactive
  const { error: profileErr } = await sb
    .from("profiles")
    .update({ is_active: false })
    .eq("id", id);
  if (profileErr) {
    return jsonResponse(
      { error: `Aggiornamento profilo fallito: ${profileErr.message}.` },
      500,
    );
  }

  auditLog("deactivate-user", actorEmail, { targetId: id });
  return jsonResponse({ ok: true, id });
});
