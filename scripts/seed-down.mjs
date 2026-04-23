import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "✖ SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY mancanti. Carica .env.scripts.local con --env-file.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = "mario@diario.internal";

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

(async () => {
  console.log("→ Cleanup seed Diario di Bordo\n");
  try {
    const user = await findUserByEmail(TEST_EMAIL);
    if (!user) {
      console.log("• Nessun utente di test trovato. Niente da fare.");
      return;
    }

    const { data: contribs, error: contribErr } = await supabase
      .from("contributions")
      .delete()
      .eq("author_id", user.id)
      .select("id");
    if (contribErr) throw contribErr;
    console.log(`✓ Cancellati ${contribs?.length ?? 0} contributi`);

    // L'eliminazione dell'auth user fa cascade su profiles (FK on delete cascade).
    const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
    if (authErr) throw authErr;
    console.log(`✓ Cancellato utente auth ${TEST_EMAIL} (id=${user.id})`);
    console.log(`✓ Profilo cancellato in cascata`);

    console.log("\n✅ Cleanup completato.\n");
  } catch (err) {
    console.error("\n✖ Cleanup fallito:", err?.message ?? err);
    process.exit(1);
  }
})();
