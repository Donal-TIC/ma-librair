import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-katiola-green-50 to-white dark:from-katiola-green-900 dark:to-background px-6">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-katiola-green-600 text-white font-display text-2xl font-bold shadow-lg shadow-katiola-green-600/20">
          LK
        </div>

        <h1 className="font-display text-2xl font-bold text-katiola-green-800 dark:text-katiola-green-200 sm:text-3xl">
          La librairie de Katiola
        </h1>
        <p className="mt-2 text-muted-foreground">
          Votre gestion de librairie, simple, rapide et professionnelle.
        </p>

        <p className="mt-10 text-sm font-medium text-muted-foreground">
          Comment souhaitez-vous accéder à l&rsquo;application ?
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Link
            href="/login/responsable"
            className="group flex items-center justify-center gap-3 rounded-xl bg-katiola-green-600 px-6 py-4 font-medium text-white shadow-sm transition hover:bg-katiola-green-700 active:scale-[0.99]"
          >
            <span className="text-xl">👨‍💼</span>
            Responsable
          </Link>

          <Link
            href="/login/caissier"
            className="group flex items-center justify-center gap-3 rounded-xl border-2 border-katiola-blue-500 bg-white px-6 py-4 font-medium text-katiola-blue-700 shadow-sm transition hover:bg-katiola-blue-50 active:scale-[0.99] dark:bg-transparent dark:text-katiola-blue-300"
          >
            <span className="text-xl">🧾</span>
            Caissier
          </Link>
        </div>
      </div>
    </main>
  );
}
