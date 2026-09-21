ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'operador' CHECK (role IN ('admin','operador'));

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

DROP POLICY IF EXISTS "anexos_auth_all" ON public.anexos;
CREATE POLICY "anexos_auth_select" ON public.anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anexos_auth_insert" ON public.anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anexos_auth_update" ON public.anexos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anexos_admin_delete" ON public.anexos FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_vendido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'VENDIDO' AND (OLD.status IS DISTINCT FROM NEW.status) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Somente administradores podem marcar um veículo como vendido';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS veiculos_protect_vendido ON public.veiculos;
CREATE TRIGGER veiculos_protect_vendido BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.protect_vendido();
