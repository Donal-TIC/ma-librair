/**
 * Crée le tout premier compte "propriétaire" de la librairie.
 * À exécuter une seule fois, en local, jamais en production côté client.
 *
 * Usage :
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
 *   npx tsx scripts/create-owner.ts owner@exemple.com "MotDePasseSolide123!" "Prénom" "Nom"
 */
import { createClient } from "@supabase/supabase-js";

const [, , email, password, firstName, lastName] = process.argv;

if (!email || !password || !firstName || !lastName) {
  console.error("Usage: npx tsx scripts/create-owner.ts <email> <password> <prénom> <nom>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (error || !data.user) {
    console.error("Échec de la création du compte :", error?.message);
    process.exit(1);
  }

  // Le trigger handle_new_auth_user a déjà créé la ligne profiles ; on la marque owner.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_owner: true })
    .eq("id", data.user.id);

  if (updateError) {
    console.error("Compte créé mais échec du passage en owner :", updateError.message);
    process.exit(1);
  }

  console.log(`✅ Propriétaire créé : ${email} (${data.user.id})`);
}

main();
