"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { storeSchema, type StoreFormValues } from "@/lib/validations/store-user";
import { createStore, updateStore } from "@/services/stores.actions";

export function StoreForm({
  storeId,
  defaultValues,
}: {
  storeId?: string;
  defaultValues?: Partial<StoreFormValues>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<StoreFormValues>({
    name: defaultValues?.name ?? "",
    code: defaultValues?.code ?? "",
    address: defaultValues?.address ?? "",
    phone: defaultValues?.phone ?? "",
    email: defaultValues?.email ?? "",
    opening_hours: defaultValues?.opening_hours ?? "",
  });

  function handleChange(field: keyof StoreFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = storeSchema.safeParse(values);
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
        if (storeId) {
          await updateStore(storeId, parsed.data);
          toast.success("Boutique modifiée");
        } else {
          await createStore(parsed.data);
          toast.success("Boutique créée");
        }
        router.push("/responsable/boutiques");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  }

  const fields: Array<{ key: keyof StoreFormValues; label: string; placeholder: string; required?: boolean }> = [
    { key: "name", label: "Nom de la boutique", placeholder: "Boutique Katiola Centre", required: true },
    { key: "code", label: "Code", placeholder: "KAT-CENTRE", required: true },
    { key: "address", label: "Adresse", placeholder: "Quartier commercial, Katiola" },
    { key: "phone", label: "Téléphone", placeholder: "+225 07 00 00 00 00" },
    { key: "email", label: "Email", placeholder: "boutique@librairiekatiola.ci" },
    { key: "opening_hours", label: "Horaires", placeholder: "Lun-Sam 8h-19h" },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className="text-sm font-medium">
            {f.label} {f.required && <span className="text-destructive">*</span>}
          </label>
          <input
            id={f.key}
            value={values[f.key] ?? ""}
            onChange={(e) => handleChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors[f.key] && <p className="mt-1 text-xs text-destructive">{errors[f.key]}</p>}
        </div>
      ))}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-katiola-green-600 px-4 py-2.5 font-medium text-white hover:bg-katiola-green-700 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Enregistrement..." : storeId ? "Enregistrer les modifications" : "Créer la boutique"}
      </button>
    </form>
  );
}
