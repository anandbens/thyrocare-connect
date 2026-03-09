-- =============================================
-- Daniel Homoeo Clinic - Full PostgreSQL Schema with Data
-- Generated: 2026-03-09
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE app_role AS ENUM ('admin', 'user', 'payment_reviewer', 'content_moderator');

-- =============================================
-- TABLES
-- =============================================

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Test Categories
CREATE TABLE test_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏥',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lab Tests
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL,
  test_code TEXT,
  parameters INTEGER DEFAULT 0,
  parameters_list TEXT[] DEFAULT '{}',
  parameters_grouped JSONB DEFAULT '[]',
  category_id UUID REFERENCES test_categories(id),
  sample_type TEXT DEFAULT 'Blood',
  turnaround TEXT DEFAULT '24-48 hours',
  fasting_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  user_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  alt_phone TEXT,
  age INTEGER,
  gender TEXT,
  address1 TEXT NOT NULL,
  address2 TEXT,
  area TEXT NOT NULL,
  landmark TEXT,
  district TEXT NOT NULL,
  state TEXT DEFAULT 'Tamil Nadu',
  pincode TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT,
  total_amount NUMERIC NOT NULL,
  total_savings NUMERIC DEFAULT 0,
  payment_type TEXT DEFAULT 'online',
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  order_status TEXT DEFAULT 'received',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  test_id UUID REFERENCES lab_tests(id),
  test_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL
);

-- Banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  link_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_location TEXT,
  review TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  parent_id UUID REFERENCES menu_items(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Page Content
CREATE TABLE page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  title TEXT,
  content JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site Settings
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}',
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  description TEXT,
  available_variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP Logs
CREATE TABLE otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT DEFAULT 'checkout',
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'DHC-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_test_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.test_code IS NULL OR NEW.test_code = '' THEN
    NEW.test_code := 'TC-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION get_profile_by_phone(p_phone TEXT)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'full_name', p.full_name,
    'email', p.email,
    'phone', p.phone
  ) INTO v_result
  FROM profiles p WHERE p.phone = p_phone LIMIT 1;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_paginated_orders(
  p_page integer DEFAULT 1,
  p_per_page integer DEFAULT 15,
  p_search text DEFAULT NULL,
  p_order_status text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_tab text DEFAULT NULL,
  p_count_only boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
  v_results JSON;
  v_processed_statuses TEXT[] := ARRAY['confirmed','sample_collected','processing','completed'];
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_offset := (p_page - 1) * p_per_page;

  SELECT COUNT(*) INTO v_total
  FROM orders o
  WHERE
    (p_order_status IS NULL OR o.order_status = p_order_status)
    AND (p_payment_status IS NULL OR o.payment_status = p_payment_status)
    AND (p_date_from IS NULL OR o.created_at >= p_date_from)
    AND (p_date_to IS NULL OR o.created_at <= p_date_to)
    AND (p_search IS NULL OR (
      o.customer_name ILIKE '%' || p_search || '%'
      OR o.customer_phone ILIKE '%' || p_search || '%'
      OR o.customer_email ILIKE '%' || p_search || '%'
      OR o.order_number ILIKE '%' || p_search || '%'
    ))
    AND (
      p_tab IS NULL
      OR (p_tab = 'new' AND NOT (o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses)))
      OR (p_tab = 'processed' AND o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses))
    );

  IF p_count_only THEN
    RETURN json_build_object('total', v_total);
  END IF;

  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'per_page', p_per_page,
    'total_pages', CEIL(v_total::NUMERIC / p_per_page),
    'data', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          o.*,
          (
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'order_id', oi.order_id,
              'test_id', oi.test_id,
              'test_name', oi.test_name,
              'price', oi.price,
              'original_price', oi.original_price
            ))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ) AS order_items
        FROM orders o
        WHERE
          (p_order_status IS NULL OR o.order_status = p_order_status)
          AND (p_payment_status IS NULL OR o.payment_status = p_payment_status)
          AND (p_date_from IS NULL OR o.created_at >= p_date_from)
          AND (p_date_to IS NULL OR o.created_at <= p_date_to)
          AND (p_search IS NULL OR (
            o.customer_name ILIKE '%' || p_search || '%'
            OR o.customer_phone ILIKE '%' || p_search || '%'
            OR o.customer_email ILIKE '%' || p_search || '%'
            OR o.order_number ILIKE '%' || p_search || '%'
          ))
          AND (
            p_tab IS NULL
            OR (p_tab = 'new' AND NOT (o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses)))
            OR (p_tab = 'processed' AND o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses))
          )
        ORDER BY o.created_at DESC
        LIMIT p_per_page
        OFFSET v_offset
      ) t
    ), '[]'::json)
  ) INTO v_results;

  RETURN v_results;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_categories_updated_at BEFORE UPDATE ON test_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER generate_test_code_trigger BEFORE INSERT ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION generate_test_id();

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_lab_tests_category ON lab_tests(category_id);
CREATE INDEX idx_lab_tests_active ON lab_tests(is_active);
CREATE INDEX idx_lab_tests_popular ON lab_tests(is_popular) WHERE is_popular = true;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_otp_logs_email ON otp_logs(email);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- User Roles
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Test Categories
CREATE POLICY "Anyone can view active categories" ON test_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON test_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Lab Tests
CREATE POLICY "Anyone can view active tests" ON lab_tests FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tests" ON lab_tests FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Orders
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their orders" ON orders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read orders by phone for prefill" ON orders FOR SELECT USING (true);

-- Order Items
CREATE POLICY "Anyone can insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their order items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can manage order items" ON order_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Banners
CREATE POLICY "Anyone can view active banners" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage banners" ON banners FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Testimonials
CREATE POLICY "Anyone can view active testimonials" ON testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage testimonials" ON testimonials FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Menu Items
CREATE POLICY "Anyone can view active menus" ON menu_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage menus" ON menu_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Page Content
CREATE POLICY "Anyone can view page content" ON page_content FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage page content" ON page_content FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Site Settings
CREATE POLICY "Anyone can view non-sensitive settings" ON site_settings FOR SELECT USING (setting_key !~~ '%_secret%');
CREATE POLICY "Admins can manage all settings" ON site_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Email Templates
CREATE POLICY "Service can read templates" ON email_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage email templates" ON email_templates FOR ALL USING (has_role(auth.uid(), 'admin'));

-- OTP Logs
CREATE POLICY "Anyone can insert OTP" ON otp_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "OTP can be verified by email match" ON otp_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can view OTP logs" ON otp_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Activity Logs
CREATE POLICY "System can insert logs" ON activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view logs" ON activity_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));


-- =============================================================================
-- DATA INSERTS
-- =============================================================================

-- =============================================
-- Test Categories
-- =============================================
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('e6af6ea5-1ddd-4343-820c-86ad279cb131', 'Aarogyam', 'ShieldCheck', true, 0);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 'Health Packages', '🏥', true, 1);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('b998bcd1-5eb8-4a9c-8b61-d0c0955368cb', 'Thyroid Profile', '🦋', true, 2);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('5a59f11a-fcb5-47e4-86f5-613d518d2d12', 'Diabetes', '🩸', true, 3);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('245629f1-12a5-42fe-8bb0-5f3af7ec95ec', 'Liver Function', '🫁', true, 4);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('55708bf8-ce74-4e43-a3e6-ebd648638ceb', 'Kidney Function', '🫘', true, 5);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('ab8918f9-7b82-4857-8353-fea5ff7e4ba5', 'Heart Health', '❤️', true, 6);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('290635b5-2ce9-48f7-a3ee-52aa09ae9381', 'Vitamins', '☀️', true, 7);
INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES ('c46089ab-e62e-4a99-b51c-e3aa18c5a1f0', 'Allergy', '🤧', true, 8);

-- =============================================
-- Lab Tests (21 tests)
-- =============================================

