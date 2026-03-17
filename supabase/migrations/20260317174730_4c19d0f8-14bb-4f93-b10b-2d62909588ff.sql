
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Disaster severity enum
CREATE TYPE public.disaster_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.disaster_status AS ENUM ('pending', 'approved', 'rejected', 'resolved');
CREATE TYPE public.disaster_type AS ENUM ('earthquake', 'flood', 'fire', 'hurricane', 'tornado', 'tsunami', 'landslide', 'drought', 'other');

-- Disaster reports table
CREATE TABLE public.disaster_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  disaster_type public.disaster_type NOT NULL DEFAULT 'other',
  severity public.disaster_severity NOT NULL DEFAULT 'medium',
  status public.disaster_status NOT NULL DEFAULT 'pending',
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disaster_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reports" ON public.disaster_reports
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create reports" ON public.disaster_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.disaster_reports
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reports" ON public.disaster_reports
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Resources table
CREATE TYPE public.resource_type AS ENUM ('hospital', 'shelter', 'food_center', 'fire_station', 'police_station', 'other');

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  resource_type public.resource_type NOT NULL,
  description TEXT,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  phone TEXT,
  capacity INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity public.disaster_severity NOT NULL DEFAULT 'medium',
  disaster_type public.disaster_type,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active alerts" ON public.alerts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage alerts" ON public.alerts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- AI Predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_type public.disaster_type NOT NULL,
  probability DOUBLE PRECISION NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  description TEXT,
  predicted_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Admins can manage predictions" ON public.predictions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for alerts and disaster_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disaster_reports;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_disaster_reports_updated_at BEFORE UPDATE ON public.disaster_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for disaster images
INSERT INTO storage.buckets (id, name, public) VALUES ('disaster-images', 'disaster-images', true);

CREATE POLICY "Anyone can view disaster images" ON storage.objects FOR SELECT USING (bucket_id = 'disaster-images');
CREATE POLICY "Authenticated users can upload disaster images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'disaster-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own disaster images" ON storage.objects FOR DELETE USING (bucket_id = 'disaster-images' AND auth.uid() IS NOT NULL);
