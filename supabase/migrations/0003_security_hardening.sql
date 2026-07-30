-- Security hardening (addresses Supabase advisor warnings)

-- Tighten class_bookings UPDATE so the updated row must still belong to the
-- user (or their class), not just the pre-update row.
drop policy if exists "manage own class bookings" on public.class_bookings;
create policy "manage own class bookings" on public.class_bookings for update to authenticated
  using (client_id = auth.uid()
    or class_id in (select id from public.classes where trainer_id = auth.uid()))
  with check (client_id = auth.uid()
    or class_id in (select id from public.classes where trainer_id = auth.uid()));

-- Trigger + helper functions are not meant to be called directly over the API.
revoke execute on function public.notify(uuid, text, text, text, text) from anon, authenticated, public;
revoke execute on function public.on_message_created() from anon, authenticated, public;
revoke execute on function public.on_session_created() from anon, authenticated, public;
revoke execute on function public.on_assignment_created() from anon, authenticated, public;
revoke execute on function public.on_invoice_created() from anon, authenticated, public;
revoke execute on function public.on_session_completed() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
