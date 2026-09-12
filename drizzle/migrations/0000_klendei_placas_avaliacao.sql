-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'estabelecimento');
CREATE TYPE public.plano_tipo AS ENUM ('avulso', 'mensal');
CREATE TYPE public.estab_status AS ENUM ('ativo', 'inadimplente');
CREATE TYPE public.placa_status AS ENUM ('em_estoque', 'vendida', 'instalada', 'ativa', 'inativa', 'defeito');
CREATE TYPE public.tipo_destino AS ENUM ('direto', 'funil_avaliacao');

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Enquanto nenhum admin existir, qualquer usuário autenticado atua como admin (bootstrap)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
    OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.reivindicar_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.reivindicar_admin() TO authenticated;

CREATE POLICY "Admin gerencia roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

-- Estabelecimentos
CREATE TABLE public.estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  responsavel TEXT,
  telefone TEXT,
  whatsapp TEXT,
  endereco TEXT,
  plano public.plano_tipo NOT NULL DEFAULT 'avulso',
  valor_mensalidade NUMERIC NOT NULL DEFAULT 0,
  status public.estab_status NOT NULL DEFAULT 'ativo',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estabelecimentos TO authenticated;
GRANT ALL ON public.estabelecimentos TO service_role;
ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;

-- Usuários do portal do estabelecimento
CREATE TABLE public.usuarios_estabelecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  auth_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_estabelecimento TO authenticated;
GRANT ALL ON public.usuarios_estabelecimento TO service_role;
ALTER TABLE public.usuarios_estabelecimento ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.meus_estabelecimentos(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT estabelecimento_id FROM public.usuarios_estabelecimento WHERE auth_user_id = _user_id
$$;

CREATE POLICY "Admin gerencia estabelecimentos" ON public.estabelecimentos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Portal le proprio estabelecimento" ON public.estabelecimentos FOR SELECT TO authenticated
  USING (id IN (SELECT public.meus_estabelecimentos(auth.uid())));

CREATE POLICY "Admin gerencia usuarios portal" ON public.usuarios_estabelecimento FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Portal le proprio vinculo" ON public.usuarios_estabelecimento FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Placas
CREATE TABLE public.placas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_curto TEXT NOT NULL UNIQUE,
  estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE SET NULL,
  apelido TEXT,
  tipo_destino public.tipo_destino NOT NULL DEFAULT 'funil_avaliacao',
  url_destino TEXT,
  url_google TEXT,
  url_feedback_negativo TEXT,
  status public.placa_status NOT NULL DEFAULT 'em_estoque',
  data_venda DATE,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  data_instalacao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_placas_codigo ON public.placas (codigo_curto);
CREATE INDEX idx_placas_estab ON public.placas (estabelecimento_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placas TO authenticated;
GRANT ALL ON public.placas TO service_role;
ALTER TABLE public.placas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia placas" ON public.placas FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Portal le proprias placas" ON public.placas FOR SELECT TO authenticated
  USING (estabelecimento_id IN (SELECT public.meus_estabelecimentos(auth.uid())));

-- Scans
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa_id UUID NOT NULL REFERENCES public.placas(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  sistema_operacional TEXT,
  cidade_aproximada TEXT,
  avaliacao_estrelas INTEGER,
  redirecionou_para_google BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_scans_placa ON public.scans (placa_id, timestamp DESC);
GRANT SELECT ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin le scans" ON public.scans FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Portal le scans proprios" ON public.scans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.placas p WHERE p.id = scans.placa_id
    AND p.estabelecimento_id IN (SELECT public.meus_estabelecimentos(auth.uid()))));

-- Feedbacks privados
CREATE TABLE public.feedbacks_privados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
  placa_id UUID NOT NULL REFERENCES public.placas(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL,
  comentario TEXT,
  contato_cliente TEXT,
  lido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.feedbacks_privados TO authenticated;
GRANT ALL ON public.feedbacks_privados TO service_role;
ALTER TABLE public.feedbacks_privados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia feedbacks" ON public.feedbacks_privados FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Portal le feedbacks proprios" ON public.feedbacks_privados FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.placas p WHERE p.id = feedbacks_privados.placa_id
    AND p.estabelecimento_id IN (SELECT public.meus_estabelecimentos(auth.uid()))));

