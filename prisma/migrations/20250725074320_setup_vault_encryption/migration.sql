-- Consolidated Vault Setup for Production
-- Enables Supabase Vault for secure integration credential encryption

-- Enable the Vault extension
CREATE EXTENSION IF NOT EXISTS "supabase_vault";

-- Grant proper permissions to service role for vault access
GRANT USAGE ON SCHEMA vault TO service_role;
GRANT SELECT ON vault.decrypted_secrets TO service_role; 
GRANT INSERT ON vault.secrets TO service_role;

-- Create RPC function to create secrets (runs with elevated privileges)
CREATE OR REPLACE FUNCTION public.create_secret(
  new_secret TEXT,
  new_name TEXT DEFAULT NULL,
  new_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
BEGIN
  RETURN vault.create_secret(new_secret, new_name, new_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = vault, public;

-- Create RPC function to read secrets (runs with elevated privileges)  
CREATE OR REPLACE FUNCTION public.read_secret(
  secret_name TEXT
) RETURNS TEXT AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  RETURN secret_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = vault, public;

-- Create RPC function to delete secrets (runs with elevated privileges)
CREATE OR REPLACE FUNCTION public.delete_secret(
  secret_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  secret_id UUID;
BEGIN
  SELECT id INTO secret_id
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  IF secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = secret_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = vault, public;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.create_secret TO service_role;
GRANT EXECUTE ON FUNCTION public.read_secret TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_secret TO service_role;