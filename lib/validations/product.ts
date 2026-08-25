import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(200),
  isbn: z.string().max(20).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  internal_ref: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  author_id: z.string().uuid().optional().nullable(),
  publisher_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  purchase_price: z.coerce.number().min(0, "Le prix d'achat ne peut pas être négatif"),
  sale_price: z.coerce.number().min(0, "Le prix de vente ne peut pas être négatif"),
  promo_price: z.coerce.number().min(0).optional().nullable(),
  vat_rate: z.coerce.number().min(0).max(100).default(0),
  unit: z.string().min(1).default("unité"),
  default_location: z.string().max(100).optional().nullable(),
}).refine((data) => !data.promo_price || data.promo_price <= data.sale_price, {
  message: "Le prix promotionnel ne peut pas dépasser le prix de vente",
  path: ["promo_price"],
});

export type ProductFormValues = z.infer<typeof productSchema>;
