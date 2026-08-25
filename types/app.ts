export type AppRole =
  | "owner"
  | "manager"
  | "cashier"
  | "accountant"
  | "stock_manager"
  | "supervisor";

export type PermissionKey =
  | "products.view" | "products.create" | "products.update" | "products.delete"
  | "stock.view" | "stock.manage"
  | "sales.view" | "sales.create" | "sales.cancel"
  | "returns.create" | "returns.view"
  | "cash.open" | "cash.close" | "cash.view"
  | "users.create" | "users.update" | "users.disable"
  | "stores.create" | "stores.update"
  | "reports.view"
  | "expenses.create"
  | "settings.manage";

export interface StoreSummary {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export interface CurrentUserContext {
  userId: string;
  isOwner: boolean;
  firstName: string;
  lastName: string;
  /** Boutiques auxquelles l'utilisateur a accès, avec son rôle dans chacune */
  stores: Array<{ storeId: string; storeName: string; role: AppRole }>;
}
