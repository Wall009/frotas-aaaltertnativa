CREATE OR REPLACE FUNCTION public.registrar_historico_alteracao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  field_name text;
  related_vehicle uuid;
  target_id uuid;
  actor_email text;
BEGIN
  old_data := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  new_data := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE '{}'::jsonb END;
  target_id := COALESCE((new_data->>'id')::uuid, (old_data->>'id')::uuid);
  related_vehicle := CASE WHEN TG_TABLE_NAME = 'veiculos' THEN target_id ELSE COALESCE(NULLIF(new_data->>'veiculo_id','')::uuid, NULLIF(old_data->>'veiculo_id','')::uuid) END;
  actor_email := COALESCE(auth.jwt()->>'email', 'sistema');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historico (entidade, entidade_id, veiculo_id, acao, valor_novo, usuario, usuario_id)
    VALUES (TG_TABLE_NAME, target_id, related_vehicle, 'INCLUSÃO', new_data::text, actor_email, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.historico (entidade, entidade_id, veiculo_id, acao, valor_anterior, usuario, usuario_id)
    VALUES (TG_TABLE_NAME, target_id, related_vehicle, 'EXCLUSÃO', old_data::text, actor_email, auth.uid());
  ELSE
    FOR field_name IN SELECT key FROM jsonb_each(new_data) WHERE key NOT IN ('updated_at') AND new_data->key IS DISTINCT FROM old_data->key
    LOOP
      INSERT INTO public.historico (entidade, entidade_id, veiculo_id, acao, campo, valor_anterior, valor_novo, usuario, usuario_id)
      VALUES (TG_TABLE_NAME, target_id, related_vehicle, 'ALTERAÇÃO', field_name, old_data->>field_name, new_data->>field_name, actor_email, auth.uid());
    END LOOP;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_historico_alteracao() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_historico_alteracao() TO service_role;

CREATE TRIGGER veiculos_historico AFTER INSERT OR UPDATE OR DELETE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_alteracao();
CREATE TRIGGER vencimentos_historico AFTER INSERT OR UPDATE OR DELETE ON public.vencimentos FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_alteracao();
CREATE TRIGGER agenda_historico AFTER INSERT OR UPDATE OR DELETE ON public.agenda_eventos FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_alteracao();
CREATE TRIGGER sinistros_historico AFTER INSERT OR UPDATE OR DELETE ON public.sinistros FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_alteracao();
CREATE TRIGGER manutencoes_historico AFTER INSERT OR UPDATE OR DELETE ON public.manutencoes FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_alteracao();