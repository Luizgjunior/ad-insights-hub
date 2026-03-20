
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'admin_gestor')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.check_account_limit(p_gestor_id uuid)
returns boolean as $$
declare
  v_plan text;
  v_count int;
  v_limit int;
begin
  select plan into v_plan from public.profiles where id = p_gestor_id;
  select count(*) into v_count from public.meta_accounts
    where gestor_id = p_gestor_id and is_active = true;
  v_limit := case v_plan
    when 'starter' then 3
    when 'pro' then 10
    when 'agency' then 999
    else 1
  end;
  return v_count < v_limit;
end;
$$ language plpgsql security definer set search_path = public;
