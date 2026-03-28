import { useState, useEffect } from "react";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { formatShortDate, scheduleAppointment, formatDisplayDate, formatDisplayTime } from "@/lib/dateUtils";

const TherapistPatients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Schedule
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedPatient, setSchedPatient] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedNotes, setSchedNotes] = useState("");
  const [submittingSched, setSubmittingSched] = useState(false);

  // Referral
  const [refOpen, setRefOpen] = useState(false);
  const [refPatient, setRefPatient] = useState("");
  const [refTo, setRefTo] = useState("");
  const [refSpecialty, setRefSpecialty] = useState("");
  const [refReason, setRefReason] = useState("");
  const [refUrgency, setRefUrgency] = useState("medium");
  const [submittingRef, setSubmittingRef] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);

    const { data: matchData } = await supabase.from("matches").select("user_id, match_type").eq("therapist_id", user.id);
    if (!matchData || matchData.length === 0) { setPatients([]); setLoading(false); return; }

    const patientIds = matchData.map((m: any) => m.user_id);
    const [{ data: profilesData }, { data: intakeData }, { data: sessionData }, { data: reportsData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, age").in("id", patientIds),
      supabase.from("intake_sessions").select("user_id, severity_level, icd10_suggestion").in("user_id", patientIds).eq("status", "completed"),
      supabase.from("sessions_log").select("user_id, session_date").in("user_id", patientIds),
      supabase.from("patient_reports").select("user_id, report_markdown").in("user_id", patientIds),
    ]);

    const joined = (profilesData || []).map((p: any) => {
      const matchInfo = matchData.find((m: any) => m.user_id === p.id);
      const intake = (intakeData || []).find((i: any) => i.user_id === p.id);
      const sessCount = (sessionData || []).filter((s: any) => s.user_id === p.id).length;
      const lastSess = (sessionData || []).filter((s: any) => s.user_id === p.id).sort((a: any, b: any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0];
      const report = (reportsData || []).find((r: any) => r.user_id === p.id);
      return {
        ...p,
        match_type: matchInfo?.match_type,
        severity: intake?.severity_level || "N/A",
        icd10: intake?.icd10_suggestion || "Pending",
        sessionsAttended: sessCount,
        lastSession: lastSess ? formatShortDate(lastSess.session_date) : "None",
        report_markdown: report?.report_markdown,
      };
    });
    setPatients(joined);
    setLoading(false);
  };

  const submitSchedule = async () => {
    if (!user || !schedPatient || !schedDate || !schedTime) return;
    setSubmittingSched(true);
    const sessionDateISO = scheduleAppointment(schedDate, schedTime);
    const { error } = await supabase.from("sessions_log").insert({
      user_id: schedPatient, therapist_id: user.id, session_date: sessionDateISO, notes_text: schedNotes || "", claims_status: "pending" as const, status: "pending",
    });
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else {
      await supabase.from("notifications").insert({
        recipient_id: schedPatient, sender_id: user.id, type: "appointment",
        message: `New appointment scheduled for ${formatDisplayDate(sessionDateISO)} at ${formatDisplayTime(sessionDateISO)}`,
      } as any);
      toast({ title: "Appointment scheduled!" });
      setSchedOpen(false);
      fetchPatients();
    }
    setSubmittingSched(false);
  };

  const submitReferral = async () => {
    if (!user || !refPatient || !refTo || !refReason) return;
    setSubmittingRef(true);
    const { error } = await supabase.from("referrals").insert({
      patient_id: refPatient, referring_therapist_id: user.id, referred_to: refTo, specialty: refSpecialty, reason: refReason, urgency: refUrgency,
    });
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else {
      await supabase.from("notifications").insert({
        recipient_id: refPatient, sender_id: user.id, type: "referral",
        message: `You have been referred to ${refTo} (${refSpecialty})`,
      } as any);
      toast({ title: "Referral submitted!" });
      setRefOpen(false);
      fetchPatients();
    }
    setSubmittingRef(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <TherapistSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-foreground">My Patients</h1>
              <NotificationBell />
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : patients.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h2 className="font-semibold text-foreground text-lg">No patients yet</h2>
                <p className="text-sm text-muted-foreground mt-1">Patients will appear here once they book an appointment with you or are matched through the assessment.</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Age</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Severity</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">ICD-10</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Sessions</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Last Session</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr></thead>
                  <tbody>
                    {patients.map((p, i) => (
                      <tr key={p.id} className={i % 2 ? "bg-muted/30" : ""}>
                        <td className="p-3 font-medium text-foreground">{p.full_name}</td>
                        <td className="p-3 text-muted-foreground">{p.age || "-"}</td>
                        <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.severity === "high" ? "bg-destructive/10 text-destructive" : p.severity === "moderate" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>{p.severity}</span></td>
                        <td className="p-3 text-muted-foreground">{p.icd10}</td>
                        <td className="p-3 text-muted-foreground capitalize">{p.match_type}</td>
                        <td className="p-3 text-muted-foreground">{p.sessionsAttended}</td>
                        <td className="p-3 text-muted-foreground">{p.lastSession}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedReport(p.report_markdown || null)} disabled={!p.report_markdown}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSchedPatient(p.id); setSchedOpen(true); }}><Calendar className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setRefPatient(p.id); setRefOpen(true); }}><ArrowRight className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </PageTransition>
      </main>

      <Sheet open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Health Report</SheetTitle></SheetHeader>
          <div className="mt-4 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: (selectedReport || "").replace(/\n/g, "<br/>") }} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Schedule Modal */}
      <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" className="mt-1" value={schedDate} onChange={e => setSchedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} /></div>
              <div><Label>Time</Label><Input type="time" className="mt-1" value={schedTime} onChange={e => setSchedTime(e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea className="mt-1" value={schedNotes} onChange={e => setSchedNotes(e.target.value)} /></div>
            <Button onClick={submitSchedule} disabled={submittingSched || !schedDate || !schedTime} className="w-full">
              {submittingSched && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Modal */}
      <Dialog open={refOpen} onOpenChange={setRefOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Refer To</Label><Input className="mt-1" value={refTo} onChange={e => setRefTo(e.target.value)} placeholder="Specialist name / clinic" /></div>
            <div><Label>Specialty</Label>
              <Select value={refSpecialty} onValueChange={setRefSpecialty}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                  <SelectItem value="clinical_psychologist">Clinical Psychologist</SelectItem>
                  <SelectItem value="addiction_specialist">Addiction Specialist</SelectItem>
                  <SelectItem value="neurologist">Neurologist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason</Label><Textarea className="mt-1" value={refReason} onChange={e => setRefReason(e.target.value)} /></div>
            <div><Label>Urgency</Label>
              <RadioGroup value={refUrgency} onValueChange={setRefUrgency} className="flex gap-4 mt-1">
                <div className="flex items-center gap-1"><RadioGroupItem value="low" id="urg-l" /><Label htmlFor="urg-l" className="font-normal">Low</Label></div>
                <div className="flex items-center gap-1"><RadioGroupItem value="medium" id="urg-m" /><Label htmlFor="urg-m" className="font-normal">Medium</Label></div>
                <div className="flex items-center gap-1"><RadioGroupItem value="high" id="urg-h" /><Label htmlFor="urg-h" className="font-normal">High</Label></div>
              </RadioGroup>
            </div>
            <Button onClick={submitReferral} disabled={submittingRef || !refTo || !refReason} className="w-full">
              {submittingRef && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Referral
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistPatients;
