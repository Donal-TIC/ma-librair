-- =====================================================================
-- 0008_rls_helpers.sql — fonctions utilisées par les policies RLS
-- Toutes en SECURITY DEFINER + search_path fixé pour éviter les fuites
-- =====================================================================

-- L'utilisateur courant est-il owner (accès complet, toutes boutiques) ?
create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_owner = true
  );
$$;

-- Liste des boutiques auxquelles l'utilisateur courant a accès
create or replace function public.user_store_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select store_id from public.store_users where user_id = auth.uid()
  union
  select id from public.stores where public.is_owner();
$$;

-- L'utilisateur courant a-t-il accès à cette boutique précise ?
create or replace function public.has_store_access(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_owner() or exists (
    select 1 from public.store_users where user_id = auth.uid() and store_id = p_store_id
  );
$$;

-- Rôle(s) applicatif(s) de l'utilisateur courant sur une boutique donnée
create or replace function public.user_role_in_store(p_store_id uuid)
returns app_role
language sql stable security definer set search_path = public
as $$
  select role from public.store_users
   where user_id = auth.uid() and store_id = p_store_id
   limit 1;
$$;

-- Vérifie qu'une permission précise est accordée à l'utilisateur pour une boutique
-- (owner = toujours vrai ; sinon on regarde role_permissions pour le rôle de l'utilisateur dans cette boutique)
create or replace function public.has_permission(p_store_id uuid, p_permission_key text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_owner() or exists (
    select 1
      from public.store_users su
      join public.role_permissions rp on rp.role = su.role
     where su.user_id = auth.uid()
       and su.store_id = p_store_id
       and rp.permission_key = p_permission_key
  );
$$;