-- Aarogyam 1.3
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'f447558f-714c-4387-b330-79c2f30950cc', 'Aarogyam 1.3', 'AAOG13', '8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 2549.00, 3399.00, 8, true, true, true, 'Blood', '24-48 hours',
  'Complete health checkup package covering thyroid, diabetes, liver, kidney, lipid profile, iron, and vitamin tests.',
  '{CBC,"Thyroid Profile","Lipid Profile","Liver Function","Kidney Function","Iron Studies","Vitamin B12","Vitamin D"}',
  '[]'::jsonb
);

-- Aarogyam 1.8
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '58efe972-2093-453b-9d70-4fb0ecdfc55b', 'Aarogyam 1.8', 'AAOG18', '8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 5249.00, 6999.00, 8, true, true, true, 'Blood', '24-48 hours',
  'Advanced health checkup with extended cardiac markers, hormones, and cancer screening markers.',
  '{CBC,"Thyroid Profile","Lipid Profile","Liver Function","Kidney Function","Cardiac Risk Markers","Hormone Panel","Tumor Markers"}',
  '[]'::jsonb
);

-- AAROGYAM B PRO WITH UTSH (68 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '924838f5-dc0a-4b3b-af91-21759e25a18d', 'AAROGYAM B PRO WITH UTSH', 'AA-BPWU', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 949.00, 1899.00, 68, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam B Pro with UTSH is our second-most popular health checkup package that includes 68 parameters. It includes CBC and diabetes testing, making it an ideal package for a full-body check-up. This comprehensive preventive care package evaluates thyroid, liver, and kidney functioning, as well as determines lipid, sodium, chloride and iron levels in the body. Regular health checkups help detect health issues early, paving the way for prompt treatment and better health outcomes.',
  '{Chloride,Sodium,Hba1c,"Average blood glucose (abg)","Lymphocytes - absolute count","Monocytes - absolute count","Neutrophils - absolute count",Basophils,Eosinophils,Hemoglobin,"Immature granulocytes(ig)","Immature granulocyte percentage(ig%)","Total leucocytes count (wbc)",Lymphocyte,"Mean corpuscular hemoglobin(mch)","Mean corp.hemo.conc(mchc)","Mean corpuscular volume(mcv)",Monocytes,"Mean platelet volume(mpv)",Neutrophils,"Nucleated red blood cells","Nucleated red blood cells %","Plateletcrit(pct)","Hematocrit(pcv)","Platelet distribution width(pdw)","Platelet to large cell ratio(plcr)","Platelet count","Total rbc","Red cell distribution width (rdw-cv)","Basophils - absolute count","Red cell distribution width - sd(rdw-sd)","Eosinophils - absolute count","Alkaline phosphatase","Bilirubin -direct","Bilirubin (indirect)","Bilirubin - total","Gamma glutamyl transferase (ggt)","Sgot / sgpt ratio","Serum alb/globulin ratio","Protein - total","Albumin - serum","Serum globulin","Aspartate aminotransferase (sgot)","Alanine transaminase (sgpt)",Iron,"% transferrin saturation","Total iron binding capacity (tibc)","Unsat.iron-binding capacity(uibc)","Bun / sr.creatinine ratio","Blood urea nitrogen (bun)",Calcium,"Creatinine - serum","Urea / sr.creatinine ratio","Urea (calculated)","Uric acid","Total cholesterol","Hdl cholesterol - direct","Hdl / ldl ratio","Ldl cholesterol - direct","Ldl / hdl ratio","Non-hdl cholesterol","Tc/ hdl cholesterol ratio","Trig / hdl ratio",Triglycerides,"Vldl cholesterol","Total triiodothyronine (t3)","Total thyroxine (t4)","Tsh - ultrasensitive"}',
  '[{"count": 2, "group": "Electrolytes", "tests": ["Chloride", "Sodium"]}, {"count": 2, "group": "Diabetes", "tests": ["Hba1c", "Average blood glucose (abg)"]}, {"count": 28, "group": "Complete Hemogram", "tests": ["Lymphocytes - absolute count", "Monocytes - absolute count", "Neutrophils - absolute count", "Basophils", "Eosinophils", "Hemoglobin", "Immature granulocytes(ig)", "Immature granulocyte percentage(ig%)", "Total leucocytes count (wbc)", "Lymphocyte", "Mean corpuscular hemoglobin(mch)", "Mean corp.hemo.conc(mchc)", "Mean corpuscular volume(mcv)", "Monocytes", "Mean platelet volume(mpv)", "Neutrophils", "Nucleated red blood cells", "Nucleated red blood cells %", "Plateletcrit(pct)", "Hematocrit(pcv)", "Platelet distribution width(pdw)", "Platelet to large cell ratio(plcr)", "Platelet count", "Total rbc", "Red cell distribution width (rdw-cv)", "Basophils - absolute count", "Red cell distribution width - sd(rdw-sd)", "Eosinophils - absolute count"]}, {"count": 12, "group": "Liver", "tests": ["Alkaline phosphatase", "Bilirubin -direct", "Bilirubin (indirect)", "Bilirubin - total", "Gamma glutamyl transferase (ggt)", "Sgot / sgpt ratio", "Serum alb/globulin ratio", "Protein - total", "Albumin - serum", "Serum globulin", "Aspartate aminotransferase (sgot)", "Alanine transaminase (sgpt)"]}, {"count": 4, "group": "Iron Deficiency", "tests": ["Iron", "% transferrin saturation", "Total iron binding capacity (tibc)", "Unsat.iron-binding capacity(uibc)"]}, {"count": 7, "group": "Renal", "tests": ["Bun / sr.creatinine ratio", "Blood urea nitrogen (bun)", "Calcium", "Creatinine - serum", "Urea / sr.creatinine ratio", "Urea (calculated)", "Uric acid"]}, {"count": 10, "group": "Lipid", "tests": ["Total cholesterol", "Hdl cholesterol - direct", "Hdl / ldl ratio", "Ldl cholesterol - direct", "Ldl / hdl ratio", "Non-hdl cholesterol", "Tc/ hdl cholesterol ratio", "Trig / hdl ratio", "Triglycerides", "Vldl cholesterol"]}, {"count": 3, "group": "Thyroid", "tests": ["Total triiodothyronine (t3)", "Total thyroxine (t4)", "Tsh - ultrasensitive"]}]'::jsonb
);

