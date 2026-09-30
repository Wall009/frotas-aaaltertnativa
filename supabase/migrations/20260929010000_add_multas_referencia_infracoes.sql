ALTER TABLE public.multas
  ADD COLUMN termo_assinado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN data_notificacao DATE,
  ADD COLUMN motorista_presumido TEXT,
  ADD COLUMN canal_indicacao TEXT,
  ADD COLUMN data_lancamento_frotas DATE;

CREATE TABLE public.referencia_infracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  gravidade TEXT NOT NULL,
  pontuacao INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referencia_infracoes TO authenticated;
GRANT ALL ON public.referencia_infracoes TO service_role;
ALTER TABLE public.referencia_infracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referencia_infracoes_auth_all" ON public.referencia_infracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dados de referência (gravidade/pontuação CTB) importados do controle de multas da frota.
-- Ver histórico de migrations/dados reais no banco para a lista completa (46 registros).
