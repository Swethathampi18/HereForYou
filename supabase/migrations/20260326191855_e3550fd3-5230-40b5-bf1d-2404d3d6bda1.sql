
-- Add status column to sessions_log for tracking attendance
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions_log' AND column_name = 'status' AND table_schema = 'public') THEN
    ALTER TABLE public.sessions_log ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  referring_therapist_id uuid NOT NULL,
  referred_to text NOT NULL,
  specialty text,
  reason text NOT NULL,
  urgency text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can insert own referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referring_therapist_id);
CREATE POLICY "Therapists can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referring_therapist_id);
CREATE POLICY "Patients can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Guardians can view linked minor referrals" ON public.referrals FOR SELECT USING (is_guardian_of(auth.uid(), patient_id));
CREATE POLICY "Supervisors/admins can view all referrals" ON public.referrals FOR SELECT USING (has_role(auth.uid(), 'supervisor') OR has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  sender_id uuid,
  type text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