-- AAROGYAM C PRO INCLUDING CRM ADVANCED WITH UTSH (77 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'c9d32475-4490-4999-9939-3ee99906fd77', 'AAROGYAM C PRO INCLUDING CRM ADVANCED WITH UTSH', 'ACPICAWU', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 1799.00, 3599.00, 77, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam C Pro Including CRM Advanced with UTSH is a comprehensive package of 77 parameters. This package has been enriched with Cardiac Risk Markers Advanced profile to assess Heart Health that includes Homocysteine, in addition to evaluation of thyroid, liver and kidney health, also includes tests for measuring lipids, sodium and chloride and iron levels in the body. It includes CBC, tests for detecting diabetes and testosterone test. Inclusion vitamin D and B-12 tests in this affordable package makes it unique.',
  '{Chloride,Sodium,Homocysteine,"High sensitivity c-reactive protein (hs-crp)","Lipoprotein (a) [lp(a)]","Apo b / apo a1 ratio (apo b/a1)","Apolipoprotein - a1 (apo-a1)","Apolipoprotein - b (apo-b)",Testosterone,Hba1c,"Average blood glucose (abg)","Lymphocytes - absolute count","Monocytes - absolute count","Neutrophils - absolute count",Basophils,Eosinophils,Hemoglobin,"Immature granulocytes(ig)","Immature granulocyte percentage(ig%)","Total leucocytes count (wbc)",Lymphocyte,"Mean corpuscular hemoglobin(mch)","Mean corp.hemo.conc(mchc)","Mean corpuscular volume(mcv)",Monocytes,"Mean platelet volume(mpv)",Neutrophils,"Nucleated red blood cells","Nucleated red blood cells %","Plateletcrit(pct)","Hematocrit(pcv)","Platelet distribution width(pdw)","Platelet to large cell ratio(plcr)","Platelet count","Total rbc","Red cell distribution width (rdw-cv)","Basophils - absolute count","Red cell distribution width - sd(rdw-sd)","Eosinophils - absolute count","Alkaline phosphatase","Bilirubin -direct","Bilirubin (indirect)","Bilirubin - total","Gamma glutamyl transferase (ggt)","Sgot / sgpt ratio","Serum alb/globulin ratio","Protein - total","Albumin - serum","Serum globulin","Aspartate aminotransferase (sgot)","Alanine transaminase (sgpt)",Iron,"% transferrin saturation","Total iron binding capacity (tibc)","Unsat.iron-binding capacity(uibc)","Bun / sr.creatinine ratio","Blood urea nitrogen (bun)",Calcium,"Creatinine - serum","Urea / sr.creatinine ratio","Urea (calculated)","Uric acid","Total cholesterol","Hdl cholesterol - direct","Hdl / ldl ratio","Ldl cholesterol - direct","Ldl / hdl ratio","Non-hdl cholesterol","Tc/ hdl cholesterol ratio","Trig / hdl ratio",Triglycerides,"Vldl cholesterol","Total triiodothyronine (t3)","Total thyroxine (t4)","Tsh - ultrasensitive","25-oh vitamin d (total)","Vitamin b-12"}',
  '[{"count": 2, "group": "Electrolytes", "tests": ["Chloride", "Sodium"]}, {"count": 6, "group": "Cardiac Risk Markers", "tests": ["Homocysteine", "High sensitivity c-reactive protein (hs-crp)", "Lipoprotein (a) [lp(a)]", "Apo b / apo a1 ratio (apo b/a1)", "Apolipoprotein - a1 (apo-a1)", "Apolipoprotein - b (apo-b)"]}, {"count": 1, "group": "Hormone", "tests": ["Testosterone"]}, {"count": 2, "group": "Diabetes", "tests": ["Hba1c", "Average blood glucose (abg)"]}, {"count": 28, "group": "Complete Hemogram", "tests": ["Lymphocytes - absolute count", "Monocytes - absolute count", "Neutrophils - absolute count", "Basophils", "Eosinophils", "Hemoglobin", "Immature granulocytes(ig)", "Immature granulocyte percentage(ig%)", "Total leucocytes count (wbc)", "Lymphocyte", "Mean corpuscular hemoglobin(mch)", "Mean corp.hemo.conc(mchc)", "Mean corpuscular volume(mcv)", "Monocytes", "Mean platelet volume(mpv)", "Neutrophils", "Nucleated red blood cells", "Nucleated red blood cells %", "Plateletcrit(pct)", "Hematocrit(pcv)", "Platelet distribution width(pdw)", "Platelet to large cell ratio(plcr)", "Platelet count", "Total rbc", "Red cell distribution width (rdw-cv)", "Basophils - absolute count", "Red cell distribution width - sd(rdw-sd)", "Eosinophils - absolute count"]}, {"count": 12, "group": "Liver", "tests": ["Alkaline phosphatase", "Bilirubin -direct", "Bilirubin (indirect)", "Bilirubin - total", "Gamma glutamyl transferase (ggt)", "Sgot / sgpt ratio", "Serum alb/globulin ratio", "Protein - total", "Albumin - serum", "Serum globulin", "Aspartate aminotransferase (sgot)", "Alanine transaminase (sgpt)"]}, {"count": 4, "group": "Iron Deficiency", "tests": ["Iron", "% transferrin saturation", "Total iron binding capacity (tibc)", "Unsat.iron-binding capacity(uibc)"]}, {"count": 7, "group": "Renal", "tests": ["Bun / sr.creatinine ratio", "Blood urea nitrogen (bun)", "Calcium", "Creatinine - serum", "Urea / sr.creatinine ratio", "Urea (calculated)", "Uric acid"]}, {"count": 10, "group": "Lipid", "tests": ["Total cholesterol", "Hdl cholesterol - direct", "Hdl / ldl ratio", "Ldl cholesterol - direct", "Ldl / hdl ratio", "Non-hdl cholesterol", "Tc/ hdl cholesterol ratio", "Trig / hdl ratio", "Triglycerides", "Vldl cholesterol"]}, {"count": 3, "group": "Thyroid", "tests": ["Total triiodothyronine (t3)", "Total thyroxine (t4)", "Tsh - ultrasensitive"]}, {"count": 2, "group": "Vitamin", "tests": ["25-oh vitamin d (total)", "Vitamin b-12"]}]'::jsonb
);

-- AAROGYAM C PRO INCLUDING CRM WITH UTSH (76 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '5cd5f888-2836-4a39-af0c-4a35844770e1', 'AAROGYAM C PRO INCLUDING CRM WITH UTSH', 'ACPICWU', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 1699.00, 3399.00, 76, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam C Pro Including CRM with UTSH is a comprehensive package of 76 parameters. This package has been enriched with Cardiac Risk Markers to assess Heart Health in addition to evaluation of thyroid, liver and kidney health, also includes tests for measuring lipids, sodium and chloride and iron levels in the body. It includes CBC, tests for detecting diabetes and testosterone test. Inclusion vitamin D and B-12 tests in this pocket friendly package makes it unique. Preventive health checkups help identify health issues early and allow timely treatment.',
  '{Chloride,Sodium,"High sensitivity c-reactive protein (hs-crp)","Lipoprotein (a) [lp(a)]","Apo b / apo a1 ratio (apo b/a1)","Apolipoprotein - a1 (apo-a1)","Apolipoprotein - b (apo-b)",Testosterone,Hba1c,"Average blood glucose (abg)","Lymphocytes - absolute count","Monocytes - absolute count","Neutrophils - absolute count",Basophils,Eosinophils,Hemoglobin,"Immature granulocytes(ig)","Immature granulocyte percentage(ig%)","Total leucocytes count (wbc)",Lymphocyte,"Mean corpuscular hemoglobin(mch)","Mean corp.hemo.conc(mchc)","Mean corpuscular volume(mcv)",Monocytes,"Mean platelet volume(mpv)",Neutrophils,"Nucleated red blood cells","Nucleated red blood cells %","Plateletcrit(pct)","Hematocrit(pcv)","Platelet distribution width(pdw)","Platelet to large cell ratio(plcr)","Platelet count","Total rbc","Red cell distribution width (rdw-cv)","Basophils - absolute count","Red cell distribution width - sd(rdw-sd)","Eosinophils - absolute count","Alkaline phosphatase","Bilirubin -direct","Bilirubin (indirect)","Bilirubin - total","Gamma glutamyl transferase (ggt)","Sgot / sgpt ratio","Serum alb/globulin ratio","Protein - total","Albumin - serum","Serum globulin","Aspartate aminotransferase (sgot)","Alanine transaminase (sgpt)",Iron,"% transferrin saturation","Total iron binding capacity (tibc)","Unsat.iron-binding capacity(uibc)","Bun / sr.creatinine ratio","Blood urea nitrogen (bun)",Calcium,"Creatinine - serum","Urea / sr.creatinine ratio","Urea (calculated)","Uric acid","Total cholesterol","Hdl cholesterol - direct","Hdl / ldl ratio","Ldl cholesterol - direct","Ldl / hdl ratio","Non-hdl cholesterol","Tc/ hdl cholesterol ratio","Trig / hdl ratio",Triglycerides,"Vldl cholesterol","Total triiodothyronine (t3)","Total thyroxine (t4)","Tsh - ultrasensitive","25-oh vitamin d (total)","Vitamin b-12"}',
  '[{"count": 2, "group": "Electrolytes", "tests": ["Chloride", "Sodium"]}, {"count": 5, "group": "Cardiac Risk Markers", "tests": ["High sensitivity c-reactive protein (hs-crp)", "Lipoprotein (a) [lp(a)]", "Apo b / apo a1 ratio (apo b/a1)", "Apolipoprotein - a1 (apo-a1)", "Apolipoprotein - b (apo-b)"]}, {"count": 1, "group": "Hormone", "tests": ["Testosterone"]}, {"count": 2, "group": "Diabetes", "tests": ["Hba1c", "Average blood glucose (abg)"]}, {"count": 28, "group": "Complete Hemogram", "tests": ["Lymphocytes - absolute count", "Monocytes - absolute count", "Neutrophils - absolute count", "Basophils", "Eosinophils", "Hemoglobin", "Immature granulocytes(ig)", "Immature granulocyte percentage(ig%)", "Total leucocytes count (wbc)", "Lymphocyte", "Mean corpuscular hemoglobin(mch)", "Mean corp.hemo.conc(mchc)", "Mean corpuscular volume(mcv)", "Monocytes", "Mean platelet volume(mpv)", "Neutrophils", "Nucleated red blood cells", "Nucleated red blood cells %", "Plateletcrit(pct)", "Hematocrit(pcv)", "Platelet distribution width(pdw)", "Platelet to large cell ratio(plcr)", "Platelet count", "Total rbc", "Red cell distribution width (rdw-cv)", "Basophils - absolute count", "Red cell distribution width - sd(rdw-sd)", "Eosinophils - absolute count"]}, {"count": 12, "group": "Liver", "tests": ["Alkaline phosphatase", "Bilirubin -direct", "Bilirubin (indirect)", "Bilirubin - total", "Gamma glutamyl transferase (ggt)", "Sgot / sgpt ratio", "Serum alb/globulin ratio", "Protein - total", "Albumin - serum", "Serum globulin", "Aspartate aminotransferase (sgot)", "Alanine transaminase (sgpt)"]}, {"count": 4, "group": "Iron Deficiency", "tests": ["Iron", "% transferrin saturation", "Total iron binding capacity (tibc)", "Unsat.iron-binding capacity(uibc)"]}, {"count": 7, "group": "Renal", "tests": ["Bun / sr.creatinine ratio", "Blood urea nitrogen (bun)", "Calcium", "Creatinine - serum", "Urea / sr.creatinine ratio", "Urea (calculated)", "Uric acid"]}, {"count": 10, "group": "Lipid", "tests": ["Total cholesterol", "Hdl cholesterol - direct", "Hdl / ldl ratio", "Ldl cholesterol - direct", "Ldl / hdl ratio", "Non-hdl cholesterol", "Tc/ hdl cholesterol ratio", "Trig / hdl ratio", "Triglycerides", "Vldl cholesterol"]}, {"count": 3, "group": "Thyroid", "tests": ["Total triiodothyronine (t3)", "Total thyroxine (t4)", "Tsh - ultrasensitive"]}, {"count": 2, "group": "Vitamin", "tests": ["25-oh vitamin d (total)", "Vitamin b-12"]}]'::jsonb
);

