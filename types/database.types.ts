/**
 * ⚠️ Placeholder. Une fois votre projet Supabase lié, régénérez ce fichier
 * automatiquement avec les vrais types depuis votre schéma :
 *
 *   npm run db:types
 *
 * (exécute `supabase gen types typescript --linked > types/database.types.ts`)
 *
 * En attendant, ce type générique évite de bloquer le build.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, never>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
  };
}
