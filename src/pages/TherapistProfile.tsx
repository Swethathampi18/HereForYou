import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageTransition } from "@/components/PageTransition";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MapPin, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TherapistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [therapist, setTherapist] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [sessionType, setSessionType] = useState<"in-person" | "online">("in-person");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("therapists").select("*").eq("id", id).single(),
        supabase.from("profiles").select("full_name, email").eq("id", id).single(),
      ]);
      setTherapist(t);
      setProfile(p);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getSlots = (day: Date) => {
    if (!therapist?.available_slots) {
      return ["10:00 AM", "2:00 PM", "4:30 PM"];
    }
    const dayName = day.toLocaleDateString("en", { weekday: "long" }).toLowerCase();
    const slots = (therapist.available_slots as any)?.[dayName] || [];
    return slots.length > 0 ? slots : ["10:00 AM", "2:00 PM", "4:30 PM"];
  };

  const handleBook = async () => {
    if (!user || !id || !selectedSlot) return;
    setBooking(true);

    const dayDate = getNext7Days().find(d => d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }) === selectedSlot.day);
    if (!dayDate) { setBooking(false); return; }

    const timeParts = selectedSlot.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) { setBooking(false); return; }
    let hours = parseInt(timeParts[1]);
    if (timeParts[3].toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (timeParts[3].toUpperCase() === "AM" && hours === 12) hours = 0;
    dayDate.setHours(hours, parseInt(timeParts[2]), 0, 0);

    const { error: sessError } = await supabase.from("sessions_log").insert({
      user_id: user.id,
      therapist_id: id,
      session_date: dayDate.toISOString(),
      notes_text: notes || "",
      claims_status: "pending" as const,
      status: "pending",
    });

    if (sessError) {
      toast({ title: sessError.message, variant: "destructive" });
      setBooking(false);
      return;
    }

    // Update/create match
    const { data: existingMatch } = await supabase.from("matches").select("id").eq("user_id", user.id).limit(1).single();
    if (existingMatch) {
      await supabase.from("matches").update({ therapist_id: id, match_type: "individual" as const } as any).eq("id", existingMatch.id);
    } else {
      await supabase.from("matches").insert({ user_id: user.id, therapist_id: id, match_type: "individual" as const, match_rationale: "Patient-selected therapist" });
    }

    // Send report to therapist
    const { data: report } = await supabase.from("patient_reports").select("id").eq("user_id", user.id).order("generated_at", { ascending: false }).limit(1).single();
    if (report) {
      await supabase.from("patient_reports").update({ sent_to_therapist_id: id, sent_at: new Date().toISOString() } as any).eq("id", report.id);
    }

    // Notifications
    const therapistName = profile?.full_name || "your therapist";
    await supabase.from("notifications").insert({
      recipient_id: id,
      sender_id: user.id,
      type: "appointment",
      message: `A patient has booked an appointment with you on ${dayDate.toLocaleDateString()}. Their health report is attached.`,
    } as any);
    await supabase.from("notifications").insert({
      recipient_id: user.id,
      type: "appointment",
      message: `Appointment confirmed with ${therapistName} on ${dayDate.toLocaleDateString()} at ${selectedSlot.time}.`,
    } as any);

    toast({ title: `Appointment booked with ${therapistName}!` });
    setBooking(false);
    navigate("/dashboard/patient");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8"><Skeleton className="h-96 w-full max-w-3xl mx-auto" /></main>
      </div>
    );
  }

  const days = getNext7Days();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
                  {profile?.full_name?.[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{profile?.full_name || "Therapist"}</h1>
                  <p className="text-sm text-muted-foreground">{therapist?.credentials}</p>
                  {therapist?.specialty && <span className="inline-block mt-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{therapist.specialty}</span>}
                  {therapist?.clinic_name && <p className="text-sm text-muted-foreground mt-2">{therapist.clinic_name}</p>}
                  {(therapist?.clinic_address || therapist?.city) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{[therapist.clinic_address, therapist.city].filter(Boolean).join(", ")}</p>
                  )}
                  {therapist?.bio && <p className="text-sm text-muted-foreground mt-3">{therapist.bio}</p>}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-foreground mb-4">Book an Appointment</h2>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {days.map((d) => {
                  const label = d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
                  const slots = getSlots(d);
                  return (
                    <div key={label} className="text-center">
                      <p className="text-xs font-medium text-foreground mb-2">{d.toLocaleDateString("en", { weekday: "short" })}</p>
                      <p className="text-xs text-muted-foreground mb-2">{d.getDate()}</p>
                      <div className="space-y-1">
                        {slots.map((s: string) => (
                          <button
                            key={`${label}-${s}`}
                            onClick={() => setSelectedSlot({ day: label, time: s })}
                            className={cn(
                              "w-full text-[10px] py-1 rounded-md border transition-colors",
                              selectedSlot?.day === label && selectedSlot?.time === s
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:border-primary text-muted-foreground"
                            )}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 mb-4">
                {(["in-person", "online"] as const).map((t) => (
                  <button key={t} onClick={() => setSessionType(t)} className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    sessionType === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"
                  )}>{t === "in-person" ? "In-person" : "Online"}</button>
                ))}
              </div>

              <Textarea placeholder="Anything you'd like the therapist to know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-4" />

              <Button onClick={handleBook} disabled={!selectedSlot || booking} className="w-full">
                {booking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm Appointment
              </Button>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default TherapistProfile;