-- AAROGYAM CAMP PROFILE 1 (62 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'ce738d0b-eb2f-47ae-a2a5-e1f32c960078', 'AAROGYAM CAMP PROFILE 1', 'AACP1', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 1250.00, 2500.00, 62, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam Camp Profile 1 is a preventive care package that is designed to provide a comprehensive overview of one''s health. It includes 62 tests that help with early detection of various diseases and conditions, offering your patients a chance to make informed decisions about their lifestyle and medical care.',
  '{Hba1c,"Average blood glucose (abg)","Lymphocytes - absolute count","Monocytes - absolute count","Neutrophils - absolute count",Basophils,Eosinophils,Hemoglobin,"Immature granulocytes(ig)","Immature granulocyte percentage(ig%)","Total leucocytes count (wbc)",Lymphocyte,"Mean corpuscular hemoglobin(mch)","Mean corp.hemo.conc(mchc)","Mean corpuscular volume(mcv)",Monocytes,"Mean platelet volume(mpv)",Neutrophils,"Nucleated red blood cells","Nucleated red blood cells %","Plateletcrit(pct)","Hematocrit(pcv)","Platelet distribution width(pdw)","Platelet to large cell ratio(plcr)","Platelet count","Total rbc","Red cell distribution width (rdw-cv)","Basophils - absolute count","Red cell distribution width - sd(rdw-sd)","Eosinophils - absolute count","Alkaline phosphatase","Bilirubin -direct","Bilirubin (indirect)","Bilirubin - total","Gamma glutamyl transferase (ggt)","Sgot / sgpt ratio","Serum alb/globulin ratio","Protein - total","Albumin - serum","Serum globulin","Aspartate aminotransferase (sgot)","Alanine transaminase (sgpt)","Bun / sr.creatinine ratio","Blood urea nitrogen (bun)",Calcium,"Creatinine - serum","Urea / sr.creatinine ratio","Urea (calculated)","Uric acid","Total cholesterol","Hdl cholesterol - direct","Hdl / ldl ratio","Ldl cholesterol - direct","Ldl / hdl ratio","Non-hdl cholesterol","Tc/ hdl cholesterol ratio","Trig / hdl ratio",Triglycerides,"Vldl cholesterol","Total triiodothyronine (t3)","Total thyroxine (t4)","Tsh - ultrasensitive"}',
  '[{"count": 2, "group": "Diabetes", "tests": ["Hba1c", "Average blood glucose (abg)"]}, {"count": 28, "group": "Complete Hemogram", "tests": ["Lymphocytes - absolute count", "Monocytes - absolute count", "Neutrophils - absolute count", "Basophils", "Eosinophils", "Hemoglobin", "Immature granulocytes(ig)", "Immature granulocyte percentage(ig%)", "Total leucocytes count (wbc)", "Lymphocyte", "Mean corpuscular hemoglobin(mch)", "Mean corp.hemo.conc(mchc)", "Mean corpuscular volume(mcv)", "Monocytes", "Mean platelet volume(mpv)", "Neutrophils", "Nucleated red blood cells", "Nucleated red blood cells %", "Plateletcrit(pct)", "Hematocrit(pcv)", "Platelet distribution width(pdw)", "Platelet to large cell ratio(plcr)", "Platelet count", "Total rbc", "Red cell distribution width (rdw-cv)", "Basophils - absolute count", "Red cell distribution width - sd(rdw-sd)", "Eosinophils - absolute count"]}, {"count": 12, "group": "Liver", "tests": ["Alkaline phosphatase", "Bilirubin -direct", "Bilirubin (indirect)", "Bilirubin - total", "Gamma glutamyl transferase (ggt)", "Sgot / sgpt ratio", "Serum alb/globulin ratio", "Protein - total", "Albumin - serum", "Serum globulin", "Aspartate aminotransferase (sgot)", "Alanine transaminase (sgpt)"]}, {"count": 7, "group": "Renal", "tests": ["Bun / sr.creatinine ratio", "Blood urea nitrogen (bun)", "Calcium", "Creatinine - serum", "Urea / sr.creatinine ratio", "Urea (calculated)", "Uric acid"]}, {"count": 10, "group": "Lipid", "tests": ["Total cholesterol", "Hdl cholesterol - direct", "Hdl / ldl ratio", "Ldl cholesterol - direct", "Ldl / hdl ratio", "Non-hdl cholesterol", "Tc/ hdl cholesterol ratio", "Trig / hdl ratio", "Triglycerides", "Vldl cholesterol"]}, {"count": 3, "group": "Thyroid", "tests": ["Total triiodothyronine (t3)", "Total thyroxine (t4)", "Tsh - ultrasensitive"]}]'::jsonb
);

