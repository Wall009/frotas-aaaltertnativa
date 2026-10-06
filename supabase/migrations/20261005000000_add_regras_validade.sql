ALTER TABLE public.vencimentos
  ADD COLUMN data_emissao DATE,
  ADD COLUMN validade_meses INTEGER;

CREATE TABLE public.regras_validade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_codigo TEXT NOT NULL,
  a_partir_de_anos INTEGER NOT NULL DEFAULT 0 CHECK (a_partir_de_anos >= 0),
  validade_meses INTEGER NOT NULL CHECK (validade_meses > 0),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo_codigo, a_partir_de_anos)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_validade TO authenticated;
GRANT ALL ON public.regras_validade TO service_role;
ALTER TABLE public.regras_validade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras_validade_auth_all" ON public.regras_validade FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER regras_validade_touch BEFORE UPDATE ON public.regras_validade FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.regras_validade (tipo_codigo, a_partir_de_anos, validade_meses, observacao) VALUES
  ('IPVA', 0, 12, 'Sugestão inicial (imposto anual) — confirme'),
  ('LICENCIAMENTO', 0, 12, 'Sugestão inicial (licenciamento anual) — confirme'),
  ('IBAMA', 0, 3, 'Conforme o procedimento de renovações: renovação a cada 3 meses');
