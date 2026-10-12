# Senhas: "Minha senha" + redefinição pelo administrador

1. Banco: a função `admin_redefinir_senha` JÁ foi aplicada no Lovable Cloud (arquivo em supabase/migrations só para o histórico do repositório).
2. Copie `src/` por cima do repositório:
   - novos: components/redefinir-senha-dialog.tsx, components/alterar-minha-senha.tsx
   - substituído: routes/_authenticated/_app/configuracoes.tsx (base: versão do pacote-final; se você alterou esse arquivo depois, mescle)
3. Em Configurações: card "Minha senha" (todos) e, na lista de Usuários (só admin), botão de chave para redefinir a senha de cada um.
