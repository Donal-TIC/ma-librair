// Génère un code-barre unique et lisible pour un nouvel article.
// Format : LIB-000001, LIB-000002, ... (basé sur un compteur horodaté simple ici ;
// en production, on utilisera la séquence Postgres `article_code_seq` créée dans schema.sql
// via une fonction RPC Supabase pour garantir l'unicité même hors-ligne).
export function genererCodeBarre(compteur: number): string {
  return `LIB-${String(compteur).padStart(6, '0')}`
}

// Composant à utiliser dans la page "Articles" pour afficher/imprimer le code-barre.
// Utilisation : <BarcodeImage value={article.code_barre} />
// (fichier .tsx séparé requis pour le JSX, voir components/BarcodeImage.tsx)
