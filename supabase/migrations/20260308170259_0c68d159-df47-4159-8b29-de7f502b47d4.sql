
-- Email templates table for admin-editable notification emails
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  description text,
  available_variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage templates
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active templates (needed by edge functions via service role)
CREATE POLICY "Service can read templates" ON public.email_templates
  FOR SELECT TO anon
  USING (is_active = true);

-- Updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_key, name, subject, body_html, description, available_variables) VALUES
(
  'order_confirmation_customer',
  'Order Confirmation - Customer',
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
    <p style="color: #555;">For any queries, contact us at <strong>+91 98765 43210</strong> or reply to this email.</p>
  </div>
  <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
    <p style="color: #999; font-size: 12px; margin: 0;">© {{year}} Daniel Homoeo Clinic. All rights reserved.</p>
  </div>
</div>',
  'Sent to customer when an order is placed',
  '[{"key": "customer_name", "label": "Customer Name"}, {"key": "customer_email", "label": "Customer Email"}, {"key": "customer_phone", "label": "Customer Phone"}, {"key": "order_number", "label": "Order Number"}, {"key": "test_names", "label": "Test Names"}, {"key": "total_amount", "label": "Total Amount"}, {"key": "total_savings", "label": "Total Savings"}, {"key": "preferred_date", "label": "Preferred Date"}, {"key": "preferred_time", "label": "Preferred Time"}, {"key": "address", "label": "Full Address"}, {"key": "payment_status", "label": "Payment Status"}, {"key": "year", "label": "Current Year"}]'
),
(
  'order_confirmation_admin',
  'New Order Alert - Admin',
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
  '[{"key": "customer_name", "label": "Customer Name"}, {"key": "customer_email", "label": "Customer Email"}, {"key": "customer_phone", "label": "Customer Phone"}, {"key": "order_number", "label": "Order Number"}, {"key": "test_names", "label": "Test Names"}, {"key": "total_amount", "label": "Total Amount"}, {"key": "total_savings", "label": "Total Savings"}, {"key": "preferred_date", "label": "Preferred Date"}, {"key": "preferred_time", "label": "Preferred Time"}, {"key": "address", "label": "Full Address"}, {"key": "payment_status", "label": "Payment Status"}, {"key": "year", "label": "Current Year"}]'
);
