-- =============================================
-- Thyrocare Nagercoil - Full PostgreSQL Schema + Data
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

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE test_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏥',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  test_id UUID REFERENCES lab_tests(id),
  test_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL
);

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

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  parent_id UUID REFERENCES menu_items(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  title TEXT,
  content JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}',
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT DEFAULT 'checkout',
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
BEGIN NEW.updated_at = now(); RETURN NEW; END;
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
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION get_profile_by_phone(p_phone TEXT)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v_result JSON;
BEGIN
  SELECT json_build_object('full_name', p.full_name, 'email', p.email, 'phone', p.phone)
  INTO v_result FROM profiles p WHERE p.phone = p_phone LIMIT 1;
  RETURN v_result;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_categories_updated_at BEFORE UPDATE ON test_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();
CREATE TRIGGER generate_test_code_trigger BEFORE INSERT ON lab_tests FOR EACH ROW EXECUTE FUNCTION generate_test_id();

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
-- DATA: test_categories
-- =============================================

INSERT INTO test_categories (id, name, icon, is_active, sort_order) VALUES
('e6af6ea5-1ddd-4343-820c-86ad279cb131', 'Aarogyam', 'ShieldCheck', true, 0),
('8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 'Health Packages', '🏥', true, 1),
('b998bcd1-5eb8-4a9c-8b61-d0c0955368cb', 'Thyroid Profile', '🦋', true, 2),
('5a59f11a-fcb5-47e4-86f5-613d518d2d12', 'Diabetes', '🩸', true, 3),
('245629f1-12a5-42fe-8bb0-5f3af7ec95ec', 'Liver Function', '🫁', true, 4),
('55708bf8-ce74-4e43-a3e6-ebd648638ceb', 'Kidney Function', '🫘', true, 5),
('ab8918f9-7b82-4857-8353-fea5ff7e4ba5', 'Heart Health', '❤️', true, 6),
('290635b5-2ce9-48f7-a3ee-52aa09ae9381', 'Vitamins', '☀️', true, 7),
('c46089ab-e62e-4a99-b51c-e3aa18c5a1f0', 'Allergy', '🤧', true, 8);

-- =============================================
-- DATA: lab_tests
-- =============================================

INSERT INTO lab_tests (id, name, description, price, original_price, test_code, parameters, parameters_list, parameters_grouped, category_id, sample_type, turnaround, fasting_required, is_active, is_popular) VALUES
('24b8181c-dad5-4f5c-860e-94c1e8718277', 'Vitamin D (25-OH)', 'Measures Vitamin D levels to assess bone health and immune function.', 600.00, 1200.00, 'VITDC', 1, ARRAY['25-Hydroxy Vitamin D'], '[]', '290635b5-2ce9-48f7-a3ee-52aa09ae9381', 'Blood', '24 hours', false, true, true),
('c4ad5b89-e377-457c-95b7-5ac18a051266', 'Vitamin B12', 'Evaluates B12 levels essential for nerve function and red blood cell production.', 500.00, 900.00, 'VITB', 1, ARRAY['Vitamin B12'], '[]', '290635b5-2ce9-48f7-a3ee-52aa09ae9381', 'Blood', '24 hours', false, true, true),
('f447558f-714c-4387-b330-79c2f30950cc', 'Aarogyam 1.3', 'Complete health checkup package covering thyroid, diabetes, liver, kidney, lipid profile, iron, and vitamin tests.', 1400.00, 2800.00, 'AAOG13', 8, ARRAY['CBC','Thyroid Profile','Lipid Profile','Liver Function','Kidney Function','Iron Studies','Vitamin B12','Vitamin D'], '[]', '8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 'Blood', '24-48 hours', true, true, true),
('58efe972-2093-453b-9d70-4fb0ecdfc55b', 'Aarogyam 1.8', 'Advanced health checkup with extended cardiac markers, hormones, and cancer screening markers.', 2200.00, 4500.00, 'AAOG18', 8, ARRAY['CBC','Thyroid Profile','Lipid Profile','Liver Function','Kidney Function','Cardiac Risk Markers','Hormone Panel','Tumor Markers'], '[]', '8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 'Blood', '24-48 hours', true, true, true),
('6390ae89-8a57-4ab1-bbb3-38c6fa319edd', 'Thyroid Profile Total', 'Complete thyroid function test including T3, T4, and TSH to evaluate thyroid health.', 350.00, 700.00, 'TPFT', 3, ARRAY['T3 Total','T4 Total','TSH'], '[]', 'b998bcd1-5eb8-4a9c-8b61-d0c0955368cb', 'Blood', '24 hours', false, true, true),
('71405178-f130-43f6-a4d5-3b11b52463b3', 'Thyroid Free Profile', 'Free T3 and Free T4 along with TSH for precise thyroid assessment.', 500.00, 900.00, 'TPFT3T4', 3, ARRAY['Free T3','Free T4','TSH'], '[]', 'b998bcd1-5eb8-4a9c-8b61-d0c0955368cb', 'Blood', '24 hours', false, true, false),
('1a00b355-aa96-40ae-810d-31aded16e5c7', 'HbA1c (Glycated Hemoglobin)', 'Measures average blood sugar levels over the past 2-3 months for diabetes management.', 350.00, 600.00, 'HBA1C', 1, ARRAY['HbA1c'], '[]', '5a59f11a-fcb5-47e4-86f5-613d518d2d12', 'Blood', '24 hours', false, true, true),
('bd0f8136-b3e4-4228-bd56-ac97c769d26b', 'Diabetes Screening Panel', 'Complete diabetes screening with fasting glucose, HbA1c, and insulin levels.', 800.00, 1500.00, 'DIASP', 5, ARRAY['Fasting Glucose','Post Prandial Glucose','HbA1c','Insulin Fasting','HOMA-IR'], '[]', '5a59f11a-fcb5-47e4-86f5-613d518d2d12', 'Blood', '24-48 hours', true, true, false),
('b4b8f74c-15b2-48cd-bb8e-a84e3fea2431', 'Lipid Profile', 'Comprehensive cholesterol and triglyceride assessment for heart health.', 400.00, 700.00, 'LIPPF', 8, ARRAY['Total Cholesterol','HDL','LDL','VLDL','Triglycerides','TC/HDL Ratio','LDL/HDL Ratio','Non-HDL Cholesterol'], '[]', 'ab8918f9-7b82-4857-8353-fea5ff7e4ba5', 'Blood', '24 hours', true, true, true),
('bc16569b-c5fb-4410-adc2-588c7f86cdb1', 'Liver Function Test (LFT)', 'Evaluates liver health by measuring enzymes, proteins, and bilirubin.', 450.00, 800.00, 'LFT', 12, ARRAY['SGOT','SGPT','ALP','GGT','Total Bilirubin','Direct Bilirubin','Total Protein','Albumin','Globulin','A/G Ratio','Indirect Bilirubin','Protein AG Ratio'], '[]', '245629f1-12a5-42fe-8bb0-5f3af7ec95ec', 'Blood', '24 hours', true, true, false),
('c1d5cb58-f2ab-48a1-b1f3-cd3d0110a4bd', 'Kidney Function Test (KFT)', 'Comprehensive renal function assessment including creatinine, BUN, and uric acid.', 400.00, 750.00, 'KFT', 5, ARRAY['Creatinine','BUN','Uric Acid','BUN/Creatinine Ratio','eGFR'], '[]', '55708bf8-ce74-4e43-a3e6-ebd648638ceb', 'Blood', '24 hours', false, true, false),
('a8c2da8a-2065-4ed0-bf21-6d671b2362c2', 'Complete Blood Count (CBC)', 'Evaluates overall health by measuring red cells, white cells, hemoglobin, and platelets.', 300.00, 500.00, 'CBC', 8, ARRAY['Hemoglobin','RBC Count','WBC Count','Platelet Count','PCV','MCV','MCH','MCHC'], '[]', '8c5dbb0c-e3c4-4000-b5c2-08ca31a28cfb', 'Blood', '24 hours', false, true, true),
('ce738d0b-eb2f-47ae-a2a5-e1f32c960078', 'AAROGYAM CAMP PROFILE 1', 'Aarogyam Camp Profile 1 is a preventive care package that is designed to provide a comprehensive overview of one''s health. It includes 62 tests that help with early detection of various diseases and conditions.', 999.00, 2500.00, 'AACP1', 62, ARRAY['Hba1c','Average blood glucose (abg)','Hemoglobin','Total leucocytes count (wbc)','Platelet count','Total rbc','Alkaline phosphatase','Bilirubin - total','SGOT','SGPT','Protein - total','Albumin - serum','Creatinine - serum','Blood urea nitrogen (bun)','Uric acid','Calcium','Total cholesterol','HDL cholesterol','LDL cholesterol','Triglycerides','T3','T4','TSH'], '[{"count":2,"group":"Diabetes","tests":["Hba1c","Average blood glucose (abg)"]},{"count":28,"group":"Complete Hemogram","tests":["Hemoglobin","WBC","RBC","Platelet count"]},{"count":12,"group":"Liver","tests":["SGOT","SGPT","ALP","Bilirubin"]},{"count":7,"group":"Renal","tests":["Creatinine","BUN","Uric acid"]},{"count":10,"group":"Lipid","tests":["Cholesterol","HDL","LDL","Triglycerides"]},{"count":3,"group":"Thyroid","tests":["T3","T4","TSH"]}]', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 'Blood', '24-48 hours', true, true, true),
('a62c67e5-259e-4488-966f-ea4b25ae09dc', 'AAROGYAM CAMP PROFILE 2', 'Aarogyam Camp Profile 2 is a preventive care package that includes 69 tests for comprehensive health evaluation including cardiac risk markers and vitamins.', 1699.00, 3399.00, 'AACP2', 69, ARRAY['Hba1c','Average blood glucose (abg)','Hemoglobin','WBC','Platelet count','SGOT','SGPT','Creatinine','BUN','Uric acid','Total cholesterol','HDL','LDL','Triglycerides','T3','T4','TSH','Vitamin D','Vitamin B12','hs-CRP','Lipoprotein(a)','Apolipoprotein A1','Apolipoprotein B'], '[{"count":5,"group":"Cardiac Risk Markers","tests":["hs-CRP","Lipoprotein(a)","Apo A1","Apo B"]},{"count":2,"group":"Diabetes","tests":["Hba1c","ABG"]},{"count":28,"group":"Complete Hemogram","tests":["Hemoglobin","WBC","RBC"]},{"count":12,"group":"Liver","tests":["SGOT","SGPT"]},{"count":7,"group":"Renal","tests":["Creatinine","BUN"]},{"count":10,"group":"Lipid","tests":["Cholesterol","HDL","LDL"]},{"count":3,"group":"Thyroid","tests":["T3","T4","TSH"]},{"count":2,"group":"Vitamin","tests":["Vitamin D","Vitamin B12"]}]', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 'Blood', '24-48 hours', true, true, true),
('5cd5f888-2836-4a39-af0c-4a35844770e1', 'AAROGYAM C PRO INCLUDING CRM WITH UTSH', 'Comprehensive package of 76 parameters with Cardiac Risk Markers, thyroid, liver, kidney, lipid, electrolytes, iron, vitamins, CBC, diabetes and testosterone.', 1699.00, 3399.00, 'AACPRO', 76, ARRAY['Chloride','Sodium','hs-CRP','Lipoprotein(a)','Testosterone','Hba1c','Hemoglobin','WBC','SGOT','SGPT','Iron','TIBC','Creatinine','BUN','Cholesterol','HDL','LDL','T3','T4','TSH','Vitamin D','Vitamin B12'], '[{"count":2,"group":"Electrolytes","tests":["Chloride","Sodium"]},{"count":5,"group":"Cardiac Risk Markers","tests":["hs-CRP","Lipoprotein(a)"]},{"count":1,"group":"Hormone","tests":["Testosterone"]},{"count":2,"group":"Diabetes","tests":["Hba1c","ABG"]},{"count":28,"group":"Complete Hemogram","tests":["Hemoglobin","WBC"]},{"count":12,"group":"Liver","tests":["SGOT","SGPT"]},{"count":4,"group":"Iron Deficiency","tests":["Iron","TIBC"]},{"count":7,"group":"Renal","tests":["Creatinine","BUN"]},{"count":10,"group":"Lipid","tests":["Cholesterol","HDL"]},{"count":3,"group":"Thyroid","tests":["T3","T4","TSH"]},{"count":2,"group":"Vitamin","tests":["Vitamin D","Vitamin B12"]}]', 'e6af6ea5-1ddd-4343-820c-86ad279cb131', 'Blood', '24-48 hours', true, true, true);

-- =============================================
-- DATA: testimonials
-- =============================================

INSERT INTO testimonials (id, customer_name, customer_location, review, rating, is_active, sort_order) VALUES
('7a44139d-8901-443e-a1db-c9ae169aa62c', 'Priya Krishnan', 'Madurai, Tamil Nadu', 'Excellent service! The home collection was on time and the reports were delivered within 24 hours. Very professional phlebotomist.', 5, true, 1),
('1df27e88-d7d5-451b-b3e4-825243753a3c', 'Rajesh Kumar', 'Thirumangalam, Madurai', 'Very affordable prices compared to other labs. The staff is friendly and the reports are accurate. Highly recommended for families!', 5, true, 2),
('1368d631-764c-4fc9-8f60-249aa9db831b', 'Lakshmi Devi', 'Anna Nagar, Madurai', 'Got my thyroid profile done here. Quick and hassle-free process. The online booking made it so convenient. Will definitely use again.', 4, true, 3),
('e92197b7-ddf4-4889-8e89-a0fb79816339', 'Suresh Babu', 'KK Nagar, Madurai', 'I have been using Daniel Homoeo Clinic for all my lab tests for over a year now. Consistently reliable results and great customer support.', 5, true, 4),
('4198e08a-6522-4d8d-916e-09b849c84b26', 'Meena Sundaram', 'Tallakulam, Madurai', 'The complete health checkup package was worth every rupee. Detailed reports with doctor consultation. Best diagnostic service in Madurai!', 5, true, 5),
('748645b1-bbc4-4167-bdf3-f546bd608b17', 'Karthik Vel', 'Mattuthavani, Madurai', 'Booked a lipid profile test online. The sample collection guy came right on time. Got my reports via email the next day. Very convenient!', 4, true, 6);

-- =============================================
-- DATA: menu_items
-- =============================================

INSERT INTO menu_items (id, label, href, is_active, sort_order) VALUES
('f82570e8-f286-4ee3-8db7-a0548f86f646', 'Home', '/', true, 1),
('2be7bfa1-c859-41fd-abeb-e7e7c60d4b2f', 'Book a Test', '/tests', true, 2),
('6e3fea94-b850-484f-a321-d51fcd412b0f', 'Health Packages', '/tests?category=health-packages', true, 3),
('939d7704-479f-481d-9d1f-0d388b19eb54', 'About', '/about', true, 4),
('58197d28-88bd-47fe-ba77-b9c0c39559f5', 'Contact', '/contact', true, 5);

-- =============================================
-- DATA: site_settings
-- =============================================

INSERT INTO site_settings (id, setting_key, setting_value) VALUES
('bd015998-ad97-40d5-8edc-73d44154388a', 'payment_gateway', '{"is_sandbox": true, "razorpay_key_id": "rzp_test_1DP5mmOlF5G5ag", "razorpay_key_secret": "thisissecretkey123456"}'),
('1f50c575-cebf-46bc-9030-93bce8bb3aa5', 'fallback_otp', '{"code": "226688", "enabled": true}');

-- =============================================
-- DATA: email_templates
-- =============================================

INSERT INTO email_templates (id, name, template_key, subject, body_html, description, available_variables, is_active) VALUES
('efca8d4e-730f-41b1-a178-e5cc7a274509', 'Order Confirmation - Customer', 'order_confirmation_customer', 'Your Order {{order_number}} is Confirmed! 🎉',
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
    <p style="color: #555;">Our phlebotomist will visit your address for sample collection.</p>
    <p style="color: #555;">For any queries, contact us at <strong>+91 98765 43210</strong></p>
  </div>
  <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #999; font-size: 12px; margin: 0;">© {{year}} Daniel Homoeo Clinic. All rights reserved.</p>
  </div>
</div>',
'Sent to customer when an order is placed',
'[{"key":"customer_name","label":"Customer Name"},{"key":"customer_email","label":"Customer Email"},{"key":"customer_phone","label":"Customer Phone"},{"key":"order_number","label":"Order Number"},{"key":"test_names","label":"Test Names"},{"key":"total_amount","label":"Total Amount"},{"key":"total_savings","label":"Total Savings"},{"key":"preferred_date","label":"Preferred Date"},{"key":"preferred_time","label":"Preferred Time"},{"key":"address","label":"Full Address"},{"key":"payment_status","label":"Payment Status"},{"key":"year","label":"Current Year"}]',
true),

('e6a4b648-de41-49e3-b574-0f9804734140', 'New Order Alert - Admin', 'order_confirmation_admin', 'New Order Received: {{order_number}} from {{customer_name}}',
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
'[{"key":"customer_name","label":"Customer Name"},{"key":"customer_email","label":"Customer Email"},{"key":"customer_phone","label":"Customer Phone"},{"key":"order_number","label":"Order Number"},{"key":"test_names","label":"Test Names"},{"key":"total_amount","label":"Total Amount"},{"key":"total_savings","label":"Total Savings"},{"key":"preferred_date","label":"Preferred Date"},{"key":"preferred_time","label":"Preferred Time"},{"key":"address","label":"Full Address"},{"key":"payment_status","label":"Payment Status"},{"key":"year","label":"Current Year"}]',
true);