-- AAROGYAM CAMP PROFILE 2 (69 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'a62c67e5-259e-4488-966f-ea4b25ae09dc', 'AAROGYAM CAMP PROFILE 2', 'AACP2', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 1699.00, 3399.00, 69, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam Camp Profile 2 is a preventive care package that is designed to provide a comprehensive overview of one''s health. It includes 69 tests that help with early detection of various diseases and conditions, offering your patients a chance to make informed decisions about their lifestyle and medical care.',
  '{Hba1c,"Average blood glucose (abg)","High sensitivity c-reactive protein (hs-crp)","Lipoprotein (a) [lp(a)]","Apo b / apo a1 ratio (apo b/a1)","Apolipoprotein - a1 (apo-a1)","Apolipoprotein - b (apo-b)","Lymphocytes - absolute count","Monocytes - absolute count","Neutrophils - absolute count",Basophils,Eosinophils,Hemoglobin,"Immature granulocytes(ig)","Immature granulocyte percentage(ig%)","Total leucocytes count (wbc)",Lymphocyte,"Mean corpuscular hemoglobin(mch)","Mean corp.hemo.conc(mchc)","Mean corpuscular volume(mcv)",Monocytes,"Mean platelet volume(mpv)",Neutrophils,"Nucleated red blood cells","Nucleated red blood cells %","Plateletcrit(pct)","Hematocrit(pcv)","Platelet distribution width(pdw)","Platelet to large cell ratio(plcr)","Platelet count","Total rbc","Red cell distribution width (rdw-cv)","Basophils - absolute count","Red cell distribution width - sd(rdw-sd)","Eosinophils - absolute count","Alkaline phosphatase","Bilirubin -direct","Bilirubin (indirect)","Bilirubin - total","Gamma glutamyl transferase (ggt)","Sgot / sgpt ratio","Serum alb/globulin ratio","Protein - total","Albumin - serum","Serum globulin","Aspartate aminotransferase (sgot)","Alanine transaminase (sgpt)","Bun / sr.creatinine ratio","Blood urea nitrogen (bun)",Calcium,"Creatinine - serum","Urea / sr.creatinine ratio","Urea (calculated)","Uric acid","Total cholesterol","Hdl cholesterol - direct","Hdl / ldl ratio","Ldl cholesterol - direct","Ldl / hdl ratio","Non-hdl cholesterol","Tc/ hdl cholesterol ratio","Trig / hdl ratio",Triglycerides,"Vldl cholesterol","Total triiodothyronine (t3)","Total thyroxine (t4)","Tsh - ultrasensitive","25-oh vitamin d (total)","Vitamin b-12"}',
  '[{"count": 2, "group": "Diabetes", "tests": ["Hba1c", "Average blood glucose (abg)"]}, {"count": 5, "group": "Cardiac Risk Markers", "tests": ["High sensitivity c-reactive protein (hs-crp)", "Lipoprotein (a) [lp(a)]", "Apo b / apo a1 ratio (apo b/a1)", "Apolipoprotein - a1 (apo-a1)", "Apolipoprotein - b (apo-b)"]}, {"count": 28, "group": "Complete Hemogram", "tests": ["Lymphocytes - absolute count", "Monocytes - absolute count", "Neutrophils - absolute count", "Basophils", "Eosinophils", "Hemoglobin", "Immature granulocytes(ig)", "Immature granulocyte percentage(ig%)", "Total leucocytes count (wbc)", "Lymphocyte", "Mean corpuscular hemoglobin(mch)", "Mean corp.hemo.conc(mchc)", "Mean corpuscular volume(mcv)", "Monocytes", "Mean platelet volume(mpv)", "Neutrophils", "Nucleated red blood cells", "Nucleated red blood cells %", "Plateletcrit(pct)", "Hematocrit(pcv)", "Platelet distribution width(pdw)", "Platelet to large cell ratio(plcr)", "Platelet count", "Total rbc", "Red cell distribution width (rdw-cv)", "Basophils - absolute count", "Red cell distribution width - sd(rdw-sd)", "Eosinophils - absolute count"]}, {"count": 12, "group": "Liver", "tests": ["Alkaline phosphatase", "Bilirubin -direct", "Bilirubin (indirect)", "Bilirubin - total", "Gamma glutamyl transferase (ggt)", "Sgot / sgpt ratio", "Serum alb/globulin ratio", "Protein - total", "Albumin - serum", "Serum globulin", "Aspartate aminotransferase (sgot)", "Alanine transaminase (sgpt)"]}, {"count": 7, "group": "Renal", "tests": ["Bun / sr.creatinine ratio", "Blood urea nitrogen (bun)", "Calcium", "Creatinine - serum", "Urea / sr.creatinine ratio", "Urea (calculated)", "Uric acid"]}, {"count": 10, "group": "Lipid", "tests": ["Total cholesterol", "Hdl cholesterol - direct", "Hdl / ldl ratio", "Ldl cholesterol - direct", "Ldl / hdl ratio", "Non-hdl cholesterol", "Tc/ hdl cholesterol ratio", "Trig / hdl ratio", "Triglycerides", "Vldl cholesterol"]}, {"count": 3, "group": "Thyroid", "tests": ["Total triiodothyronine (t3)", "Total thyroxine (t4)", "Tsh - ultrasensitive"]}, {"count": 2, "group": "Vitamin", "tests": ["25-oh vitamin d (total)", "Vitamin b-12"]}]'::jsonb
);

-- AAROGYAM PURUSH PROFILE WITH UTSH (107 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '70810a86-8b5b-4394-9521-2983f187381d', 'AAROGYAM PURUSH PROFILE WITH UTSH', 'AAPPUWU', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 2750.00, 5500.00, 107, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam Purush Profile with UTSH comprises of 107 parameters tailor made for a man. It contains Hormones, Cancer Markers, Bone Profile and Complete Urine Analysis along with the all other important parameters for full body check up.',
  '{"Carcino embryonic antigen (cea)","Prostate specific antigen (psa)",Chloride,Sodium,Folate,"25-oh vitamin d (total)","Vitamin b-12","High sensitivity c-reactive protein (hs-crp)","Lipoprotein (a) [lp(a)]","Apo b / apo a1 ratio (apo b/a1)","Apolipoprotein - a1 (apo-a1)","Apolipoprotein - b (apo-b)",Magnesium,Phosphorous,"Anti ccp (accp)","Anti nuclear antibodies (ana)",Testosterone}',
  '[{"count": 2, "group": "Cancer Markers", "tests": ["Carcino embryonic antigen (cea)", "Prostate specific antigen (psa)"]}, {"count": 2, "group": "Electrolytes", "tests": ["Chloride", "Sodium"]}, {"count": 3, "group": "Vitamin", "tests": ["Folate", "25-oh vitamin d (total)", "Vitamin b-12"]}, {"count": 5, "group": "Cardiac Risk Markers", "tests": ["High sensitivity c-reactive protein (hs-crp)", "Lipoprotein (a) [lp(a)]", "Apo b / apo a1 ratio (apo b/a1)", "Apolipoprotein - a1 (apo-a1)", "Apolipoprotein - b (apo-b)"]}, {"count": 1, "group": "Metabolic", "tests": ["Magnesium"]}, {"count": 3, "group": "Arthritis", "tests": ["Phosphorous", "Anti ccp (accp)", "Anti nuclear antibodies (ana)"]}, {"count": 1, "group": "Hormone", "tests": ["Testosterone"]}, {"count": 24, "group": "Complete Urine Analysis", "tests": ["Specific gravity", "Appearance", "Bacteria", "Urinary bilirubin", "Urine blood", "Urobilinogen", "Bile pigment", "Bile salt", "Casts", "Colour", "Crystals", "Epithelial cells", "Urinary glucose", "Urine ketone", "Leucocyte esterase", "Urinary leucocytes (pus cells)", "Mucus", "Nitrite", "Parasite", "Ph", "Urinary protein", "Red blood cells", "Volume", "Yeast"]}, {"count": 2, "group": "Diabetes", "tests": ["Hba1c", "Average blood glucose (abg)"]}, {"count": 28, "group": "Complete Hemogram", "tests": ["Lymphocytes - absolute count", "Monocytes - absolute count", "Neutrophils - absolute count", "Basophils", "Eosinophils", "Hemoglobin", "Immature granulocytes(ig)", "Immature granulocyte percentage(ig%)", "Total leucocytes count (wbc)", "Lymphocyte", "Mean corpuscular hemoglobin(mch)", "Mean corp.hemo.conc(mchc)", "Mean corpuscular volume(mcv)", "Monocytes", "Mean platelet volume(mpv)", "Neutrophils", "Nucleated red blood cells", "Nucleated red blood cells %", "Plateletcrit(pct)", "Hematocrit(pcv)", "Platelet distribution width(pdw)", "Platelet to large cell ratio(plcr)", "Platelet count", "Total rbc", "Red cell distribution width (rdw-cv)", "Basophils - absolute count", "Red cell distribution width - sd(rdw-sd)", "Eosinophils - absolute count"]}, {"count": 12, "group": "Liver", "tests": ["Alkaline phosphatase", "Bilirubin -direct", "Bilirubin (indirect)", "Bilirubin - total", "Gamma glutamyl transferase (ggt)", "Sgot / sgpt ratio", "Serum alb/globulin ratio", "Protein - total", "Albumin - serum", "Serum globulin", "Aspartate aminotransferase (sgot)", "Alanine transaminase (sgpt)"]}, {"count": 4, "group": "Iron Deficiency", "tests": ["Iron", "% transferrin saturation", "Total iron binding capacity (tibc)", "Unsat.iron-binding capacity(uibc)"]}, {"count": 7, "group": "Renal", "tests": ["Bun / sr.creatinine ratio", "Blood urea nitrogen (bun)", "Calcium", "Creatinine - serum", "Urea / sr.creatinine ratio", "Urea (calculated)", "Uric acid"]}, {"count": 10, "group": "Lipid", "tests": ["Total cholesterol", "Hdl cholesterol - direct", "Hdl / ldl ratio", "Ldl cholesterol - direct", "Ldl / hdl ratio", "Non-hdl cholesterol", "Tc/ hdl cholesterol ratio", "Trig / hdl ratio", "Triglycerides", "Vldl cholesterol"]}, {"count": 3, "group": "Thyroid", "tests": ["Total triiodothyronine (t3)", "Total thyroxine (t4)", "Tsh - ultrasensitive"]}]'::jsonb
);

