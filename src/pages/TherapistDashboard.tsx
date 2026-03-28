import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, LayoutDashboard, Users, UserCircle, CalendarDays, ClipboardList, ArrowRightCircle, Settings, LogOut, Eye, Calendar, ArrowRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/NotificationBell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard/therapist" },
  { label: "My Patients", icon: UserCircle, to: "/dashboard/therapist/patients" },
  { label: "My Groups", icon: Users, to: "/dashboard/therapist/groups" },
  { label: "Schedule", icon: CalendarDays, to: "/dashboard/therapist/schedule" },
  { label: "Session Notes", icon: ClipboardList, to: "/dashboard/therapist/notes" },
  { label: "Patient Reports", icon: Eye, to: "/dashboard/therapist/patient-reports" },
  { label: "Referrals", icon: ArrowRightCircle, to: "/dashboard/therapist/referrals" },
  { label: "Settings", icon: Settings, to: "/dashboard/therapist/settings" },
];

export const TherapistSidebar = () => {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="hidden md:flex flex-col w-60 bg-card border-r min-h-screen sticky top-0">
      <div className="p-5 border-b">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-primary">HereForYou</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => (
          <Link key={item.label} to={item.to} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === item.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || "T"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "Therapist"}</p>
            <p className="text-xs text-muted-foreground">Therapist</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-3.5 w-3.5" />Sign Out
        </button>
      </div>
    </aside>
  );
};

const TherapistDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({ patients: 0, groups: 0, sessionsWeek: 0 });
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [patientReportOpen, setPatientReportOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientMoodData, setPatientMoodData] = useState<any[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  // Schedule form
  const [schedPatientId, setSchedPatientId] = useState("");
  const [schedType, setSchedType] = useState("individual");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedDuration, setSchedDuration] = useState("30");
  const [schedNotes, setSchedNotes] = useState("");
  const [submittingSched, setSubmittingSched] = useState(false);

  // Referral form
  const [refPatientId, setRefPatientId] = useState("");
  const [refTo, setRefTo] = useState("");
  const [refSpecialty, setRefSpecialty] = useState("");
  const [refReason, setRefReason] = useState("");
  const [refUrgency, setRefUrgency] = useState("medium");
  const [submittingRef, setSubmittingRef] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [patientCount, groupCount, sessionsWeek] = await Promise.all([
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("therapist_id", user.id),
      supabase.from("therapy_groups").select("id", { count: "exact", head: true }).eq("therapist_id", user.id).eq("is_active", true),
      supabase.from("sessions_log").select("id", { count: "exact", head: true }).eq("therapist_id", user.id)
        .gte("session_date", new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);

    setStats({
      patients: patientCount.count || 0,
      groups: groupCount.count || 0,
      sessionsWeek: sessionsWeek.count || 0,
    });

    // Patients
    const { data: matchData } = await supabase.from("matches").select("user_id, match_type, group_id").eq("therapist_id", user.id);
    if (matchData && matchData.length > 0) {
      const patientIds = matchData.map((m: any) => m.user_id);
      const [{ data: profilesData }, { data: intakeData }, { data: sessionData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, age, language").in("id", patientIds),
        supabase.from("intake_sessions").select("user_id, severity_level, icd10_suggestion, confidence_score, structured_features, conversation_json, cpt_suggestion, crisis_flag, human_review_required")
          .in("user_id", patientIds).eq("status", "completed"),
        supabase.from("sessions_log").select("user_id, session_date").in("user_id", patientIds),
      ]);

      const patientsJoined = (profilesData || []).map((p: any) => {
        const matchInfo = matchData.find((m: any) => m.user_id === p.id);
        const intake = (intakeData || []).find((i: any) => i.user_id === p.id);
        const sessCount = (sessionData || []).filter((s: any) => s.user_id === p.id).length;
        const lastSess = (sessionData || []).filter((s: any) => s.user_id === p.id)
          .sort((a: any, b: any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0];
        return { ...p, match_type: matchInfo?.match_type, severity: intake?.severity_level || "N/A", icd10: intake?.icd10_suggestion || "Pending", sessionsAttended: sessCount, lastSession: lastSess ? new Date(lastSess.session_date).toLocaleDateString() : "None", intake };
      });
      setPatients(patientsJoined);
    } else {
      setPatients([]);
    }

    setLoading(false);
  };

  const openPatientReport = async (patient: any) => {
    setSelectedPatient(patient);
    setPatientReportOpen(true);
    const { data: moods } = await supabase.from("mood_checkins").select("score, created_at").eq("user_id", patient.id).order("created_at", { ascending: true }).limit(30);
    setPatientMoodData((moods || []).map((m: any) => ({ day: new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }), score: m.score })));
  };

  const submitSchedule = async () => {
    if (!user || !schedPatientId || !schedDate || !schedTime) return;
    setSubmittingSched(true);
    const [yr, mo, dy] = schedDate.split('-').map(Number);
    const [hr, mn] = schedTime.split(':').map(Number);
    const sessionDate = new Date(yr, mo - 1, dy, hr, mn);
    const sessionDateISO = sessionDate.toISOString();
    const { error } = await supabase.from("sessions_log").insert({ user_id: schedPatientId, therapist_id: user.id, session_date: sessionDateISO, notes_text: schedNotes || "", claims_status: "pending" as const });
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else {
      await supabase.from("notifications").insert({ recipient_id: schedPatientId, sender_id: user.id, type: "appointment", message: `New appointment scheduled for ${sessionDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}` } as any);
      toast({ title: "Appointment scheduled!" });
      setScheduleModalOpen(false);
      fetchAll();
    }
    setSubmittingSched(false);
  };

  const submitReferral = async () => {
    if (!user || !refPatientId || !refTo || !refReason) return;
    setSubmittingRef(true);
    const { error } = await supabase.from("referrals").insert({ patient_id: refPatientId, referring_therapist_id: user.id, referred_to: refTo, specialty: refSpecialty, reason: refReason, urgency: refUrgency });
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else {
      await supabase.from("notifications").insert({ recipient_id: refPatientId, sender_id: user.id, type: "referral", message: `You have been referred to ${refTo} (${refSpecialty})` } as any);
      toast({ title: "Referral submitted!" });
      setReferralModalOpen(false);
      fetchAll();
    }
    setSubmittingRef(false);
  };

  const statCards = [
    { label: "My Patients", value: stats.patients },
    { label: "Active Groups", value: stats.groups },
    { label: "Sessions This Week", value: stats.sessionsWeek },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <TherapistSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.full_name || "Doctor"}</h1>
              <NotificationBell />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-5 shadow-sm border"><Skeleton className="h-8 w-12 mb-1" /><Skeleton className="h-3 w-20" /></div>
              )) : statCards.map((s) => (
                <div key={s.label} className="bg-card rounded-xl p-5 shadow-sm border card-hover">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={() => setScheduleModalOpen(true)}>Schedule Appointment</Button>
              <Button variant="outline" size="sm" onClick={() => setReferralModalOpen(true)}>New Referral</Button>
            </div>

            {/* Patients Table */}
            <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b"><h2 className="font-semibold text-foreground">My Patients</h2></div>
              {loading ? (
                <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : patients.length === 0 ? (
                <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No patients matched yet. Patients will appear here after completing their assessment and being matched to you.</p></div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Severity</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">ICD-10</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Sessions</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr></thead>
                  <tbody>
                    {patients.map((p, i) => (
                      <tr key={p.id} className={i % 2 ? "bg-muted/30" : ""}>
                        <td className="p-3 font-medium text-foreground">{p.full_name}</td>
                        <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.severity === "high" ? "bg-crisis/10 text-crisis" : p.severity === "moderate" ? "bg-warning/10 text-warning" : p.severity === "low" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{p.severity}</span></td>
                        <td className="p-3 text-muted-foreground">{p.icd10}</td>
                        <td className="p-3 text-muted-foreground capitalize">{p.match_type}</td>
                        <td className="p-3 text-muted-foreground">{p.sessionsAttended}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPatientReport(p)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSchedPatientId(p.id); setScheduleModalOpen(true); }}><Calendar className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setRefPatientId(p.id); setReferralModalOpen(true); }}><ArrowRight className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </PageTransition>
      </main>

      {/* Patient Report */}
      <Sheet open={patientReportOpen} onOpenChange={setPatientReportOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{selectedPatient?.full_name || "Patient Report"}</SheetTitle></SheetHeader>
          {selectedPatient && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Age</p><p className="font-medium">{selectedPatient.age || "N/A"}</p></div>
                <div><p className="text-muted-foreground">Language</p><p className="font-medium">{selectedPatient.language || "N/A"}</p></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Severity</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selectedPatient.severity === "high" ? "bg-crisis/10 text-crisis" : selectedPatient.severity === "moderate" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>{selectedPatient.severity}</span>
              </div>
              {selectedPatient.intake && (
                <>
                  <div><p className="text-sm text-muted-foreground">ICD-10</p><p className="text-sm font-medium">{selectedPatient.intake.icd10_suggestion || "Pending"}</p></div>
                  <div><p className="text-sm text-muted-foreground">CPT</p><p className="text-sm font-medium">{selectedPatient.intake.cpt_suggestion || "Pending"}</p></div>
                  {selectedPatient.intake.structured_features && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Intake Summary</p>
                      <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                        {Object.entries(selectedPatient.intake.structured_features as Record<string, any>).map(([k, v]) => (
                          <p key={k}><span className="font-medium">{k.replace(/_/g, " ")}:</span> {String(v)}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Mood Trend</p>
                {patientMoodData.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No mood data yet</p>
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={patientMoodData}>
                        <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="hsl(215 16% 47%)" />
                        <YAxis domain={[1, 10]} tick={{ fontSize: 9 }} stroke="hsl(215 16% 47%)" />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="hsl(168 82% 32%)" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Schedule Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Patient</Label><Select value={schedPatientId} onValueChange={setSchedPatientId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger><SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Session Type</Label><Select value={schedType} onValueChange={setSchedType}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="group">Group</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" className="mt-1" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} /></div>
              <div><Label>Time</Label><Input type="time" className="mt-1" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} /></div>
            </div>
            <div><Label>Notes (optional)</Label><Textarea className="mt-1" value={schedNotes} onChange={(e) => setSchedNotes(e.target.value)} /></div>
            <Button onClick={submitSchedule} disabled={submittingSched || !schedPatientId || !schedDate || !schedTime} className="w-full">
              {submittingSched && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Modal */}
      <Dialog open={referralModalOpen} onOpenChange={setReferralModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Patient</Label><Select value={refPatientId} onValueChange={setRefPatientId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger><SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Refer To</Label><Input className="mt-1" value={refTo} onChange={(e) => setRefTo(e.target.value)} placeholder="Specialist name / clinic" /></div>
            <div><Label>Specialty</Label><Select value={refSpecialty} onValueChange={setRefSpecialty}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="psychiatrist">Psychiatrist</SelectItem><SelectItem value="clinical_psychologist">Clinical Psychologist</SelectItem><SelectItem value="addiction_specialist">Addiction Specialist</SelectItem><SelectItem value="neurologist">Neurologist</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div><Label>Reason</Label><Textarea className="mt-1" value={refReason} onChange={(e) => setRefReason(e.target.value)} /></div>
            <div><Label>Urgency</Label><RadioGroup value={refUrgency} onValueChange={setRefUrgency} className="flex gap-4 mt-1"><div className="flex items-center gap-1"><RadioGroupItem value="low" id="urg-low" /><Label htmlFor="urg-low" className="font-normal">Low</Label></div><div className="flex items-center gap-1"><RadioGroupItem value="medium" id="urg-med" /><Label htmlFor="urg-med" className="font-normal">Medium</Label></div><div className="flex items-center gap-1"><RadioGroupItem value="high" id="urg-high" /><Label htmlFor="urg-high" className="font-normal">High</Label></div></RadioGroup></div>
            <Button onClick={submitReferral} disabled={submittingRef || !refPatientId || !refTo || !refReason} className="w-full">
              {submittingRef && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Referral
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistDashboard;
