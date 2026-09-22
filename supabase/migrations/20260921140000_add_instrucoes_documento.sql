CREATE TABLE public.instrucoes_documento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  orgao_responsavel TEXT,
  link_oficial TEXT,
  documentos_necessarios TEXT,
  passo_a_passo TEXT,
  prazo_estimado TEXT,
  custo_estimado TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX instrucoes_documento_tipo_idx ON public.instrucoes_documento (tipo_codigo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instrucoes_documento TO authenticated;
GRANT ALL ON public.instrucoes_documento TO service_role;
ALTER TABLE public.instrucoes_documento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instrucoes_documento_auth_all" ON public.instrucoes_documento FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER instrucoes_documento_touch BEFORE UPDATE ON public.instrucoes_documento FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
