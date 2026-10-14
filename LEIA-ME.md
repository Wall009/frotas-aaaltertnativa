# Valores em Multas e Sinistros

Banco: as colunas novas JÁ foram criadas no Lovable Cloud (o .sql em supabase/migrations é só histórico).
Copie `src/` por cima do repositório:

Novos:        src/lib/valores.ts · src/lib/sinistro-valores.ts
Substituídos: src/routes/_authenticated/_app/multas.index.tsx · multas.$multaId.tsx · sinistros.index.tsx · sinistros.$sinistroId.tsx
              src/integrations/supabase/types.ts (inclui as 5 colunas novas; se o seu types.ts for mais novo, só acrescente as colunas)

Multas:    "Quem paga" (Empresa/Motorista) + motivo (só Empresa) + valor, na aba Pagamento; colunas e totais na lista.
Sinistros: cartões de resumo no topo, aba "Valores" e colunas "Valor a pagar (franquia)" e "Total do prejuízo" na lista.
