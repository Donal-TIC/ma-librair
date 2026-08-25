"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { APP_ROLES, createUserSchema, type CreateUserFormValues } from "@/lib/validations/store-user";
import { createStaffUser } from "@/services/users.actions";

const ROLE_LABELS: Record<(typeof APP_ROLES)[number], string> = {
  manager: "Responsable / Manager",
  cashier: "Caissier",
  accountant: "Comptable",
  stock_manager: "Gestionnaire de stock",
  supervisor: "Superviseur",
};

export function CreateUserForm({ stores }: { stores: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<CreateUserFormValues>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    store_id: stores[0]?.id ?? "",
    role: "cashier",
  });

  function handleChange<K extends keyof CreateUserFormValues>(field: K, value: CreateUserFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createUserSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    startTransition(async () => {
      try {
        await createStaffUser(parsed.data);
        toast.success("Utilisateur créé");
        router.push("/responsable/utilisateurs");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Prénom *</label>
          <input
            value={values.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.first_name && <p className="mt-1 text-xs text-destructive">{errors.first_name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Nom *</label>
          <input
            value={values.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.last_name && <p className="mt-1 text-xs text-destructive">{errors.last_name}</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Email *</label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Téléphone</label>
        <input
          value={values.phone ?? ""}
          onChange={(e) => handleChange("phone", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Mot de passe temporaire *</label>
        <input
          type="password"
          value={values.password}
          onChange={(e) => handleChange("password", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
        <p className="mt-1 text-xs text-muted-foreground">L&rsquo;utilisateur pourra le changer via « mot de passe oublié ».</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Boutique *</label>
          <select
            value={values.store_id}
            onChange={(e) => handleChange("store_id", e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.store_id && <p className="mt-1 text-xs text-destructive">{errors.store_id}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Rôle *</label>
          <select
            value={values.role}
            onChange={(e) => handleChange("role", e.target.value as CreateUserFormValues["role"])}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {APP_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || stores.length === 0}
        className="w-full rounded-lg bg-katiola-green-600 px-4 py-2.5 font-medium text-white hover:bg-katiola-green-700 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Création..." : "Créer l'utilisateur"}
      </button>
      {stores.length === 0 && (
        <p className="text-sm text-destructive">Créez d&rsquo;abord une boutique avant d&rsquo;ajouter du personnel.</p>
      )}
    </form>
  );
}
