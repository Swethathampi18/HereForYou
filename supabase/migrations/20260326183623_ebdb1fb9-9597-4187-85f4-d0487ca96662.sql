
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('patient', 'guardian', 'therapist', 'supervisor', 'admin');
CREATE TYPE public.severity_level AS ENUM ('low', 'moderate', 'high');
CREATE TYPE public.intake_status AS ENUM ('in_progress', 'completed', 'escalated');
CREATE TYPE public.match_type AS ENUM ('group', 'individual');
CREATE TYPE public.prior_auth_status AS ENUM ('pending', 'drafted', 'submitted', 'approved', 'rejected');
CREATE TYPE public.claims_status AS ENUM ('pending', 'validated', 'flagged', 'submitted');
CREATE TYPE public.group_type AS ENUM ('cbt_anxiety', 'alcohol_recovery', 'workplace_burnout', 'teen_anxiety', 'gad_mindfulness');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  age INT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- GUARDIAN LINKS
CREATE TABLE public.guardian_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(guardian_id, patient_id)
);
ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;

-- INTAKE SESSIONS
CREATE TABLE public.intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  conversation_json JSONB DEFAULT '[]'::jsonb,
  structured_features JSONB,
  severity_level severity_level,
  confidence_score FLOAT,
  icd10_suggestion TEXT,
  cpt_suggestion TEXT,
  crisis_flag BOOLEAN DEFAULT false,
  human_review_required BOOLEAN DEFAULT false,
  status intake_status NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.intake_sessions ENABLE ROW LEVEL SECURITY;

-- CRISIS EVENTS
CREATE TABLE public.crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intake_session_id UUID REFERENCES public.intake_sessions(id),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  escalated_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  notes TEXT
);
ALTER TABLE public.crisis_events ENABLE ROW LEVEL SECURITY;

-- THERAPY GROUPS
CREATE TABLE public.therapy_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type group_type NOT NULL,
  therapist_id UUID REFERENCES auth.users(id),
  max_capacity INT DEFAULT 10,
  current_count INT DEFAULT 0,
  schedule_json JSONB,
  severity_range severity_level,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.therapy_groups ENABLE ROW LEVEL SECURITY;

-- MATCHES
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.therapy_groups(id),
  therapist_id UUID REFERENCES auth.users(id),
  match_type match_type NOT NULL,
  match_score FLOAT,
  match_rationale TEXT,
  prior_auth_status prior_auth_status DEFAULT 'pending',
  prior_auth_draft TEXT,
  waitlist_position INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- SESSIONS LOG
CREATE TABLE public.sessions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES auth.users(id),
  session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes_text TEXT,
  coded_diagnosis TEXT,
  claims_status claims_status DEFAULT 'pending',
  mismatch_flag BOOLEAN DEFAULT false,
  mismatch_reason TEXT
);
ALTER TABLE public.sessions_log ENABLE ROW LEVEL SECURITY;

-- AUDIT LOG
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  confidence FLOAT,
  human_override BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- MOOD CHECKINS
CREATE TABLE public.mood_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 1 AND score <= 10),
  notes TEXT,
  ai_flag BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;

-- WAITLIST
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.therapy_groups(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified BOOLEAN DEFAULT false
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_guardian_of(_guardian_id UUID, _patient_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.guardian_links WHERE guardian_id = _guardian_id AND patient_id = _patient_id)
$$;

CREATE OR REPLACE FUNCTION public.is_therapist_for(_therapist_id UUID, _patient_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.matches WHERE therapist_id = _therapist_id AND user_id = _patient_id)
$$;

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Supervisors/admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Guardians can view linked minor profile" ON public.profiles FOR SELECT USING (public.is_guardian_of(auth.uid(), id));
CREATE POLICY "Therapists can view assigned patient profile" ON public.profiles FOR SELECT USING (public.is_therapist_for(auth.uid(), id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Supervisors/admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- GUARDIAN_LINKS
CREATE POLICY "Guardians can view own links" ON public.guardian_links FOR SELECT USING (auth.uid() = guardian_id OR auth.uid() = patient_id);
CREATE POLICY "Admins can view all links" ON public.guardian_links FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Guardians can create links" ON public.guardian_links FOR INSERT WITH CHECK (auth.uid() = guardian_id AND public.has_role(auth.uid(), 'guardian'));

-- INTAKE_SESSIONS
CREATE POLICY "Patients can view own intakes" ON public.intake_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Therapists can view assigned patient intakes" ON public.intake_sessions FOR SELECT USING (public.is_therapist_for(auth.uid(), user_id));
CREATE POLICY "Supervisors/admins can view all intakes" ON public.intake_sessions FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can insert own intakes" ON public.intake_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Patients can update own intakes" ON public.intake_sessions FOR UPDATE USING (auth.uid() = user_id);

-- CRISIS_EVENTS
CREATE POLICY "Patients can view own crisis events" ON public.crisis_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Supervisors/admins can view all crisis events" ON public.crisis_events FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Therapists can view assigned patient crisis" ON public.crisis_events FOR SELECT USING (public.is_therapist_for(auth.uid(), user_id));
CREATE POLICY "Authenticated can insert crisis events" ON public.crisis_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- THERAPY_GROUPS
CREATE POLICY "Authenticated can view active groups" ON public.therapy_groups FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Supervisors/admins can view all groups" ON public.therapy_groups FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Therapists can create own groups" ON public.therapy_groups FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'therapist') AND auth.uid() = therapist_id);
CREATE POLICY "Therapists can update own groups" ON public.therapy_groups FOR UPDATE USING (auth.uid() = therapist_id);

-- MATCHES
CREATE POLICY "Patients can view own matches" ON public.matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Guardians can view linked minor matches" ON public.matches FOR SELECT USING (public.is_guardian_of(auth.uid(), user_id));
CREATE POLICY "Therapists can view assigned matches" ON public.matches FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "Supervisors/admins can view all matches" ON public.matches FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- SESSIONS_LOG
CREATE POLICY "Patients can view own sessions" ON public.sessions_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Therapists can view assigned sessions" ON public.sessions_log FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "Therapists can insert sessions" ON public.sessions_log FOR INSERT WITH CHECK (auth.uid() = therapist_id);
CREATE POLICY "Therapists can update sessions" ON public.sessions_log FOR UPDATE USING (auth.uid() = therapist_id);
CREATE POLICY "Supervisors/admins can view all sessions" ON public.sessions_log FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

-- AUDIT_LOG
CREATE POLICY "All authenticated can insert audit log" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Supervisors/admins can read audit log" ON public.audit_log FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

-- MOOD_CHECKINS
CREATE POLICY "Patients can view own mood" ON public.mood_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own mood" ON public.mood_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Patients can update own mood" ON public.mood_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Guardians can view linked minor mood" ON public.mood_checkins FOR SELECT USING (public.is_guardian_of(auth.uid(), user_id));
CREATE POLICY "Therapists can view assigned patient mood" ON public.mood_checkins FOR SELECT USING (public.is_therapist_for(auth.uid(), user_id));
CREATE POLICY "Supervisors/admins can view all mood" ON public.mood_checkins FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

-- WAITLIST
CREATE POLICY "Patients can view own waitlist" ON public.waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supervisors/admins can view all waitlist" ON public.waitlist FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
