CREATE TABLE public.motoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT,
  cnh TEXT,
  categoria_cnh TEXT,
  validade_cnh DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.multas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  numero_auto TEXT,
  orgao_autuador TEXT,
  codigo_infracao TEXT,
  descricao_infracao TEXT,
  data_infracao DATE,
  hora_infracao TIME,
  local TEXT,
  municipio TEXT,
  uf TEXT,
  rodovia TEXT,
  km TEXT,
  sentido TEXT,
  enquadramento TEXT,
  gravidade TEXT,
  pontos INTEGER,
  valor_original NUMERIC,
  valor_atualizado NUMERIC,
  data_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'NOVA',
  situacao_condutor TEXT NOT NULL DEFAULT 'AGUARDANDO_INDICACAO',
  motorista_id UUID REFERENCES public.motoristas(id) ON DELETE SET NULL,
  data_identificacao DATE,
  prazo_indicacao DATE,
  data_indicacao DATE,
  responsavel_indicacao TEXT,
  protocolo_indicacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX multas_veiculo_idx ON public.multas (veiculo_id);
CREATE INDEX multas_motorista_idx ON public.multas (motorista_id);

CREATE TABLE public.multa_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  multa_id UUID NOT NULL REFERENCES public.multas(id) ON DELETE CASCADE,
  valor_original NUMERIC,
  desconto NUMERIC,
  valor_pago NUMERIC,
  data_pagamento DATE,
  forma_pagamento TEXT,
  responsavel TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.multa_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  multa_id UUID NOT NULL REFERENCES public.multas(id) ON DELETE CASCADE,
  tipo_recurso TEXT,
  data_protocolo DATE,
  numero_protocolo TEXT,
  orgao TEXT,
  prazo DATE,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'EM_ANALISE',
  resultado TEXT,
  data_decisao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.multa_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  multa_id UUID NOT NULL REFERENCES public.multas(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  detalhe TEXT,
  usuario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.motoristas, public.multas, public.multa_pagamentos, public.multa_recursos, public.multa_timeline TO authenticated;
GRANT ALL ON public.motoristas, public.multas, public.multa_pagamentos, public.multa_recursos, public.multa_timeline TO service_role;
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multa_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multa_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multa_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "motoristas_auth_all" ON public.motoristas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "multas_auth_all" ON public.multas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "multa_pagamentos_auth_all" ON public.multa_pagamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "multa_recursos_auth_all" ON public.multa_recursos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "multa_timeline_auth_all" ON public.multa_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER motoristas_touch BEFORE UPDATE ON public.motoristas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER multas_touch BEFORE UPDATE ON public.multas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER multa_recursos_touch BEFORE UPDATE ON public.multa_recursos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
