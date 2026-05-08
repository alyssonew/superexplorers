# Configuração do Banco Supabase

Para que o sistema volte a funcionar perfeitamente com o seu novo banco de dados no Supabase, você precisará executar o script abaixo para criar as tabelas necessárias.

1. Acesse o [Supabase](https://supabase.com).
2. Abra o projeto que você acabou de criar.
3. No menu lateral esquerdo, clique em **SQL Editor** e depois em **New query**.
4. Copie o script abaixo, cole no editor e clique no botão **Run** no canto superior direito.

```sql
-- Habilitar a extensão UUID se já não estiver
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Administradores
CREATE TABLE public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Destinos
CREATE TABLE public.destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  "imageUrl" TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Expedições
CREATE TABLE public.expeditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  location TEXT,
  "startDate" TEXT,
  "endDate" TEXT,
  description TEXT,
  "imageUrl" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Contatos (Mensagens)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interest TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Configurar Políticas de Segurança (Row Level Security)

-- Ativar RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas de Leitura
CREATE POLICY "Leitura pública de destinos" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Leitura pública de expedições" ON public.expeditions FOR SELECT USING (true);

-- Permissão para visitantes enviarem contatos
CREATE POLICY "Visitantes podem inserir contatos" ON public.contacts FOR INSERT WITH CHECK (true);

-- Políticas Administrativas (Apenas Admins autenticados podem Modificar)
-- Nota: Aqui estamos criando políticas simples onde qualquer usuário autenticado tem acesso total.
-- Como é um painel interno, já serve. Num sistema maior, faríamos um JOIN com a tabela admins.

CREATE POLICY "Admins podem tudo em destinos" ON public.destinations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins podem tudo em expedições" ON public.expeditions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins podem ler contatos" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem deletar contatos" ON public.contacts FOR DELETE TO authenticated USING (true);
CREATE POLICY "Admins podem tudo em admins" ON public.admins FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.destinations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expeditions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;

-- 7. Criar Usuário Admin Inicial (E-mail e Senha)
-- Primeiro, ative a extensão pgcrypto se não estiver ativa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id uuid := uuid_generate_v4();
BEGIN
  -- 1. Remove o usuário antigo se ele existir (para evitar erro de duplicação)
  DELETE FROM auth.users WHERE email = 'admin@mail.com';

  -- 2. Cria o usuário no Auth com a senha '1234567'
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
    'admin@mail.com', crypt('1234567', gen_salt('bf')), now(), now(), now(), 
    '{"provider":"email","providers":["email"]}', '{}', false
  );

  -- 3. Cria a Identidade do usuário (Obrigatório nas versões recentes do Supabase)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    new_user_id, new_user_id, new_user_id::text, 
    jsonb_build_object('sub', new_user_id, 'email', 'admin@mail.com'), 
    'email', now(), now(), now()
  );

  -- 4. Vincula na tabela admins pública
  INSERT INTO public.admins (id, email, role)
  VALUES (new_user_id, 'admin@mail.com', 'superadmin');

END $$;
```

Pronto! Agora você não precisa configurar Login via Google. O acesso já será liberado com o email `admin@mail.com` e a senha `1234567`.
