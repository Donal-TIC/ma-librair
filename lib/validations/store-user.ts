import { z } from "zod";

export const storeSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(150),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères").max(20)
    .regex(/^[A-Z0-9-]+$/, "Utilisez uniquement des majuscules, chiffres et tirets"),
  address: z.string().max(300).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  opening_hours: z.string().max(200).optional().nullable(),
});

export type StoreFormValues = z.infer<typeof storeSchema>;

export const APP_ROLES = [
  "manager",
  "cashier",
  "accountant",
  "stock_manager",
  "supervisor",
] as const;

export const createUserSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis").max(100),
  last_name: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().max(30).optional().nullable(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  store_id: z.string().uuid("Sélectionnez une boutique"),
  role: z.enum(APP_ROLES),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
