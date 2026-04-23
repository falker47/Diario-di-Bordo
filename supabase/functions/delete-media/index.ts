// Edge Function: delete-media
// Cancella un asset Cloudinary dato il suo public_id.
//
// Auth model (TRADE-OFF documentato):
//   Verifichiamo solo che il chiamante sia un utente autenticato (qualsiasi).
//   NON verifichiamo che sia l'autore del contributo che possiede questo media:
//   richiederebbe una query DB su `contributions` per ogni delete (overhead +
//   complicazione del payload, dovremmo passare anche contribution_id).
//   Per il contesto del progetto (~10 educatori, scenario non adversariale)
//   accettiamo che un utente loggato possa in teoria cancellare media altrui
//   tramite chiamata diretta all'API. Il frontend nasconde i pulsanti delete
//   per i contributi non propri (RLS impedisce comunque l'UPDATE/DELETE del
//   record contribution stesso).
//   Se il numero di utenti cresce o emergono incident, aggiungere check
//   granulare passando anche contribution_id e verificando l'ownership lato DB.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// --- CORS helpers (inlined per facilitare deploy via Dashboard UI) ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function preflight(): Response {
  return new Response("ok", { headers: corsHeaders });
}

// --- Env ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

function envCheck(): string | null {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!CLOUDINARY_CLOUD_NAME) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!CLOUDINARY_API_KEY) missing.push("CLOUDINARY_API_KEY");
  if (!CLOUDINARY_API_SECRET) missing.push("CLOUDINARY_API_SECRET");
  return missing.length ? `Missing env: ${missing.join(", ")}` : null;
}

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function destroyOnCloudinary(
  publicId: string,
  resourceType: "image" | "video",
): Promise<any> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = await sha1Hex(stringToSign);

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("api_key", CLOUDINARY_API_KEY!);
  formData.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`;
  const res = await fetch(url, { method: "POST", body: formData });
  const text = await res.text();
  if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const envError = envCheck();
  if (envError) return jsonResponse({ error: envError }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Unauthorized: missing token" }, 401);
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const sbAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error: authError } = await sbAdmin.auth.getUser(token);
  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized: invalid token" }, 401);
  }

  let body: { public_id?: unknown; resource_type?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const publicId = typeof body.public_id === "string" ? body.public_id.trim() : "";
  const resourceType: "image" | "video" =
    body.resource_type === "video" ? "video" : "image";

  if (!publicId) return jsonResponse({ error: "public_id required" }, 400);

  try {
    const result = await destroyOnCloudinary(publicId, resourceType);
    return jsonResponse({ ok: true, cloudinary: result });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
