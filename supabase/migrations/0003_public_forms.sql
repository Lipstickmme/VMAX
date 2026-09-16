-- ---------------------------------------------------------------------------
-- 0003: let a form file its own record, the way a chat message already does.
--
-- Until now the only way an enquiry or an application could reach the database
-- was through the API using the service-role key. That is one key, held in one
-- place, and when it is missing or wrong from the deployment the server quietly
-- falls back to a local JSON file: on Vercel that file does not survive the
-- request, so the visitor is thanked and nothing ever reaches /admin. Live chat
-- never had the problem, because the visitor writes their own rows under row
-- level security with the public browser key.
--
-- This gives the two forms the same footing. Anyone may INSERT a new row and
-- nothing else: reading and triaging stay admin-only, exactly as before, so a
-- stranger can leave an enquiry but can never see one. The service-role path is
-- unchanged and still preferred; this is what catches it when that path is not
-- available.
--
-- One trade-off worth knowing: an insert policy open to `anon` means a row can
-- be posted straight at PostgREST, past the API's rate limiter. Reading is
-- still closed, so this is a spam risk and not a disclosure one. To tighten it,
-- change `to anon, authenticated` to `to authenticated` on both policies: the
-- page then has to sign in anonymously first, exactly as the chat widget does,
-- which means anonymous sign-ins must be enabled on the project.
--
-- Safe to run more than once, and safe to run on a database created from
-- 0001_init.sql alone.
-- ---------------------------------------------------------------------------

-- Enquiries ------------------------------------------------------------------

drop policy if exists "anyone files an enquiry" on public.enquiries;
create policy "anyone files an enquiry"
  on public.enquiries for insert to anon, authenticated
  -- A new row is a new row. Nobody gets to file one that is already closed,
  -- or to arrive with the desk's own notes attached.
  with check (status = 'new' and notes is null);

-- Applications ---------------------------------------------------------------

drop policy if exists "anyone files an application" on public.applications;
create policy "anyone files an application"
  on public.applications for insert to anon, authenticated
  with check (status = 'new' and notes is null);

-- Confirm it took. Four rows: read and update for the desk, insert for the
-- form, on each of the two tables.
select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public'
   and tablename in ('enquiries', 'applications')
 order by tablename, cmd, policyname;