-- AAROGYAM STREE PROFILE WITH UTSH (110 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'f1e3e2c0-4e70-4b02-b4a3-14f32eb55a2f', 'AAROGYAM STREE PROFILE WITH UTSH', 'AASPWU', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 2750.00, 5500.00, 110, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam Stree Profile with UTSH comprises of 110 parameters tailor made for a woman. It contains Hormones, Cancer Markers, Bone Profile and Complete Urine Analysis along with the all other important parameters for full body check up.',
  '{}', '[]'::jsonb
);

-- AAROGYAM XL PLUS PROFILE WITH UTSH (164 parameters)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '7dbf5032-35f0-4eeb-94e3-4229ce33fa8b', 'AAROGYAM XL PLUS PROFILE WITH UTSH', 'AAXLPWU', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 5249.00, 10499.00, 164, true, true, true, 'Blood', '24-48 hours',
  'Aarogyam XL Plus Profile with UTSH is a complete health checkup package of 164 parameters. Along with Complete Urine Analysis + Fasting Blood Sugar analysis, the profile offers steroid profile, including crucial hormones like testosterone and progesterone for men and women, respectively. This helps understand your metabolism, immune functions and sexual health. It is a value-for-money package recommended for all age groups. Regular checkups help in early detection and better management of health issues.',
  '{}', '[]'::jsonb
);

-- Complete Blood Count (CBC)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'a8c2da8a-2065-4ed0-bf21-6d671b2362c2', 'Complete Blood Count (CBC)', 'CBC', '8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 300.00, 500.00, 8, true, true, false, 'Blood', '24 hours',
  'Evaluates overall health by measuring red cells, white cells, hemoglobin, and platelets.',
  '{RBC,WBC,Hemoglobin,Hematocrit,Platelets,"Mean Corpuscular Volume","Mean Corpuscular Hemoglobin","Mean Corpuscular Hemoglobin Concentration"}',
  '[]'::jsonb
);

-- Diabetes Screening Panel
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'bd0f8136-b3e4-4228-bd56-ac97c769d26b', 'Diabetes Screening Panel', 'DIASP', '5a59f11a-fcb5-47e4-86f5-613d518d2d12', 800.00, 1500.00, 5, false, true, true, 'Blood', '24-48 hours',
  'Complete diabetes screening with fasting glucose, HbA1c, and insulin levels.',
  '{"Fasting Glucose","Post-Prandial Glucose",HbA1c,"Fasting Insulin","C-Peptide"}',
  '[]'::jsonb
);

-- FOOD INTOLERANCE PROFILE
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '826a4391-f7eb-4b43-ab0d-3c2255660e09', 'FOOD INTOLERANCE PROFILE', 'FOODI', '8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 8799.00, 10999.00, 1, false, true, false, 'Blood', '24-48 hours',
  'Food intolerance is a digestive system response to a particular food. This IgG-based panel test using venous blood sample aids in knowing about foods that trigger unusual reactions in the body. It provides details about comprehensive list of foods to be avoided.',
  '{"Food Intolerance Panel"}',
  '[]'::jsonb
);

-- HbA1c (Glycated Hemoglobin)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '1a00b355-aa96-40ae-810d-31aded16e5c7', 'HbA1c (Glycated Hemoglobin)', 'HBA1C', '5a59f11a-fcb5-47e4-86f5-613d518d2d12', 350.00, 600.00, 1, true, true, false, 'Blood', '24 hours',
  'Measures average blood sugar levels over the past 2-3 months for diabetes management.',
  '{HbA1c}',
  '[]'::jsonb
);

-- Kidney Function Test (KFT)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'c1d5cb58-f2ab-48a1-b1f3-cd3d0110a4bd', 'Kidney Function Test (KFT)', 'KFT', '55708bf8-ce74-4e43-a3e6-ebd648638ceb', 400.00, 750.00, 5, false, true, false, 'Blood', '24 hours',
  'Comprehensive renal function assessment including creatinine, BUN, and uric acid.',
  '{Creatinine,BUN,"Uric Acid",Calcium,Phosphorus}',
  '[]'::jsonb
);

-- Lipid Profile
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'b4b8f74c-15b2-48cd-bb8e-a84e3fea2431', 'Lipid Profile', 'LIPPF', 'ab8918f9-7b82-4857-8353-fea5ff7e4ba5', 400.00, 700.00, 8, true, true, true, 'Blood', '24 hours',
  'Comprehensive cholesterol and triglyceride assessment for heart health.',
  '{"Total Cholesterol","HDL Cholesterol","LDL Cholesterol",Triglycerides,VLDL,"TC/HDL Ratio","LDL/HDL Ratio","Non-HDL Cholesterol"}',
  '[]'::jsonb
);

-- Liver Function Test (LFT)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'bc16569b-c5fb-4410-adc2-588c7f86cdb1', 'Liver Function Test (LFT)', 'LFT', '245629f1-12a5-42fe-8bb0-5f3af7ec95ec', 450.00, 800.00, 12, false, true, true, 'Blood', '24 hours',
  'Evaluates liver health by measuring enzymes, proteins, and bilirubin.',
  '{"Total Bilirubin","Direct Bilirubin","Indirect Bilirubin",SGOT,SGPT,"Alkaline Phosphatase",GGT,"Total Protein",Albumin,Globulin,"A/G Ratio","SGOT/SGPT Ratio"}',
  '[]'::jsonb
);

-- Thyroid Free Profile
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '71405178-f130-43f6-a4d5-3b11b52463b3', 'Thyroid Free Profile', 'TPFT3T4', 'b998bcd1-5eb8-4a9c-8b61-d0c0955368cb', 500.00, 900.00, 3, false, true, false, 'Blood', '24 hours',
  'Free T3 and Free T4 along with TSH for precise thyroid assessment.',
  '{"Free T3","Free T4",TSH}',
  '[]'::jsonb
);

