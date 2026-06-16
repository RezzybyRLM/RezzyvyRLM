-- An "admin group" is any group_conversation named 'admin group'. Its membership
-- must mirror admin accounts (users.role in admin/super_admin): admins in, others out.

create or replace function public.is_admin_account(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = uid and u.role in ('admin','super_admin'));
$$;

create or replace function public.is_admin_group(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_conversations gc where gc.id = conv and lower(gc.name) = 'admin group');
$$;

-- 1) One-time reconcile: kick non-admins out of admin groups, add every admin account.
delete from public.group_members gm
where public.is_admin_group(gm.conversation_id)
  and not public.is_admin_account(gm.user_id);

insert into public.group_members (conversation_id, user_id, role)
select gc.id, u.id, 'admin'
from public.group_conversations gc
cross join public.users u
where lower(gc.name) = 'admin group'
  and u.role in ('admin','super_admin')
  and not exists (select 1 from public.group_members gm where gm.conversation_id = gc.id and gm.user_id = u.id);

-- 2) Block any future attempt to add a non-admin to an admin group.
create or replace function public.enforce_admin_group_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin_group(NEW.conversation_id) and not public.is_admin_account(NEW.user_id) then
    raise exception 'Only admin accounts can belong to the admin group';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_admin_group_member on public.group_members;
create trigger trg_enforce_admin_group_member
  before insert or update on public.group_members
  for each row execute function public.enforce_admin_group_member();

-- 3) Keep admin groups in sync when an account's role changes.
create or replace function public.sync_admin_groups_on_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.role is distinct from OLD.role then
    if NEW.role in ('admin','super_admin') then
      insert into public.group_members (conversation_id, user_id, role)
      select gc.id, NEW.id, 'admin'
      from public.group_conversations gc
      where lower(gc.name) = 'admin group'
        and not exists (select 1 from public.group_members gm where gm.conversation_id = gc.id and gm.user_id = NEW.id);
    else
      delete from public.group_members gm
      where public.is_admin_group(gm.conversation_id) and gm.user_id = NEW.id;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_admin_groups on public.users;
create trigger trg_sync_admin_groups
  after update of role on public.users
  for each row execute function public.sync_admin_groups_on_role_change();