-- Configuracoes globais
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dominio_curto TEXT NOT NULL DEFAULT 'klendei.com',
  cor_qr TEXT NOT NULL DEFAULT '#0D0D0D',
  cor_fundo_qr TEXT NOT NULL DEFAULT '#FFFFFF',
  email_notificacao TEXT,
  whatsapp_notificacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gerencia configuracoes" ON public.configuracoes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_estab_updated BEFORE UPDATE ON public.estabelecimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_placas_updated BEFORE UPDATE ON public.placas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_config_updated BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Fluxo público (anon) via funções SECURITY DEFINER =====
CREATE OR REPLACE FUNCTION public.resolver_placa(_codigo text)
RETURNS TABLE (
  placa_id uuid, tipo_destino public.tipo_destino, url_destino text, url_google text,
  url_feedback_negativo text, status public.placa_status,
  estabelecimento_nome text, estabelecimento_logo text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.tipo_destino, p.url_destino, p.url_google, p.url_feedback_negativo, p.status,
         e.nome, e.logo_url
  FROM public.placas p
  LEFT JOIN public.estabelecimentos e ON e.id = p.estabelecimento_id
  WHERE lower(p.codigo_curto) = lower(_codigo)
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.resolver_placa(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_scan(_codigo text, _user_agent text, _so text, _cidade text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _placa uuid; _scan uuid;
BEGIN
  SELECT id INTO _placa FROM public.placas WHERE lower(codigo_curto) = lower(_codigo) LIMIT 1;
  IF _placa IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.scans (placa_id, user_agent, sistema_operacional, cidade_aproximada)
  VALUES (_placa, left(coalesce(_user_agent,''), 500), left(coalesce(_so,''), 50), left(coalesce(_cidade,''), 120))
  RETURNING id INTO _scan;
  RETURN _scan;
END; $$;
GRANT EXECUTE ON FUNCTION public.registrar_scan(text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_avaliacao(_scan_id uuid, _estrelas integer, _foi_google boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _estrelas IS NULL OR _estrelas < 1 OR _estrelas > 5 THEN RAISE EXCEPTION 'nota invalida'; END IF;
  UPDATE public.scans SET avaliacao_estrelas = _estrelas, redirecionou_para_google = coalesce(_foi_google, false)
  WHERE id = _scan_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.registrar_avaliacao(uuid, integer, boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_feedback(_scan_id uuid, _codigo text, _nota integer, _comentario text, _contato text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _placa uuid;
BEGIN
  SELECT id INTO _placa FROM public.placas WHERE lower(codigo_curto) = lower(_codigo) LIMIT 1;
  IF _placa IS NULL THEN RAISE EXCEPTION 'placa inexistente'; END IF;
  IF _nota IS NULL OR _nota < 1 OR _nota > 5 THEN RAISE EXCEPTION 'nota invalida'; END IF;
  INSERT INTO public.feedbacks_privados (scan_id, placa_id, nota, comentario, contato_cliente)
  VALUES (_scan_id, _placa, _nota, left(coalesce(_comentario,''), 2000), left(coalesce(_contato,''), 200));
END; $$;
GRANT EXECUTE ON FUNCTION public.registrar_feedback(uuid, text, integer, text, text) TO anon, authenticated;

-- Gerador de código curto único
CREATE OR REPLACE FUNCTION public.gerar_codigo_placa()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _alfabeto text := 'abcdefghjkmnpqrstuvwxyz23456789'; _codigo text; i int;
BEGIN
  LOOP
    _codigo := '';
    FOR i IN 1..6 LOOP
      _codigo := _codigo || substr(_alfabeto, 1 + floor(random() * length(_alfabeto))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.placas WHERE codigo_curto = _codigo);
  END LOOP;
  RETURN _codigo;
END; $$;
GRANT EXECUTE ON FUNCTION public.gerar_codigo_placa() TO authenticated;