import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("✖ SUPABASE_URL o SUPABASE_ANON_KEY mancanti in .env.scripts.local");
  process.exit(1);
}

const FN_URL = `${SUPABASE_URL}/functions/v1/delete-media`;

async function callFn({ token, body }) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function getUserToken(email, password) {
  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login fallito per ${email}: ${error.message}`);
  return data.session.access_token;
}

function report(name, expected, result) {
  const matchStatus = result.status === expected.status;
  const bodyMatches = expected.contains
    ? JSON.stringify(result.body).includes(expected.contains)
    : true;
  const ok = matchStatus && bodyMatches;
  console.log(`${ok ? "✓" : "✖"} ${name}`);
  console.log(`    status: ${result.status} (atteso ${expected.status})`);
  console.log(`    body  : ${JSON.stringify(result.body)}`);
  if (expected.contains && !bodyMatches) {
    console.log(`    expected contains: "${expected.contains}"`);
  }
  return ok;
}

(async () => {
  console.log(`→ Test Edge Function: ${FN_URL}\n`);
  let allOk = true;

  // Test 1: no auth header
  const r1 = await callFn({ body: { public_id: "x" } });
  allOk = report("Test 1 — no Authorization → 401", {
    status: 401,
    contains: "missing token",
  }, r1) && allOk;

  // Test 2: invalid token
  const r2 = await callFn({
    token: "not.a.real.token",
    body: { public_id: "x" },
  });
  allOk = report("Test 2 — token invalido → 401", {
    status: 401,
    contains: "invalid token",
  }, r2) && allOk;

  // Test 3: token valido, body vuoto
  const marioToken = await getUserToken("mario@diario.internal", "mario2026");
  const r3 = await callFn({ token: marioToken, body: {} });
  allOk = report("Test 3 — token valido, body senza public_id → 400", {
    status: 400,
    contains: "public_id required",
  }, r3) && allOk;

  // Test 4: token valido, public_id inesistente su Cloudinary
  const r4 = await callFn({
    token: marioToken,
    body: { public_id: "test_nonexistent_abc123xyz", resource_type: "image" },
  });
  allOk = report("Test 4 — auth ok, cloudinary public_id inesistente → 200 ok:true", {
    status: 200,
    contains: "ok",
  }, r4) && allOk;
  // Cloudinary ritorna `{ result: "not found" }` su public_id inesistenti, è il comportamento corretto.

  console.log(`\n${allOk ? "✅ Tutti i test verdi" : "✖ Almeno un test è rosso"}`);
  process.exit(allOk ? 0 : 1);
})();
