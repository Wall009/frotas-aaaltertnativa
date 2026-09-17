-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_manage_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ veiculos ============
CREATE TABLE public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL,
  renavam TEXT,
  chassi TEXT,
  motor TEXT,
  marca_modelo TEXT,
  marca TEXT,
  modelo TEXT,
  tipo_veiculo TEXT,
  categoria TEXT,
  equipamento TEXT,
  combustivel TEXT,
  capacidade TEXT,
  quilometragem NUMERIC,
  ano_fabricacao INTEGER,
  ano_modelo INTEGER,
  ano_texto TEXT,
  cor TEXT,
  proprietario TEXT,
  unidade TEXT,
  localizacao TEXT,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  data_aquisicao DATE,
  valor_aquisicao NUMERIC,
  seguro TEXT,
  chave TEXT,
  chave_reserva TEXT,
  manual TEXT,
  imei_rastreador TEXT,
  data_venda DATE,
  data_venda_texto TEXT,
  comprador TEXT,
  valor_venda NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX veiculos_placa_chassi_key ON public.veiculos (placa, COALESCE(chassi,''));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculos TO authenticated;
GRANT ALL ON public.veiculos TO service_role;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "veiculos_auth_all" ON public.veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER veiculos_touch BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ficha tecnica ============
CREATE TABLE public.ficha_tecnica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  identificacao TEXT,
  modelo TEXT,
  comprimento NUMERIC,
  altura NUMERIC,
  largura NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ficha_tecnica TO authenticated;
GRANT ALL ON public.ficha_tecnica TO service_role;
ALTER TABLE public.ficha_tecnica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ficha_auth_all" ON public.ficha_tecnica FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER ficha_touch BEFORE UPDATE ON public.ficha_tecnica FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ tipos_documento ============
CREATE TABLE public.tipos_documento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'DOCUMENTACAO',
  cor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_documento TO authenticated;
GRANT ALL ON public.tipos_documento TO service_role;
ALTER TABLE public.tipos_documento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipos_doc_auth_all" ON public.tipos_documento FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ vencimentos ============
CREATE TABLE public.vencimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE CASCADE,
  tipo_id UUID REFERENCES public.tipos_documento(id) ON DELETE SET NULL,
  tipo_codigo TEXT,
  descricao TEXT,
  numero_cadastro TEXT,
  empresa TEXT,
  data_vencimento DATE,
  vencimento_texto TEXT,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  data_agendamento DATE,
  valor NUMERIC,
  observacoes TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vencimentos_veiculo_idx ON public.vencimentos (veiculo_id);
CREATE INDEX vencimentos_data_idx ON public.vencimentos (data_vencimento);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vencimentos TO authenticated;
GRANT ALL ON public.vencimentos TO service_role;
ALTER TABLE public.vencimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vencimentos_auth_all" ON public.vencimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER vencimentos_touch BEFORE UPDATE ON public.vencimentos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ agenda ============
CREATE TABLE public.agenda_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  atividade TEXT NOT NULL,
  titulo TEXT,
  data DATE NOT NULL,
  hora TIME,
  responsavel TEXT,
  local TEXT,
  empresa TEXT,
  status TEXT NOT NULL DEFAULT 'AGENDADO',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_eventos TO authenticated;
GRANT ALL ON public.agenda_eventos TO service_role;
ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agenda_auth_all" ON public.agenda_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER agenda_touch BEFORE UPDATE ON public.agenda_eventos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ sinistros ============
CREATE TABLE public.sinistros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  data DATE,
  hora TIME,
  motorista TEXT,
  local TEXT,
  tipo TEXT,
  descricao TEXT,
  boletim_ocorrencia TEXT,
  responsavel TEXT,
  observacoes TEXT,
  seguradora TEXT,
  apolice TEXT,
  numero_sinistro TEXT,
  data_abertura DATE,
  contato TEXT,
  analista TEXT,
  franquia NUMERIC,
  valor_estimado NUMERIC,
  valor_aprovado NUMERIC,
  valor_final NUMERIC,
  oficina TEXT,
  data_entrada DATE,
  previsao_saida DATE,
  data_saida DATE,
  orcamento NUMERIC,
  reparo_valor_aprovado NUMERIC,
  reparo_valor_final NUMERIC,
  status TEXT NOT NULL DEFAULT 'EM ANDAMENTO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sinistros TO authenticated;
GRANT ALL ON public.sinistros TO service_role;
ALTER TABLE public.sinistros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sinistros_auth_all" ON public.sinistros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER sinistros_touch BEFORE UPDATE ON public.sinistros FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.sinistro_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinistro_id UUID NOT NULL REFERENCES public.sinistros(id) ON DELETE CASCADE,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  usuario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sinistro_timeline TO authenticated;
GRANT ALL ON public.sinistro_timeline TO service_role;
ALTER TABLE public.sinistro_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sin_timeline_auth_all" ON public.sinistro_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ manutencoes ============
CREATE TABLE public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  tipo TEXT,
  problema TEXT,
  situacao TEXT,
  data_abertura DATE,
  data_entrada DATE,
  previsao_saida DATE,
  data_conclusao DATE,
  oficina TEXT,
  responsavel TEXT,
  custo NUMERIC,
  status TEXT NOT NULL DEFAULT 'ABERTA',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manutencoes TO authenticated;
GRANT ALL ON public.manutencoes TO service_role;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manutencoes_auth_all" ON public.manutencoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER manutencoes_touch BEFORE UPDATE ON public.manutencoes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ valores negociados ============
CREATE TABLE public.valores_negociados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC,
  ano INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.valores_negociados TO authenticated;
