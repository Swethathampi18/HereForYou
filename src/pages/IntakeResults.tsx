import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Users, FileText, MapPin, Loader2, Phone, AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDisplayDate, formatDisplayTime, scheduleAppointment, tomorrowAt10AM } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const DEFAULT_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

const IntakeResults = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [intake, setIntake] = useState<any>(null);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [sessionType, setSessionType] = useState<"in-person" | "online">("in-person");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<any>(null);

  // High risk auto-assign
  const [crisisModal, setCrisisModal] = useState(false);
  const [autoAssigned, setAutoAssigned] = useState<any>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Get latest intake
    const { data: intakeData } = await supabase
      .from("intake_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setIntake(intakeData);

    // Get therapists
    const { data: therapistsData } = await supabase
      .from("therapists")
      .select("*")
      .eq("accepting_patients", true);

    const tData = therapistsData || [];
    if (tData.length > 0) {
      const ids = tData.map((t) => t.id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, city").in("id", ids);
      for (const t of tData) {
        const p = profiles?.find((p) => p.id === t.id);
        (t as any).full_name = p?.full_name || "Therapist";
        if (!t.city && p?.city) t.city = p.city;
      }
    }
    setTherapists(tData);

    // If high risk, auto-assign immediately
    if (intakeData && (intakeData.severity_level === "high" || intakeData.crisis_flag)) {
      await autoAssignTherapist(tData, intakeData);
    }

    setLoading(false);
  };

  const autoAssignTherapist = async (availableTherapists: any[], intakeData: any) => {
    if (!user || availableTherapists.length === 0) return;

    const therapist = availableTherapists[Math.floor(Math.random() * availableTherapists.length)];
    const sessionDate = tomorrowAt10AM();

    // Create match
    await supabase.from("matches").insert({
      user_id: user.id,
      therapist_id: therapist.id,
      match_type: "individual" as const,
      match_score: 1.0,
      match_rationale: "Auto-assigned — high risk case",
    });

    // Create session
    await supabase.from("sessions_log").insert({
      user_id: user.id,
      therapist_id: therapist.id,
      session_date: sessionDate,
      status: "pending",
      claims_status: "pending" as const,
    });

    // Notify therapist
    await supabase.from("notifications").insert({
      recipient_id: therapist.id,
      sender_id: user.id,
      type: "crisis",
      message: `URGENT: ${profile?.full_name || "A patient"} has been flagged for crisis. Immediate attention required.`,
    } as any);

    // Notify patient
    await supabase.from("notifications").insert({
      recipient_id: user.id,
      type: "appointment_confirmed",
      message: `You have been assigned to ${(therapist as any).full_name}. They will contact you shortly. You are not alone.`,
    } as any);

    setAutoAssigned({ ...therapist, sessionDate });
    setCrisisModal(true);
  };

  const confirmBooking = async () => {
    if (!user || !selectedTherapist || !selectedDate || !selectedTime) return;
    setBooking(true);

    const sessionDateISO = scheduleAppointment(selectedDate, selectedTime);
    const therapistName = (selectedTherapist as any).full_name;

    // Insert session
    const { error } = await supabase.from("sessions_log").insert({
      user_id: user.id,
      therapist_id: selectedTherapist.id,
      session_date: sessionDateISO,
      session_type: sessionType,
      status: "pending",
      claims_status: "pending" as const,
      notes_text: notes || null,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      setBooking(false);
      return;
    }

    // Upsert match
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (existingMatch) {
      await supabase.from("matches").update({
        therapist_id: selectedTherapist.id,
        match_type: "individual" as const,
        match_rationale: "Patient selected",
      } as any).eq("id", existingMatch.id);
    } else {
      await supabase.from("matches").insert({
        user_id: user.id,
        therapist_id: selectedTherapist.id,
        match_type: "individual" as const,
        match_rationale: "Patient selected",
      });
    }

    // Generate report
    if (intake?.id) {
      supabase.functions.invoke("generate-report", {
        body: { intake_session_id: intake.id, user_id: user.id },
      });
    }

    // Notifications
    const formattedDate = formatDisplayDate(sessionDateISO);
    const formattedTime = formatDisplayTime(sessionDateISO);

    await supabase.from("notifications").insert({
      recipient_id: selectedTherapist.id,
      sender_id: user.id,
      type: "new_appointment",
      message: `${profile?.full_name || "A patient"} has booked an appointment with you on ${formattedDate} at ${formattedTime}. Their health report has been attached.`,
    } as any);

    await supabase.from("notifications").insert({
      recipient_id: user.id,
      type: "appointment_confirmed",
      message: `Your appointment with ${therapistName} is confirmed for ${formattedDate} at ${formattedTime}.`,
    } as any);

    setBookedDetails({
      therapistName,
      credentials: selectedTherapist.credentials,
      date: formattedDate,
      time: formattedTime,
      sessionType,
    });
    setBooked(true);
    setSelectedTherapist(null);
    setBooking(false);
    toast({ title: `Appointment confirmed with ${therapistName} on ${formattedDate} at ${formattedTime}!` });
  };

  const getNext7Days = () => {
    const days: { label: string; value: string; dayName: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      days.push({
        label: `${d.getDate()}`,
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        dayName: d.toLocaleDateString("en", { weekday: "short" }),
      });
    }
    return days;
  };

  const getSlots = (therapist: any): string[] => {
    if (therapist?.available_slots && Array.isArray(therapist.available_slots) && therapist.available_slots.length > 0) {
      return therapist.available_slots as string[];
    }
    return DEFAULT_SLOTS;
  };

  const formatSlotTime = (slot: string) => {
    const [h, m] = slot.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const severity = intake?.severity_level || "moderate";
  const isHighRisk = severity === "high" || intake?.crisis_flag;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 flex items-start justify-center p-6 md:p-8">
        <PageTransition>
          <div className="w-full max-w-4xl">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : booked && bookedDetails ? (
              /* Booking Confirmation */
              <div className="bg-card rounded-xl shadow-sm border p-8 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Appointment Confirmed!</h1>
                <div className="bg-muted/50 rounded-xl p-5 mb-6 text-left space-y-2">
                  <p className="text-sm"><span className="font-medium">Therapist:</span> {bookedDetails.therapistName} {bookedDetails.credentials ? `(${bookedDetails.credentials})` : ""}</p>
                  <p className="text-sm"><span className="font-medium">Date:</span> {bookedDetails.date}</p>
                  <p className="text-sm"><span className="font-medium">Time:</span> {bookedDetails.time}</p>
                  <p className="text-sm"><span className="font-medium">Type:</span> {bookedDetails.sessionType === "in-person" ? "In-person" : "Online"}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button asChild><Link to="/dashboard/patient">Go to My Dashboard</Link></Button>
                  <Button variant="outline" asChild><Link to="/dashboard/patient/appointment-history">View My Appointments</Link></Button>
                </div>
              </div>
            ) : (
              <>
                {/* Results Card */}
                <div className="bg-card rounded-xl shadow-sm border p-8 mb-8 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Assessment Complete</h1>
                  </div>

                  {/* Severity */}
                  <div className={cn(
                    "rounded-xl p-5 mb-6 text-center border",
                    severity === "high" ? "bg-destructive/10 border-destructive/20" :
                    severity === "moderate" ? "bg-warning/10 border-warning/20" :
                    "bg-primary/10 border-primary/20"
                  )}>
                    <span className={cn(
                      "inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-3",
                      severity === "high" ? "bg-destructive text-destructive-foreground" :
                      severity === "moderate" ? "bg-warning text-warning-foreground" :
                      "bg-primary text-primary-foreground"
                    )}>
                      {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Based on your responses, our system has classified your condition as {severity}. A licensed clinician has been notified to review this.
                    </p>
                  </div>

                  {/* ICD-10/CPT */}
                  <div className="bg-muted/50 rounded-xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Clinical Codes</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ICD-10: {intake?.icd10_suggestion || "Pending"} · CPT: {intake?.cpt_suggestion || "Pending"}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-foreground mb-4">What happens next</h3>
                    <div className="space-y-4">
                      {[
                        { icon: CheckCircle2, label: "Assessment complete", status: "done" },
                        { icon: Clock, label: "Choose your therapist below", status: "active" },
                        { icon: Users, label: "Your care team confirmed", status: "pending" },
                      ].map((step) => (
                        <div key={step.label} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.status === "done" ? "bg-primary/10" :
                            step.status === "active" ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <step.icon className={`h-4 w-4 ${
                              step.status === "done" ? "text-primary" :
                              step.status === "active" ? "text-primary" : "text-muted-foreground"
                            }`} />
                          </div>
                          <span className={`text-sm ${
                            step.status === "pending" ? "text-muted-foreground" : "text-foreground font-medium"
                          }`}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Therapist Selection (not shown for auto-assigned high risk) */}
                {!isHighRisk && (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl font-bold text-foreground mb-1">Choose Your Therapist</h2>
                    <p className="text-sm text-muted-foreground mb-6">These therapists are available and matched to your needs. Select one to schedule your first session.</p>

                    {therapists.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No therapists available at the moment. Please check back later.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {therapists.map((t) => (
                          <div key={t.id} className="bg-card rounded-xl shadow-sm border border-l-4 border-l-primary p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold flex-shrink-0">
                                {(t as any).full_name?.[0]?.toUpperCase() || "T"}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-lg">{(t as any).full_name}</p>
                                {t.credentials && <p className="text-xs text-muted-foreground">{t.credentials}</p>}
                              </div>
                            </div>
                            {t.specialty && <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">{t.specialty}</span>}
                            {t.clinic_name && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{t.clinic_name}{t.city ? `, ${t.city}` : ""}</p>}
                            {t.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.bio}</p>}
                            <Button className="mt-3 w-full" onClick={() => { setSelectedTherapist(t); setSelectedDate(""); setSelectedTime(""); }}>
                              View Profile & Book
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 text-center">
                      <Button variant="outline" asChild>
                        <Link to="/match">View all care options</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </PageTransition>
      </main>

      {/* Booking Slide-over */}
      <Sheet open={!!selectedTherapist} onOpenChange={() => setSelectedTherapist(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Book Appointment</SheetTitle></SheetHeader>
          {selectedTherapist && (
            <div className="mt-4 space-y-6">
              {/* Therapist info */}
              <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
                  {(selectedTherapist as any).full_name?.[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">{(selectedTherapist as any).full_name}</p>
                  {selectedTherapist.credentials && <p className="text-sm text-muted-foreground">{selectedTherapist.credentials}</p>}
                  {selectedTherapist.specialty && <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">{selectedTherapist.specialty}</span>}
                  {selectedTherapist.clinic_name && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedTherapist.clinic_name}{selectedTherapist.city ? `, ${selectedTherapist.city}` : ""}</p>}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Select a Date</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getNext7Days().map((d) => (
                    <button key={d.value} onClick={() => { setSelectedDate(d.value); setSelectedTime(""); }}
                      className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg border min-w-[60px] transition-colors",
                        selectedDate === d.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
                      )}>
                      <span className="text-xs">{d.dayName}</span>
                      <span className="text-lg font-bold">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Select a Time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {getSlots(selectedTherapist).map((slot) => (
                      <button key={slot} onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                          selectedTime === slot ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
                        )}>
                        {formatSlotTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Type */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Session Type</p>
                <div className="flex gap-2">
                  {(["in-person", "online"] as const).map((type) => (
                    <button key={type} onClick={() => setSessionType(type)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize",
                        sessionType === type ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
                      )}>
                      {type === "in-person" ? "In-person" : "Online"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Notes (optional)</p>
                <Textarea
                  placeholder="Anything you'd like your therapist to know before your first session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Confirm */}
              <Button className="w-full" size="lg" disabled={!selectedDate || !selectedTime || booking} onClick={confirmBooking}>
                {booking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm Appointment
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* High Risk Auto-Assign Modal */}
      <Dialog open={crisisModal} onOpenChange={setCrisisModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="bg-destructive text-destructive-foreground rounded-lg p-3 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Immediate Support Assigned</span>
            </div>
            <DialogTitle className="sr-only">Immediate Support Assigned</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Based on your assessment, we have immediately connected you with a therapist who will reach out to you. You are not alone and help is on the way.
            </p>

            {autoAssigned && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {(autoAssigned as any).full_name?.[0]?.toUpperCase() || "T"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{(autoAssigned as any).full_name}</p>
                    {autoAssigned.credentials && <p className="text-xs text-muted-foreground">{autoAssigned.credentials}</p>}
                  </div>
                </div>
                {autoAssigned.specialty && <p className="text-sm text-muted-foreground">Specialty: {autoAssigned.specialty}</p>}
                {autoAssigned.clinic_name && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{autoAssigned.clinic_name}</p>}
                <p className="text-sm font-medium text-foreground">
                  Your session has been scheduled for {formatDisplayDate(autoAssigned.sessionDate)} at {formatDisplayTime(autoAssigned.sessionDate)}
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1"><Phone className="h-4 w-4" /> If you need to talk right now:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>iCall: <span className="font-medium text-foreground">9152987821</span></p>
                <p>Vandrevala Foundation: <span className="font-medium text-foreground">1860-2662-345</span></p>
                <p>Emergency: <span className="font-medium text-foreground">112</span></p>
              </div>
            </div>

            <Button className="w-full" onClick={() => { setCrisisModal(false); navigate("/dashboard/patient"); }}>
              Go to My Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntakeResults;
