import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? "admin@diario.internal";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

if (!SUPABASE_URL || !ANON_KEY || !SUPERADMIN_PASSWORD) {
  console.error(
    "✖ Variabili mancanti in .env.scripts.local:",
    "SUPABASE_URL, SUPABASE_ANON_KEY, SUPERADMIN_PASSWORD",
  );
  process.exit(1);
}

function usage() {
  console.log(`
Usage (via npm run test:users -- ...):

  --create username:FirstName:LastName:password
      Crea un nuovo utente. I 4 campi separati da ':'.

  --update <uuid> [--username new] [--full-name "New Name"] [--password newpass]
      Aggiorna uno o più campi dell'utente indicato.

  --deactivate <uuid>
      Disattiva un utente (ban auth + is_active=false).

  --reactivate <uuid>
      Riattiva un utente (unban auth + is_active=true).

Esempi:
  npm run test:users -- --create lucia:Lucia:Bianchi:passw0rd
  npm run test:users -- --update 123e4567-... --password nuovapassword
  npm run test:users -- --deactivate 123e4567-...
`);
}

function parseArgs() {
  const raw = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];
    switch (arg) {
      case "--create":
        parsed.op = "create";
        parsed.createSpec = raw[++i];
        break;
      case "--update":
        parsed.op = "update";
        parsed.id = raw[++i];
        break;
      case "--deactivate":
        parsed.op = "deactivate";
        parsed.id = raw[++i];
        break;
      case "--reactivate":
        parsed.op = "reactivate";
        parsed.id = raw[++i];
        break;
      case "--username":
        parsed.username = raw[++i];
        break;
      case "--full-name":
        parsed.full_name = raw[++i];
        break;
      case "--password":
        parsed.password = raw[++i];
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      default:
        console.warn(`⚠ Argomento sconosciuto ignorato: ${arg}`);
    }
  }
  return parsed;
}

async function getAdminToken() {
  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.signInWithPassword({
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
  });
  if (error) {
    throw new Error(`Login superadmin fallito: ${error.message}`);
  }
  return data.session.access_token;
}

async function callFn(name, body, token) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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

function printResult({ status, body }) {
  const marker = status >= 200 && status < 300 ? "✓" : "✖";
  console.log(`${marker} HTTP ${status}`);
  console.log(JSON.stringify(body, null, 2));
}

(async () => {
  const args = parseArgs();

  if (args.help || !args.op) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  let token;
  try {
    token = await getAdminToken();
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  }

  if (args.op === "create") {
    if (!args.createSpec) {
      console.error("✖ Manca specifica: username:First:Last:password");
      usage();
      process.exit(1);
    }
    const parts = args.createSpec.split(":");
    if (parts.length !== 4) {
      console.error(`✖ Formato atteso 4 campi ':', ricevuti ${parts.length}`);
      process.exit(1);
    }
    const [username, first_name, last_name, password] = parts;
    const payload = { username, first_name, last_name, password };
    console.log("→ create-user", { ...payload, password: "***" });
    printResult(await callFn("create-user", payload, token));
    return;
  }

  if (args.op === "update") {
    if (!args.id) {
      console.error("✖ Manca <uuid> per --update");
      usage();
      process.exit(1);
    }
    const payload = { id: args.id };
    if (args.username !== undefined) payload.username = args.username;
    if (args.full_name !== undefined) payload.full_name = args.full_name;
    if (args.password !== undefined) payload.password = args.password;
    if (Object.keys(payload).length === 1) {
      console.error(
        "✖ Nessun campo da aggiornare. Usa almeno uno tra --username --full-name --password.",
      );
      process.exit(1);
    }
    console.log("→ update-user", {
      ...payload,
      password: payload.password ? "***" : undefined,
    });
    printResult(await callFn("update-user", payload, token));
    return;
  }

  if (args.op === "deactivate" || args.op === "reactivate") {
    if (!args.id) {
      console.error(`✖ Manca <uuid> per --${args.op}`);
      usage();
      process.exit(1);
    }
    console.log(`→ ${args.op}-user`, { id: args.id });
    printResult(await callFn(`${args.op}-user`, { id: args.id }, token));
    return;
  }

  usage();
  process.exit(1);
})();