-- Thyroid Profile Total
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '6390ae89-8a57-4ab1-bbb3-38c6fa319edd', 'Thyroid Profile Total', 'TPFT', 'b998bcd1-5eb8-4a9c-8b61-d0c0955368cb', 350.00, 700.00, 3, true, true, false, 'Blood', '24 hours',
  'Complete thyroid function test including T3, T4, and TSH to evaluate thyroid health.',
  '{"Total T3","Total T4",TSH}',
  '[]'::jsonb
);

-- Vitamin B12
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  'c4ad5b89-e377-457c-95b7-5ac18a051266', 'Vitamin B12', 'VITB', '290635b5-2ce9-48f7-a3ee-52aa09ae9381', 500.00, 900.00, 1, true, true, false, 'Blood', '24 hours',
  'Evaluates B12 levels essential for nerve function and red blood cell production.',
  '{"Vitamin B12"}',
  '[]'::jsonb
);

-- Vitamin D (25-OH)
INSERT INTO lab_tests (id, name, test_code, category_id, price, original_price, parameters, is_popular, is_active, fasting_required, sample_type, turnaround, description, parameters_list, parameters_grouped) VALUES (
  '24b8181c-dad5-4f5c-860e-94c1e8718277', 'Vitamin D (25-OH)', 'VITDC', '290635b5-2ce9-48f7-a3ee-52aa09ae9381', 600.00, 1200.00, 1, true, true, false, 'Blood', '24 hours',
  'Measures Vitamin D levels to assess bone health and immune function.',
  '{"25-OH Vitamin D"}',
  '[]'::jsonb
);

-- =============================================
-- Site Settings
-- =============================================
INSERT INTO site_settings (id, setting_key, setting_value) VALUES ('1f50c575-cebf-46bc-9030-93bce8bb3aa5', 'fallback_otp', '{"code": "226688", "enabled": true}'::jsonb);
INSERT INTO site_settings (id, setting_key, setting_value) VALUES ('bd015998-ad97-40d5-8edc-73d44154388a', 'payment_gateway', '{"is_sandbox": true, "razorpay_key_id": "rzp_test_1DP5mmOlF5G5ag", "razorpay_key_secret": "thisissecretkey123456"}'::jsonb);

-- =============================================
-- Testimonials
-- =============================================
INSERT INTO testimonials (id, customer_name, customer_location, review, rating, is_active, sort_order) VALUES ('7a44139d-8901-443e-a1db-c9ae169aa62c', 'Priya Krishnan', 'Madurai, Tamil Nadu', 'Excellent service! The home collection was on time and the reports were delivered within 24 hours. Very professional phlebotomist.', 5, true, 1);
INSERT INTO testimonials (id, customer_name, customer_location, review, rating, is_active, sort_order) VALUES ('1df27e88-d7d5-451b-b3e4-825243753a3c', 'Rajesh Kumar', 'Thirumangalam, Madurai', 'Very affordable prices compared to other labs. The staff is friendly and the reports are accurate. Highly recommended for families!', 5, true, 2);
INSERT INTO testimonials (id, customer_name, customer_location, review, rating, is_active, sort_order) VALUES ('1368d631-764c-4fc9-8f60-249aa9db831b', 'Lakshmi Devi', 'Anna Nagar, Madurai', 'Got my thyroid profile done here. Quick and hassle-free process. The online booking made it so convenient. Will definitely use again.', 4, true, 3);
INSERT INTO testimonials (id, customer_name, customer_location, review, rating, is_active, sort_order) VALUES ('e92197b7-ddf4-4889-8e89-a0fb79816339', 'Suresh Babu', 'KK Nagar, Madurai', 'I have been using Daniel Homoeo Clinic for all my lab tests for over a year now. Consistently reliable results and great customer support.', 5, true, 4);
INSERT INTO testimonials (id, customer_name, customer_location, review, rating, is_active, sort_order) VALUES ('4198e08a-6522-4d8d-916e-09b849c84b26', 'Meena Sundaram', 'Tallakulam, Madurai', 'The complete health checkup package was worth every rupee. Detailed reports with doctor consultation. Best diagnostic service in Madurai!', 5, true, 5);
INSERT INTO testimonials (id, customer_name, customer_location, review, rating, is_active, sort_order) VALUES ('748645b1-bbc4-4167-bdf3-f546bd608b17', 'Karthik Vel', 'Mattuthavani, Madurai', 'Booked a lipid profile test online. The sample collection guy came right on time. Got my reports via email the next day. Very convenient!', 4, true, 6);

-- =============================================
-- Menu Items
-- =============================================
INSERT INTO menu_items (id, label, href, parent_id, is_active, sort_order) VALUES ('f82570e8-f286-4ee3-8db7-a0548f86f646', 'Home', '/', NULL, true, 1);
INSERT INTO menu_items (id, label, href, parent_id, is_active, sort_order) VALUES ('2be7bfa1-c859-41fd-abeb-e7e7c60d4b2f', 'Book a Test', '/tests', NULL, true, 2);
INSERT INTO menu_items (id, label, href, parent_id, is_active, sort_order) VALUES ('6e3fea94-b850-484f-a321-d51fcd412b0f', 'Health Packages', '/tests?category=health-packages', NULL, true, 3);
INSERT INTO menu_items (id, label, href, parent_id, is_active, sort_order) VALUES ('939d7704-479f-481d-9d1f-0d388b19eb54', 'About', '/about', NULL, true, 4);
INSERT INTO menu_items (id, label, href, parent_id, is_active, sort_order) VALUES ('58197d28-88bd-47fe-ba77-b9c0c39559f5', 'Contact', '/contact', NULL, true, 5);

-- =============================================
-- Email Templates
-- =============================================
INSERT INTO email_templates (id, name, template_key, subject, body_html, description, available_variables, is_active) VALUES (
  'e6a4b648-de41-49e3-b574-0f9804734140',
  'New Order Alert - Admin',
  'order_confirmation_admin',
  'New Order Received: {{order_number}} from {{customer_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1e293b; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔔 New Order Alert</h1>
    <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0;">Daniel Homoeo Clinic - Admin</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1a1a1a; margin-top: 0;">New Order Received</h2>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #333;"><strong>Order Number:</strong> {{order_number}}</p>
      <p style="margin: 0 0 8px; color: #333;"><strong>Customer:</strong> {{customer_name}}</p>
      <p style="margin: 0 0 8px; color: #333;"><strong>Phone:</strong> {{customer_phone}}</p>
      <p style="margin: 0 0 8px; color: #333;"><strong>Email:</strong> {{customer_email}}</p>
      <p style="margin: 0; color: #333;"><strong>Payment:</strong> {{payment_status}}</p>
    </div>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Order Details</h3>
      <p style="margin: 0 0 8px; color: #555;"><strong>Tests:</strong> {{test_names}}</p>
      <p style="margin: 0 0 8px; color: #555;"><strong>Amount:</strong> ₹{{total_amount}} (Savings: ₹{{total_savings}})</p>
      <p style="margin: 0 0 8px; color: #555;"><strong>Collection:</strong> {{preferred_date}} - {{preferred_time}}</p>
      <p style="margin: 0; color: #555;"><strong>Address:</strong> {{address}}</p>
    </div>
  </div>
  <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">Manage this order in the Admin Panel</p>
  </div>
</div>',
  'Sent to admin when a new order is placed',
  '[{"key": "customer_name", "label": "Customer Name"}, {"key": "customer_email", "label": "Customer Email"}, {"key": "customer_phone", "label": "Customer Phone"}, {"key": "order_number", "label": "Order Number"}, {"key": "test_names", "label": "Test Names"}, {"key": "total_amount", "label": "Total Amount"}, {"key": "total_savings", "label": "Total Savings"}, {"key": "preferred_date", "label": "Preferred Date"}, {"key": "preferred_time", "label": "Preferred Time"}, {"key": "address", "label": "Full Address"}, {"key": "payment_status", "label": "Payment Status"}, {"key": "year", "label": "Current Year"}]'::jsonb,
  true
);

