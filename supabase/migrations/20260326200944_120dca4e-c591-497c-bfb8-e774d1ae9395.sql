
-- Add RLS policies for patient_reports
ALTER TABLE public.patient_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own reports" ON public.patient_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Therapists can view sent reports" ON public.patient_reports FOR SELECT USING (auth.uid() = sent_to_therapist_id);
CREATE POLICY "Supervisors/admins can view all reports" ON public.patient_reports FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert reports" ON public.patient_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update reports" ON public.patient_reports FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add UPDATE policy for matches (needed for join group / booking)
CREATE POLICY "Therapists can update assigned matches" ON public.matches FOR UPDATE USING (auth.uid() = therapist_id);
CREATE POLICY "Patients can update own matches" ON public.matches FOR UPDATE USING (auth.uid() = user_id);

-- Add UPDATE policy for therapy_groups current_count
-- (already has therapist update policy)

-- Add RLS policies for therapists table
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view therapists" ON public.therapists FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Therapists can update own profile" ON public.therapists FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Therapists can insert own profile" ON public.therapists FOR INSERT WITH CHECK (auth.uid() = id);

-- Add guardian can view linked minor sessions
CREATE POLICY "Guardians can view linked minor sessions" ON public.sessions_log FOR SELECT USING (is_guardian_of(auth.uid(), user_id));
