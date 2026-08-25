"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginResponsablePage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Identifiants incorrects. Vérifiez votre email et votre mot de passe.");
      setLoading(false);
      return;
    }

    router.push("/responsable");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-katiola-green-50 px-6 dark:bg-background">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm animate-slide-up">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Retour
        </Link>
        <h1 className="mt-4 font-display text-xl font-bold">Espace Responsable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez-vous pour accéder à la gestion complète.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="responsable@librairiekatiola.ci"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-katiola-green-600 px-4 py-2.5 font-medium text-white transition hover:bg-katiola-green-700 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <Link
            href="/login/responsable/mot-de-passe-oublie"
            className="block text-center text-sm text-katiola-blue-600 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </form>
      </div>
    </main>
  );
}