GRANT ALL ON public.valores_negociados TO service_role;
ALTER TABLE public.valores_negociados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "valores_auth_all" ON public.valores_negociados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER valores_touch BEFORE UPDATE ON public.valores_negociados FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ flutuante ============
CREATE TABLE public.flutuante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT,
  proprietario TEXT,
  tipo_veiculo TEXT,
  data_entrada DATE,
  data_saida DATE,
  data_saida_texto TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flutuante TO authenticated;
GRANT ALL ON public.flutuante TO service_role;
ALTER TABLE public.flutuante ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flutuante_auth_all" ON public.flutuante FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER flutuante_touch BEFORE UPDATE ON public.flutuante FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ anexos ============
CREATE TABLE public.anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  nome TEXT NOT NULL,
  caminho TEXT NOT NULL,
  tipo TEXT,
  tamanho BIGINT,
  usuario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX anexos_entidade_idx ON public.anexos (entidade, entidade_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anexos TO authenticated;
GRANT ALL ON public.anexos TO service_role;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anexos_auth_all" ON public.anexos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ historico ============
CREATE TABLE public.historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade TEXT NOT NULL,
  entidade_id UUID,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  campo TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario TEXT,
  usuario_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX historico_entidade_idx ON public.historico (entidade, entidade_id);
CREATE INDEX historico_veiculo_idx ON public.historico (veiculo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico TO authenticated;
GRANT ALL ON public.historico TO service_role;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico_auth_all" ON public.historico FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ configuracoes (listas) ============
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo TEXT NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX configuracoes_grupo_valor_key ON public.configuracoes (grupo, valor);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_auth_all" ON public.configuracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.parametros (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parametros TO authenticated;
GRANT ALL ON public.parametros TO service_role;
ALTER TABLE public.parametros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parametros_auth_all" ON public.parametros FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.parametros (chave, valor, descricao) VALUES
  ('dias_alerta_vencimento','30','Dias de antecedência para considerar próximo do vencimento');

INSERT INTO public.tipos_documento (codigo, nome, categoria, ordem) VALUES
  ('IPVA','IPVA','DOCUMENTACAO',1),
  ('LICENCIAMENTO','Licenciamento','DOCUMENTACAO',2),
  ('SEGURO','Seguro','DOCUMENTACAO',3),
  ('AMLURB','AMLURB','DOCUMENTACAO',4),
  ('DSV','DSV','DOCUMENTACAO',5),
  ('IBAMA','IBAMA','DOCUMENTACAO',6),
  ('ANTT','ANTT','DOCUMENTACAO',7),
  ('SETRAN','SETRAN','DOCUMENTACAO',8),
  ('CRONOTACOGRAFO','Cronotacógrafo','DOCUMENTACAO',9),
  ('CIV','CIV','DOCUMENTACAO',10),
  ('CIPP','CIPP','DOCUMENTACAO',11),
  ('LETPP','LETPP','DOCUMENTACAO',12),
  ('VISTORIA','Vistoria','VENCIMENTO',13),
  ('OUTROS','Outros','VENCIMENTO',14);

INSERT INTO public.configuracoes (grupo, valor, ordem) VALUES
  ('STATUS_VEICULO','ATIVO',1),('STATUS_VEICULO','MANUTENCAO',2),('STATUS_VEICULO','INATIVO',3),('STATUS_VEICULO','VENDIDO',4),
  ('STATUS_VENCIMENTO','DENTRO DA VALIDADE',1),('STATUS_VENCIMENTO','PROXIMO DO VENCIMENTO',2),('STATUS_VENCIMENTO','VENCIDO',3),('STATUS_VENCIMENTO','EM PROCESSO',4),('STATUS_VENCIMENTO','NAO SE APLICA',5),
  ('TIPO_MANUTENCAO','PREVENTIVA',1),('TIPO_MANUTENCAO','CORRETIVA',2),('TIPO_MANUTENCAO','SINISTRO',3),('TIPO_MANUTENCAO','REVISAO',4),
  ('TIPO_SINISTRO','COLISAO',1),('TIPO_SINISTRO','ROUBO/FURTO',2),('TIPO_SINISTRO','INCENDIO',3),('TIPO_SINISTRO','TERCEIROS',4),('TIPO_SINISTRO','OUTROS',5),
  ('TIPO_ATIVIDADE','VISTORIA',1),('TIPO_ATIVIDADE','RENOVACAO',2),('TIPO_ATIVIDADE','MANUTENCAO',3),('TIPO_ATIVIDADE','ENTREGA DE DOCUMENTACAO',4),('TIPO_ATIVIDADE','SEGURO',5),('TIPO_ATIVIDADE','REUNIAO',6),('TIPO_ATIVIDADE','OUTROS',7),
  ('STATUS_MANUTENCAO','ABERTA',1),('STATUS_MANUTENCAO','EM ANDAMENTO',2),('STATUS_MANUTENCAO','CONCLUIDA',3),('STATUS_MANUTENCAO','CANCELADA',4),
  ('STATUS_SINISTRO','EM ANDAMENTO',1),('STATUS_SINISTRO','AGUARDANDO SEGURADORA',2),('STATUS_SINISTRO','EM REPARO',3),('STATUS_SINISTRO','CONCLUIDO',4),
  ('STATUS_AGENDA','AGENDADO',1),('STATUS_AGENDA','CONCLUIDO',2),('STATUS_AGENDA','CANCELADO',3);