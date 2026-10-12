-- Permite que um administrador defina uma nova senha para outro usuário, direto do sistema.
-- Roda no banco (sem chave de serviço no navegador): só passa se quem chama for admin (public.is_admin()).
CREATE OR REPLACE FUNCTION public.admin_redefinir_senha(p_user_id uuid, p_nova_senha text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Somente administradores podem redefinir senhas';
  END IF;
  IF p_nova_senha IS NULL OR length(p_nova_senha) < 8 THEN
    RAISE EXCEPTION 'A senha deve ter pelo menos 8 caracteres';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(p_nova_senha, extensions.gen_salt('bf')),
         email_confirmed_at = COALESCE(email_confirmed_at, now()),
         updated_at = now()
   WHERE id = p_user_id;

  -- Quem entrava só com Google passa a poder entrar também com e-mail e senha.
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = p_user_id AND provider = 'email') THEN
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), p_user_id::text, p_user_id,
            jsonb_build_object('sub', p_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
            'email', now(), now(), now());
  END IF;

  -- Encerra as sessões abertas desse usuário: ele precisa entrar de novo com a senha nova.
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_redefinir_senha(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_redefinir_senha(uuid, text) TO authenticated;
