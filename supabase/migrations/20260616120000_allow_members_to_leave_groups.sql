-- Allow a user to remove (delete) their own group_members row = "leave group".
-- Previously only admins/creators could DELETE rows, so a normal member's
-- "Leave group" was silently blocked by RLS and the group lingered in their list.
create policy "Users can leave groups"
  on public.group_members
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Emit the full old row (incl. conversation_id) on realtime DELETE so the client
-- can drop the conversation from the sidebar instantly when a member leaves /
-- is removed.
alter table public.group_members replica identity full;
