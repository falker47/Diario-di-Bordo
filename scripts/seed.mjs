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
const TEST_PASSWORD = "mario2026";
const TEST_USERNAME = "mario";
const TEST_FULL_NAME = "Mario Rossi";

const CONTRIBUTIONS = [
  {
    diary_date: "2026-04-23",
    section: "quotidiani",
    text_content:
      "Mattinata in giardino: i ragazzi hanno preparato l'aiuola per la semina. Luca particolarmente concentrato sui semi di basilico, voleva sapere il nome di ogni pianta.",
  },
  {
    diary_date: "2026-04-23",
    section: "speciali",
    text_content:
      "Festa di compleanno di Anna nel pomeriggio. Torta condivisa, canzoni, e un piccolo spettacolino preparato da Marta e Sofia. Atmosfera ottima.",
  },
  {
    diary_date: "2026-04-22",
    section: "rilancio",
    text_content:
      "Per domani: continuare il progetto orto e raccogliere idee per la gita di maggio. Sentire i genitori entro venerdì per i consensi.",
  },
  {
    diary_date: "2026-04-16",
    section: "quotidiani",
    text_content:
      "Laboratorio di pittura su tela. Tema proposto: 'la mia casa'. Ottima partecipazione anche da parte di chi di solito è più riservato.",
  },
  {
    diary_date: "2026-03-23",
    section: "speciali",
    text_content:
      "Uscita al parco regionale: pic-nic e camminata lungo il sentiero blu. Il gruppo è arrivato fino al punto panoramico, nessun problema di gestione.",
  },
  {
    diary_date: "2026-01-15",
    section: "quotidiani",
    text_content:
      "Riunione di programmazione del trimestre. Decise tre nuove attività ricorrenti: cucina del giovedì, lettura ad alta voce, uscita mensile al museo.",
  },
];

async function findUserByEmail(email) {
  let page = 1;
  // listUsers è paginato; per pochi utenti basta un paio di iterazioni
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

async function ensureUser() {
  const existing = await findUserByEmail(TEST_EMAIL);
  if (existing) {
    console.log(`• Utente già presente in auth.users (id=${existing.id})`);
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`✓ Creato utente auth ${TEST_EMAIL} (id=${data.user.id})`);
  return data.user.id;
}

async function ensureProfile(id) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id,
        username: TEST_USERNAME,
        full_name: TEST_FULL_NAME,
        is_active: true,
      },
      { onConflict: "id" },
    );
  if (error) throw error;
  console.log(`✓ Upsert profilo (${TEST_USERNAME} / ${TEST_FULL_NAME})`);
}

async function clearContributions(authorId) {
  const { data, error } = await supabase
    .from("contributions")
    .delete()
    .eq("author_id", authorId)
    .select("id");
  if (error) throw error;
  console.log(`• Rimossi ${data?.length ?? 0} contributi pre-esistenti`);
}

async function insertContributions(authorId) {
  const rows = CONTRIBUTIONS.map((c) => ({ ...c, author_id: authorId }));
  const { data, error } = await supabase
    .from("contributions")
    .insert(rows)
    .select("id, diary_date, section");
  if (error) throw error;
  console.log(`✓ Inseriti ${data.length} contributi:`);
  for (const r of data) {
    console.log(`    ${r.diary_date}  [${r.section}]`);
  }
}

(async () => {
  console.log("→ Seed Diario di Bordo\n");
  try {
    const userId = await ensureUser();
    await ensureProfile(userId);
    await clearContributions(userId);
    await insertContributions(userId);
    console.log("\n✅ Seed completato.");
    console.log("\nCredenziali utente di test (Fase 3 / login):");
    console.log(`  username : ${TEST_USERNAME}`);
    console.log(`  password : ${TEST_PASSWORD}`);
    console.log("\nPer rimuovere tutto: npm run seed:down\n");
  } catch (err) {
    console.error("\n✖ Seed fallito:", err?.message ?? err);
    process.exit(1);
  }
})();
