-- Security Fix: Explicitly revoke permissions from anon role on profiles table
-- This prevents any potential data harvesting even if RLS policies are misconfigured

-- Revoke all default permissions from anon and public roles
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Grant only necessary permissions to authenticated users
-- (RLS policies will still control which rows they can access)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure no DELETE permission is granted (users should not delete their profiles directly)
-- Profile deletion should cascade from auth.users deletion only