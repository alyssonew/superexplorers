# Configuração do Banco Supabase (Parte 2: Storage e Novas Tabelas)

Para que o novo sistema de Upload de Fotos, Categorias Dinâmicas e Hotéis funcione, precisamos atualizar o banco.

1. Abra o **SQL Editor** no Supabase.
2. Clique em **New query**.
3. Cole o script abaixo e clique em **Run**.

```sql
-- 1. Criar Tabela de Categorias
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins podem tudo em categorias" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir as categorias iniciais (já em Português)
INSERT INTO public.categories (name) VALUES 
('Aventura & Natureza'), 
('Cultura & História'), 
('Praias & Ilhas'), 
('Montanha & Neve'),
('Ecoturismo Premium'),
('Charme & Gastronomia');

-- 2. Atualizar a Tabela de Expedições com campos de Hotel
ALTER TABLE public.expeditions 
  ADD COLUMN IF NOT EXISTS "hotelName" TEXT,
  ADD COLUMN IF NOT EXISTS "hotelImages" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "totalNights" INTEGER DEFAULT 0;

-- 3. Habilitar o Realtime para a tabela de categorias
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- ==========================================
-- 4. CONFIGURAÇÃO DO STORAGE (BUCKET 'images')
-- ==========================================

-- Criar o bucket 'images' e torná-lo público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover políticas antigas de storage se existirem para este bucket (prevenção de erro)
DROP POLICY IF EXISTS "Imagens são públicas para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer um pode enviar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Upload para autenticados" ON storage.objects;

-- Política 1: Leitura Pública (Qualquer visitante pode ver as fotos)
CREATE POLICY "Imagens são públicas para leitura" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

-- Política 2: Upload para Autenticados (Apenas Admins logados podem enviar fotos)
CREATE POLICY "Upload para autenticados" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'images');

-- Política 3: Update e Delete para Autenticados (Apenas Admins logados podem apagar/editar fotos)
CREATE POLICY "Gerenciar imagens para autenticados" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'images');

CREATE POLICY "Deletar imagens para autenticados" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'images');
```

Pronto! Com esse script, o Supabase já estará configurado para receber suas imagens e salvar todos os dados de hotéis e categorias.
