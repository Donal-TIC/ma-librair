-- =====================================================================
-- seed.sql — données de démonstration minimales (optionnel)
-- N'insère jamais de secrets ni de vrais comptes utilisateurs.
-- Créez le premier propriétaire via le script décrit dans le README
-- (Supabase Auth ne peut pas être seedé par simple SQL de façon fiable).
-- =====================================================================

insert into public.categories (name) values
  ('Romans'), ('Scolaire'), ('Parascolaire'), ('Littérature'),
  ('Jeunesse'), ('Religion'), ('Développement personnel'),
  ('Bureautique'), ('Fournitures scolaires'), ('Papeterie')
on conflict do nothing;

insert into public.customers (first_name, last_name, is_walk_in) values
  ('Client', 'Comptoir', true)
on conflict do nothing;

-- Après avoir créé votre boutique principale et votre première caisse
-- via l'interface (Responsable > Boutiques / Paramètres), ce seed
-- n'a plus besoin d'être ré-exécuté.
