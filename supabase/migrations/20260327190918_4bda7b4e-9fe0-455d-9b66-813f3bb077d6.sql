
-- Add new profile columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
ADD COLUMN IF NOT EXISTS guardian_relation text;

-- Enable RLS on appointment_history
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own history" ON public.appointment_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view linked minor history" ON public.appointment_history
FOR SELECT USING (is_guardian_of(auth.uid(), user_id));

CREATE POLICY "Therapists can view assigned history" ON public.appointment_history
FOR SELECT USING (auth.uid() = therapist_id);

CREATE POLICY "Authenticated can insert history" ON public.appointment_history
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Supervisors/admins can view all history" ON public.appointment_history
FOR SELECT USING (has_role(auth.uid(), 'supervisor') OR has_role(auth.uid(), 'admin'));

-- Enable RLS on therapist_reports
ALTER TABLE public.therapist_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can insert own reports" ON public.therapist_reports
FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "Therapists can view own reports" ON public.therapist_reports
FOR SELECT USING (auth.uid() = therapist_id);

CREATE POLICY "Therapists can update own reports" ON public.therapist_reports
FOR UPDATE USING (auth.uid() = therapist_id);

CREATE POLICY "Patients can view sent reports" ON public.therapist_reports
FOR SELECT USING (auth.uid() = patient_id AND sent_to_patient = true);

CREATE POLICY "Guardians can view linked minor reports" ON public.therapist_reports
FOR SELECT USING (is_guardian_of(auth.uid(), patient_id) AND sent_to_guardian = true);

CREATE POLICY "Supervisors/admins can view all therapist reports" ON public.therapist_reports
FOR SELECT USING (has_role(auth.uid(), 'supervisor') OR has_role(auth.uid(), 'admin'));

-- Allow patients to insert sessions_log (for booking)
CREATE POLICY "Patients can insert own sessions" ON public.sessions_log
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow patients to update own sessions (for cancel/reschedule)
CREATE POLICY "Patients can update own sessions" ON public.sessions_log
FOR UPDATE USING (auth.uid() = user_id);

-- Allow guardians to insert sessions for linked minors
CREATE POLICY "Guardians can insert sessions for linked minors" ON public.sessions_log
FOR INSERT WITH CHECK (is_guardian_of(auth.uid(), user_id));

-- Allow guardians to update sessions for linked minors
CREATE POLICY "Guardians can update sessions for linked minors" ON public.sessions_log
FOR UPDATE USING (is_guardian_of(auth.uid(), user_id));

-- Update handle_new_user to store new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, age, language, gender, phone, address, city, pincode, country, guardian_relation)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    (NEW.raw_user_meta_data->>'age')::integer,
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'pincode',
    COALESCE(NEW.raw_user_meta_data->>'country', 'India'),
    NEW.raw_user_meta_data->>'guardian_relation'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'));
  RETURN NEW;
END;
$function$;
