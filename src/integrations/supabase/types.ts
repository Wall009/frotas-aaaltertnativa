export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agenda_eventos: {
        Row: {
          atividade: string
          created_at: string
          data: string
          empresa: string | null
          hora: string | null
          id: string
          local: string | null
          observacao: string | null
          responsavel: string | null
          status: string
          titulo: string | null
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          atividade: string
          created_at?: string
          data: string
          empresa?: string | null
          hora?: string | null
          id?: string
          local?: string | null
          observacao?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          atividade?: string
          created_at?: string
          data?: string
          empresa?: string | null
          hora?: string | null
          id?: string
          local?: string | null
          observacao?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_eventos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      anexos: {
        Row: {
          caminho: string
          created_at: string
          entidade: string
          entidade_id: string
          id: string
          nome: string
          tamanho: number | null
          tipo: string | null
          usuario: string | null
        }
        Insert: {
          caminho: string
          created_at?: string
          entidade: string
          entidade_id: string
          id?: string
          nome: string
          tamanho?: number | null
          tipo?: string | null
          usuario?: string | null
        }
        Update: {
          caminho?: string
          created_at?: string
          entidade?: string
          entidade_id?: string
          id?: string
          nome?: string
          tamanho?: number | null
          tipo?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          grupo: string
          id: string
          ordem: number
          valor: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          grupo: string
          id?: string
          ordem?: number
          valor: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          grupo?: string
          id?: string
          ordem?: number
          valor?: string
        }
        Relationships: []
      }
      ficha_tecnica: {
        Row: {
          altura: number | null
          comprimento: number | null
          created_at: string
          id: string
          identificacao: string | null
          largura: number | null
          modelo: string | null
          observacoes: string | null
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          altura?: number | null
          comprimento?: number | null
          created_at?: string
          id?: string
          identificacao?: string | null
          largura?: number | null
          modelo?: string | null
          observacoes?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          altura?: number | null
          comprimento?: number | null
          created_at?: string
          id?: string
          identificacao?: string | null
          largura?: number | null
          modelo?: string | null
          observacoes?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ficha_tecnica_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      flutuante: {
        Row: {
          created_at: string
          data_entrada: string | null
          data_saida: string | null
          data_saida_texto: string | null
          id: string
          observacoes: string | null
          placa: string | null
          proprietario: string | null
          tipo_veiculo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_entrada?: string | null
          data_saida?: string | null
          data_saida_texto?: string | null
          id?: string
          observacoes?: string | null
          placa?: string | null
          proprietario?: string | null
          tipo_veiculo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_entrada?: string | null
          data_saida?: string | null
          data_saida_texto?: string | null
          id?: string
          observacoes?: string | null
          placa?: string | null
          proprietario?: string | null
          tipo_veiculo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      historico: {
        Row: {
          acao: string
          campo: string | null
          created_at: string
          entidade: string
          entidade_id: string | null
          id: string
          usuario: string | null
          usuario_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
          veiculo_id: string | null
        }
        Insert: {
          acao: string
          campo?: string | null
          created_at?: string
          entidade: string
          entidade_id?: string | null
          id?: string
          usuario?: string | null
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
          veiculo_id?: string | null
        }
        Update: {
          acao?: string
          campo?: string | null
          created_at?: string
          entidade?: string
          entidade_id?: string | null
          id?: string
          usuario?: string | null
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          created_at: string
          custo: number | null
          data_abertura: string | null
          data_conclusao: string | null
          data_entrada: string | null
          id: string
          observacoes: string | null
          oficina: string | null
          previsao_saida: string | null
          problema: string | null
          responsavel: string | null
          situacao: string | null
          status: string
          tipo: string | null
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string
          custo?: number | null
          data_abertura?: string | null
          data_conclusao?: string | null
          data_entrada?: string | null
          id?: string
          observacoes?: string | null
          oficina?: string | null
          previsao_saida?: string | null
          problema?: string | null
          responsavel?: string | null
          situacao?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string
          custo?: number | null
          data_abertura?: string | null
          data_conclusao?: string | null
          data_entrada?: string | null
          id?: string
          observacoes?: string | null
          oficina?: string | null
          previsao_saida?: string | null
          problema?: string | null
          responsavel?: string | null
          situacao?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      motoristas: {
        Row: {
          ativo: boolean
          categoria_cnh: string | null
          cnh: string | null
          cpf: string | null
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          updated_at: string
          validade_cnh: string | null
        }
        Insert: {
          ativo?: boolean
          categoria_cnh?: string | null
          cnh?: string | null
          cpf?: string | null
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string
          validade_cnh?: string | null
        }
        Update: {
          ativo?: boolean
          categoria_cnh?: string | null
          cnh?: string | null
          cpf?: string | null
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string
          validade_cnh?: string | null
        }
        Relationships: []
      }
      multas: {
        Row: {
          codigo_infracao: string | null
          created_at: string
          data_identificacao: string | null
          data_indicacao: string | null
          data_infracao: string | null
          data_vencimento: string | null
          descricao_infracao: string | null
          enquadramento: string | null
          gravidade: string | null
          hora_infracao: string | null
          id: string
          km: string | null
          local: string | null
          motorista_id: string | null
          municipio: string | null
          numero_auto: string | null
          observacoes: string | null
          orgao_autuador: string | null
          pontos: number | null
          prazo_indicacao: string | null
          protocolo_indicacao: string | null
          responsavel_indicacao: string | null
          rodovia: string | null
          sentido: string | null
          situacao_condutor: string
          status: string
          uf: string | null
          updated_at: string
          valor_atualizado: number | null
          valor_original: number | null
          veiculo_id: string | null
        }
        Insert: {
          codigo_infracao?: string | null
          created_at?: string
          data_identificacao?: string | null
          data_indicacao?: string | null
          data_infracao?: string | null
          data_vencimento?: string | null
          descricao_infracao?: string | null
          enquadramento?: string | null
          gravidade?: string | null
          hora_infracao?: string | null
          id?: string
          km?: string | null
          local?: string | null
          motorista_id?: string | null
          municipio?: string | null
          numero_auto?: string | null
          observacoes?: string | null
          orgao_autuador?: string | null
          pontos?: number | null
          prazo_indicacao?: string | null
          protocolo_indicacao?: string | null
          responsavel_indicacao?: string | null
          rodovia?: string | null
          sentido?: string | null
          situacao_condutor?: string
          status?: string
          uf?: string | null
          updated_at?: string
          valor_atualizado?: number | null
          valor_original?: number | null
          veiculo_id?: string | null
        }
        Update: {
          codigo_infracao?: string | null
          created_at?: string
          data_identificacao?: string | null
          data_indicacao?: string | null
          data_infracao?: string | null
          data_vencimento?: string | null
          descricao_infracao?: string | null
          enquadramento?: string | null
          gravidade?: string | null
          hora_infracao?: string | null
          id?: string
          km?: string | null
          local?: string | null
          motorista_id?: string | null
          municipio?: string | null
          numero_auto?: string | null
          observacoes?: string | null
          orgao_autuador?: string | null
          pontos?: number | null
          prazo_indicacao?: string | null
          protocolo_indicacao?: string | null
          responsavel_indicacao?: string | null
          rodovia?: string | null
          sentido?: string | null
          situacao_condutor?: string
          status?: string
          uf?: string | null
          updated_at?: string
          valor_atualizado?: number | null
          valor_original?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multas_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "motoristas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      multa_pagamentos: {
        Row: {
          created_at: string
          data_pagamento: string | null
          desconto: number | null
          forma_pagamento: string | null
          id: string
          multa_id: string
          observacao: string | null
          responsavel: string | null
          valor_original: number | null
          valor_pago: number | null
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          multa_id: string
          observacao?: string | null
          responsavel?: string | null
          valor_original?: number | null
          valor_pago?: number | null
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          desconto?: number | null
          forma_pagamento?: string | null
          id?: string
          multa_id?: string
          observacao?: string | null
          responsavel?: string | null
          valor_original?: number | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "multa_pagamentos_multa_id_fkey"
            columns: ["multa_id"]
            isOneToOne: false
            referencedRelation: "multas"
            referencedColumns: ["id"]
          },
        ]
      }
      multa_recursos: {
        Row: {
          created_at: string
          data_decisao: string | null
          data_protocolo: string | null
          id: string
          multa_id: string
          numero_protocolo: string | null
          orgao: string | null
          prazo: string | null
          resultado: string | null
          responsavel: string | null
          status: string
          tipo_recurso: string | null
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_decisao?: string | null
          data_protocolo?: string | null
          id?: string
          multa_id: string
          numero_protocolo?: string | null
          orgao?: string | null
          prazo?: string | null
          resultado?: string | null
          responsavel?: string | null
          status?: string
          tipo_recurso?: string | null
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_decisao?: string | null
          data_protocolo?: string | null
          id?: string
          multa_id?: string
          numero_protocolo?: string | null
          orgao?: string | null
          prazo?: string | null
          resultado?: string | null
          responsavel?: string | null
          status?: string
          tipo_recurso?: string | null
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multa_recursos_multa_id_fkey"
            columns: ["multa_id"]
            isOneToOne: false
            referencedRelation: "multas"
            referencedColumns: ["id"]
          },
        ]
      }
      multa_timeline: {
        Row: {
          created_at: string
          detalhe: string | null
          evento: string
          id: string
          multa_id: string
          usuario: string | null
        }
        Insert: {
          created_at?: string
          detalhe?: string | null
          evento: string
          id?: string
          multa_id: string
          usuario?: string | null
        }
        Update: {
          created_at?: string
          detalhe?: string | null
          evento?: string
          id?: string
          multa_id?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multa_timeline_multa_id_fkey"
            columns: ["multa_id"]
            isOneToOne: false
            referencedRelation: "multas"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros: {
        Row: {
          chave: string
          descricao: string | null
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          descricao?: string | null
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          descricao?: string | null
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          setor: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          setor?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          setor?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sinistro_timeline: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          id: string
          sinistro_id: string
          titulo: string
          usuario: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          sinistro_id: string
          titulo: string
          usuario?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          sinistro_id?: string
          titulo?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistro_timeline_sinistro_id_fkey"
            columns: ["sinistro_id"]
            isOneToOne: false
            referencedRelation: "sinistros"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistros: {
        Row: {
          analista: string | null
          apolice: string | null
          boletim_ocorrencia: string | null
          contato: string | null
          created_at: string
          data: string | null
          data_abertura: string | null
          data_entrada: string | null
          data_saida: string | null
          descricao: string | null
          franquia: number | null
          hora: string | null
          id: string
          local: string | null
          motorista: string | null
          numero_sinistro: string | null
          observacoes: string | null
          oficina: string | null
          orcamento: number | null
          previsao_saida: string | null
          reparo_valor_aprovado: number | null
          reparo_valor_final: number | null
          responsavel: string | null
          seguradora: string | null
          status: string
          tipo: string | null
          updated_at: string
          valor_aprovado: number | null
          valor_estimado: number | null
          valor_final: number | null
          veiculo_id: string | null
        }
        Insert: {
          analista?: string | null
          apolice?: string | null
          boletim_ocorrencia?: string | null
          contato?: string | null
          created_at?: string
          data?: string | null
          data_abertura?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          descricao?: string | null
          franquia?: number | null
          hora?: string | null
          id?: string
          local?: string | null
          motorista?: string | null
          numero_sinistro?: string | null
          observacoes?: string | null
          oficina?: string | null
          orcamento?: number | null
          previsao_saida?: string | null
          reparo_valor_aprovado?: number | null
          reparo_valor_final?: number | null
          responsavel?: string | null
          seguradora?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          valor_aprovado?: number | null
          valor_estimado?: number | null
          valor_final?: number | null
          veiculo_id?: string | null
        }
        Update: {
          analista?: string | null
          apolice?: string | null
          boletim_ocorrencia?: string | null
          contato?: string | null
          created_at?: string
          data?: string | null
          data_abertura?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          descricao?: string | null
          franquia?: number | null
          hora?: string | null
          id?: string
          local?: string | null
          motorista?: string | null
          numero_sinistro?: string | null
          observacoes?: string | null
          oficina?: string | null
          orcamento?: number | null
          previsao_saida?: string | null
          reparo_valor_aprovado?: number | null
          reparo_valor_final?: number | null
          responsavel?: string | null
          seguradora?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          valor_aprovado?: number | null
          valor_estimado?: number | null
          valor_final?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistros_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_documento: {
        Row: {
          ativo: boolean
          categoria: string
          codigo: string
          cor: string | null
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          codigo: string
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          codigo?: string
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      valores_negociados: {
        Row: {
          ano: number | null
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          ano?: number | null
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          ano?: number | null
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano_fabricacao: number | null
          ano_modelo: number | null
          ano_texto: string | null
          capacidade: string | null
          categoria: string | null
          chassi: string | null
          chave: string | null
          chave_reserva: string | null
          combustivel: string | null
          comprador: string | null
          cor: string | null
          created_at: string
          data_aquisicao: string | null
          data_venda: string | null
          data_venda_texto: string | null
          equipamento: string | null
          id: string
          imei_rastreador: string | null
          localizacao: string | null
          manual: string | null
          marca: string | null
          marca_modelo: string | null
          modelo: string | null
          motor: string | null
          motivo_venda: string | null
          observacoes: string | null
          placa: string
          proprietario: string | null
          quilometragem: number | null
          renavam: string | null
          seguro: string | null
          status: string
          tipo_veiculo: string | null
          unidade: string | null
          updated_at: string
          valor_aquisicao: number | null
          valor_venda: number | null
        }
        Insert: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          ano_texto?: string | null
          capacidade?: string | null
          categoria?: string | null
          chassi?: string | null
          chave?: string | null
          chave_reserva?: string | null
          combustivel?: string | null
          comprador?: string | null
          cor?: string | null
          created_at?: string
          data_aquisicao?: string | null
          data_venda?: string | null
          data_venda_texto?: string | null
          equipamento?: string | null
          id?: string
          imei_rastreador?: string | null
          localizacao?: string | null
          manual?: string | null
          marca?: string | null
          marca_modelo?: string | null
          modelo?: string | null
          motor?: string | null
          motivo_venda?: string | null
          observacoes?: string | null
          placa: string
          proprietario?: string | null
          quilometragem?: number | null
          renavam?: string | null
          seguro?: string | null
          status?: string
          tipo_veiculo?: string | null
          unidade?: string | null
          updated_at?: string
          valor_aquisicao?: number | null
          valor_venda?: number | null
        }
        Update: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          ano_texto?: string | null
          capacidade?: string | null
          categoria?: string | null
          chassi?: string | null
          chave?: string | null
          chave_reserva?: string | null
          combustivel?: string | null
          comprador?: string | null
          cor?: string | null
          created_at?: string
          data_aquisicao?: string | null
          data_venda?: string | null
          data_venda_texto?: string | null
          equipamento?: string | null
          id?: string
          imei_rastreador?: string | null
          localizacao?: string | null
          manual?: string | null
          marca?: string | null
          marca_modelo?: string | null
          modelo?: string | null
          motor?: string | null
          motivo_venda?: string | null
          observacoes?: string | null
          placa?: string
          proprietario?: string | null
          quilometragem?: number | null
          renavam?: string | null
          seguro?: string | null
          status?: string
          tipo_veiculo?: string | null
          unidade?: string | null
          updated_at?: string
          valor_aquisicao?: number | null
          valor_venda?: number | null
        }
        Relationships: []
      }
      vencimentos: {
        Row: {
          created_at: string
          data_agendamento: string | null
          data_vencimento: string | null
          descricao: string | null
          empresa: string | null
          extra: Json
          id: string
          numero_cadastro: string | null
          observacoes: string | null
          responsavel: string | null
          status: string
          tipo_codigo: string | null
          tipo_id: string | null
          updated_at: string
          valor: number | null
          veiculo_id: string | null
          vencimento_texto: string | null
        }
        Insert: {
          created_at?: string
          data_agendamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa?: string | null
          extra?: Json
          id?: string
          numero_cadastro?: string | null
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          tipo_codigo?: string | null
          tipo_id?: string | null
          updated_at?: string
          valor?: number | null
          veiculo_id?: string | null
          vencimento_texto?: string | null
        }
        Update: {
          created_at?: string
          data_agendamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa?: string | null
          extra?: Json
          id?: string
          numero_cadastro?: string | null
          observacoes?: string | null
          responsavel?: string | null
          status?: string
          tipo_codigo?: string | null
          tipo_id?: string | null
          updated_at?: string
          valor?: number | null
          veiculo_id?: string | null
          vencimento_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vencimentos_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vencimentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
