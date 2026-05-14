-- Função utilitária para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ PRODUTOS ============
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL DEFAULT 0,
  qtd INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_produtos_nome ON public.produtos USING gin (to_tsvector('simple', nome));
CREATE INDEX idx_produtos_codigo ON public.produtos (codigo);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver produtos"
  ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Colaboradores podem criar produtos"
  ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Colaboradores podem alterar produtos"
  ON public.produtos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Colaboradores podem eliminar produtos"
  ON public.produtos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FATURAS ============
CREATE TABLE public.faturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  data TEXT NOT NULL,
  hora TEXT NOT NULL,
  nome TEXT NOT NULL DEFAULT '',
  localidade TEXT NOT NULL DEFAULT '',
  nif TEXT NOT NULL DEFAULT '',
  servico TEXT NOT NULL DEFAULT '',
  pagamento TEXT NOT NULL DEFAULT 'Dinheiro',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  mao_obra NUMERIC NOT NULL DEFAULT 0,
  transporte NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_faturas_created_at ON public.faturas (created_at DESC);
CREATE INDEX idx_faturas_codigo ON public.faturas (codigo);

ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver faturas"
  ON public.faturas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Colaboradores podem criar faturas"
  ON public.faturas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Colaboradores podem alterar faturas"
  ON public.faturas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Colaboradores podem eliminar faturas"
  ON public.faturas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_faturas_updated_at
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();