INSERT INTO email_templates (id, name, template_key, subject, body_html, description, available_variables, is_active) VALUES (
  'efca8d4e-730f-41b1-a178-e5cc7a274509',
  'Order Confirmation - Customer',
  'order_confirmation_customer',
  'Your Order {{order_number}} is Confirmed! 🎉',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0f8a6c, #2a7fb5); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Daniel Homoeo Clinic</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Authorized Thyrocare Partner</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Hi {{customer_name}},</h2>
    <p style="color: #555;">Thank you for your order! Your booking has been confirmed.</p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #333;"><strong>Order Number:</strong> {{order_number}}</p>
      <p style="margin: 0 0 8px; color: #333;"><strong>Tests:</strong> {{test_names}}</p>
      <p style="margin: 0 0 8px; color: #333;"><strong>Total Amount:</strong> ₹{{total_amount}}</p>
      <p style="margin: 0 0 8px; color: #333;"><strong>Collection Date:</strong> {{preferred_date}}</p>
      <p style="margin: 0; color: #333;"><strong>Time Slot:</strong> {{preferred_time}}</p>
    </div>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Collection Address</h3>
      <p style="color: #555; margin: 0;">{{address}}</p>
    </div>
    <p style="color: #555;">Our phlebotomist will visit your address for sample collection. Please ensure someone is available at the given time slot.</p>
    <p style="color: #555;">For any queries, contact us at <strong>+91 7010 737 378</strong> or reply to this email.</p>
  </div>
  <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #999; font-size: 12px; margin: 0;">© {{year}} Daniel Homoeo Clinic. All rights reserved.</p>
  </div>
</div>',
  'Sent to customer when an order is placed',
  '[{"key": "customer_name", "label": "Customer Name"}, {"key": "customer_email", "label": "Customer Email"}, {"key": "customer_phone", "label": "Customer Phone"}, {"key": "order_number", "label": "Order Number"}, {"key": "test_names", "label": "Test Names"}, {"key": "total_amount", "label": "Total Amount"}, {"key": "total_savings", "label": "Total Savings"}, {"key": "preferred_date", "label": "Preferred Date"}, {"key": "preferred_time", "label": "Preferred Time"}, {"key": "address", "label": "Full Address"}, {"key": "payment_status", "label": "Payment Status"}, {"key": "year", "label": "Current Year"}]'::jsonb,
  true
);

-- =============================================
-- Sample Orders
-- =============================================
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, age, gender, address1, address2, area, landmark, district, state, pincode, preferred_date, preferred_time, total_amount, total_savings, payment_type, payment_status, order_status, alt_phone) VALUES
('4453496b-40fb-4b91-85f6-5dc251b9254e', 'DHC-20260309-4516', '6e13366e-43e9-400a-a799-2ae80f19c72b', 'Arthini SV', 'arthinisv@gmail.com', '6383407472', 24, 'female', 'North Street', NULL, 'Vadasery', NULL, 'Nagercoil', 'Tamil Nadu', '629852', '2026-03-27', 'morning', 500.00, 400.00, 'online', 'pending', 'completed', NULL),
('5e312a2b-5d47-4f05-a759-b51a0f0bd191', 'DHC-20260309-1196', '6e13366e-43e9-400a-a799-2ae80f19c72b', 'Arthini SV', 'arthinisv@gmail.com', '9874563212', 24, 'female', '2/24C, R.C street ,Seethapal,Nagercoil,Kanyakumari', NULL, 'Nagercoil Town', NULL, 'Nagercoil', 'Tamil Nadu', '629852', '2026-03-10', 'afternoon', 300.00, 200.00, 'online', 'pending', 'received', NULL),
('4e1c3012-75c6-4aba-a026-d05e5d245aba', 'DHC-20260309-8400', NULL, 'Anand', 'arunsurya99@gmail.com', '9071274825', 35, 'male', 'College', 'College', 'Nagercoil Town', 'College', 'Nagercoil', 'Tamil Nadu', '645095', '2026-03-20', 'afternoon', 16597.00, 4800.00, 'online', 'pending', 'received', '9656665663'),
('f1104cc7-152b-4b3c-87d5-baa2b1055130', 'DHC-20260309-6283', NULL, 'Aannd', 'anand@gmail.com', '9071274826', 34, 'male', 'Aannd', 'Aannd', 'Colachel', 'Aannd', 'Nagercoil', 'Tamil Nadu', '629005', '2026-03-18', 'morning', 5249.00, 1750.00, 'online', 'pending', 'received', '9999999999'),
('b7752734-5669-4bb9-b10f-f09c13f2ee70', 'DHC-20260308-2480', NULL, 'Aannd', 'anand@gmail.com', '9071274826', 34, 'male', 'Aannd', 'Aannd', 'Colachel', 'Aannd', 'Nagercoil', 'Tamil Nadu', '629005', '2026-03-27', 'morning', 1699.00, 1700.00, 'online', 'pending', 'received', '9999999999'),
('f32664b0-180c-4f89-8ce2-8c3989b79f6a', 'DHC-20260308-1065', NULL, 'Aannd', 'anand@gmail.com', '9071274826', 34, 'male', 'Aannd', 'Aannd', 'Colachel', 'Aannd', 'Nagercoil', 'Tamil Nadu', '629005', '2026-03-20', 'morning', 2200.00, 2300.00, 'online', 'pending', 'received', '9999999999');

-- =============================================
-- Order Items
-- =============================================
INSERT INTO order_items (id, order_id, test_id, test_name, price, original_price) VALUES
('2c772d9b-16f2-47f8-b87b-1b7d9cfecb03', 'f32664b0-180c-4f89-8ce2-8c3989b79f6a', '58efe972-2093-453b-9d70-4fb0ecdfc55b', 'Aarogyam 1.8', 2200.00, 4500.00),
('1aebdccd-4ab5-4f65-8e49-eeb73e7e66cd', 'b7752734-5669-4bb9-b10f-f09c13f2ee70', 'a62c67e5-259e-4488-966f-ea4b25ae09dc', 'AAROGYAM CAMP PROFILE 2', 1699.00, 3399.00),
('c976ff5a-e9f8-4e48-a0f5-9fd1f71e4d1d', 'f1104cc7-152b-4b3c-87d5-baa2b1055130', '58efe972-2093-453b-9d70-4fb0ecdfc55b', 'Aarogyam 1.8', 5249.00, 6999.00),
('63809e15-880a-463c-bf70-92a869faf081', '4e1c3012-75c6-4aba-a026-d05e5d245aba', '826a4391-f7eb-4b43-ab0d-3c2255660e09', 'FOOD INTOLERANCE PROFILE', 8799.00, 10999.00),
('2479403b-5a6c-4e0f-9cde-60fa35895f6a', '4e1c3012-75c6-4aba-a026-d05e5d245aba', 'f447558f-714c-4387-b330-79c2f30950cc', 'Aarogyam 1.3', 2549.00, 3399.00),
('38b391e2-7ed7-4ba3-b5a4-72f0287e575d', '4e1c3012-75c6-4aba-a026-d05e5d245aba', '58efe972-2093-453b-9d70-4fb0ecdfc55b', 'Aarogyam 1.8', 5249.00, 6999.00),
('a1b162fa-19c0-48f2-ad3d-544c0f970dc1', '5e312a2b-5d47-4f05-a759-b51a0f0bd191', 'a8c2da8a-2065-4ed0-bf21-6d671b2362c2', 'Complete Blood Count (CBC)', 300.00, 500.00),
('0c210a6f-6eee-4382-b523-5f09cbbab938', '4453496b-40fb-4b91-85f6-5dc251b9254e', 'c4ad5b89-e377-457c-95b7-5ac18a051266', 'Vitamin B12', 500.00, 900.00);

-- =============================================
-- END OF SCRIPT
-- =============================================
