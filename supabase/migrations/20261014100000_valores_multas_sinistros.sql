-- Multas: quem paga (empresa ou motorista), motivo quando é custo da empresa e valor do responsável
ALTER TABLE public.multas
  ADD COLUMN IF NOT EXISTS pagador text,
  ADD COLUMN IF NOT EXISTS motivo_custo_empresa text,
  ADD COLUMN IF NOT EXISTS valor_pagador numeric(12,2);
ALTER TABLE public.multas DROP CONSTRAINT IF EXISTS multas_pagador_check;
ALTER TABLE public.multas ADD CONSTRAINT multas_pagador_check CHECK (pagador IS NULL OR pagador IN ('EMPRESA','MOTORISTA'));
ALTER TABLE public.multas DROP CONSTRAINT IF EXISTS multas_motivo_custo_empresa_check;
ALTER TABLE public.multas ADD CONSTRAINT multas_motivo_custo_empresa_check CHECK (motivo_custo_empresa IS NULL OR motivo_custo_empresa IN ('FALTA_MANUTENCAO','EQUIPAMENTO_SEGURANCA','FALHA_OPERACIONAL','DOCUMENTACAO_VENCIDA'));
ALTER TABLE public.multas DROP CONSTRAINT IF EXISTS multas_motivo_so_empresa_check;
ALTER TABLE public.multas ADD CONSTRAINT multas_motivo_so_empresa_check CHECK (motivo_custo_empresa IS NULL OR pagador = 'EMPRESA');

-- Sinistros: valor pago pela seguradora e dano à carga (franquia, reparo, terceiros e ressarcimento já existiam)
ALTER TABLE public.sinistros
  ADD COLUMN IF NOT EXISTS valor_pago_seguradora numeric(12,2),
  ADD COLUMN IF NOT EXISTS valor_dano_carga numeric(12,2);
