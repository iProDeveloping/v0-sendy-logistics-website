-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service_type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMS content for editable pages
CREATE TABLE IF NOT EXISTS cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  meta_description TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking packages (for track package feature)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  sender_name TEXT,
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned')),
  estimated_delivery TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package tracking history
CREATE TABLE IF NOT EXISTS package_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  event_time TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users profile (linked to auth.users)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Public can insert contact submissions
CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Public can read published CMS content
CREATE POLICY "Anyone can read published content" ON cms_content
  FOR SELECT USING (published = true);

-- Public can read published FAQs
CREATE POLICY "Anyone can read published faqs" ON faqs
  FOR SELECT USING (published = true);

-- Public can read packages by tracking number (handled in API)
CREATE POLICY "Anyone can read packages" ON packages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read package events" ON package_events
  FOR SELECT USING (true);

-- Admin policies (for authenticated users in admin_profiles)
CREATE POLICY "Admins can do everything on contact_submissions" ON contact_submissions
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Admins can do everything on cms_content" ON cms_content
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Admins can do everything on faqs" ON faqs
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Admins can do everything on packages" ON packages
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Admins can do everything on package_events" ON package_events
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Admins can read admin_profiles" ON admin_profiles
  FOR SELECT USING (auth.uid() = id);

-- Insert default CMS content
INSERT INTO cms_content (page_slug, title, content, meta_description) VALUES
('about', 'About Us', '{"hero_title": "About Sendy Logistics", "hero_subtitle": "The Company That Delivers", "mission": "Our mission is to provide reliable, efficient, and customer-focused delivery solutions for businesses and individuals alike.", "story": "Founded with a simple goal: make deliveries stress-free. Sendy Logistics has grown from a local messenger service to a comprehensive logistics partner for corporations, retailers, and everyday customers.", "values": ["Reliability", "Speed", "Customer Focus", "Innovation"]}', 'Learn about Sendy Logistics - your trusted delivery partner for corporate, retail, and personal deliveries.'),
('careers', 'Careers', '{"hero_title": "Join the Sendy Team", "hero_subtitle": "Build your career with us", "intro": "Were always looking for passionate individuals to join our growing team. At Sendy, youll be part of a company that values hard work, innovation, and excellent service.", "benefits": ["Competitive pay", "Health benefits", "Growth opportunities", "Flexible schedules"]}', 'Explore career opportunities at Sendy Logistics. Join our team of dedicated delivery professionals.'),
('privacy', 'Privacy Policy', '{"title": "Privacy Policy", "last_updated": "2025-01-01", "sections": [{"heading": "Information We Collect", "content": "We collect information you provide directly to us, such as when you fill out a contact form, create an account, or communicate with us."}, {"heading": "How We Use Your Information", "content": "We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you."}, {"heading": "Information Sharing", "content": "We do not sell, trade, or otherwise transfer your personal information to outside parties except as necessary to provide our services."}, {"heading": "Contact Us", "content": "If you have questions about this Privacy Policy, please contact us at privacy@sendylogistics.com."}]}', 'Sendy Logistics Privacy Policy - Learn how we protect and handle your personal information.'),
('terms', 'Terms of Service', '{"title": "Terms of Service", "last_updated": "2025-01-01", "sections": [{"heading": "Acceptance of Terms", "content": "By accessing and using Sendy Logistics services, you accept and agree to be bound by these Terms of Service."}, {"heading": "Services", "content": "Sendy Logistics provides delivery and logistics services for businesses and individuals. Service availability may vary by location."}, {"heading": "User Responsibilities", "content": "Users are responsible for providing accurate delivery information and ensuring items comply with our shipping policies."}, {"heading": "Limitation of Liability", "content": "Sendy Logistics liability is limited to the declared value of shipped items, subject to our insurance policies."}]}', 'Sendy Logistics Terms of Service - Read our terms and conditions for using our delivery services.')
ON CONFLICT (page_slug) DO NOTHING;

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category, sort_order) VALUES
('How do I track my package?', 'You can track your package by entering your tracking number on our Track Package page. Youll see real-time updates on your deliverys status and estimated arrival time.', 'Tracking', 1),
('What areas do you service?', 'Sendy Logistics currently services the greater metropolitan area and surrounding regions. Contact us for specific coverage information.', 'General', 2),
('How do I schedule a pickup?', 'For business accounts, you can schedule pickups through our online Business Portal. For individual shipments, call us at 845-SENDY-GO or fill out our contact form.', 'Services', 3),
('What are your delivery hours?', 'Standard delivery hours are 8 AM to 8 PM, Monday through Saturday. We also offer extended hours and Sunday delivery for business accounts.', 'Services', 4),
('How do returns work?', 'Sendy makes returns easy! We offer pickup from your location, drop-off at return centers, and even label printing. Visit our returns page or contact us to get started.', 'Returns', 5),
('Do you offer same-day delivery?', 'Yes! Same-day delivery is available for orders placed before 10 AM within our standard service area. Rush delivery options are also available.', 'Services', 6)
ON CONFLICT DO NOTHING;
