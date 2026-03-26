import { useState, useEffect } from "react";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TherapistSchedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedPatient, setSchedPatient] = useState("");
  const [schedNotes, setSchedNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: sessData }, { data: matchData }] = await Promise.all([
      supabase.from("sessions_log").select("*").eq("therapist_id", user.id).order("session_date", { ascending: true }),
      supabase.from("matches").select("user_id").eq("therapist_id", user.id),
    ]);
    const sess = sessData || [];

    // Get patient names
    const patientIds = [...new Set([...sess.map(s => s.user_id), ...(matchData || []).map(m => m.user_id)])];
    if (patientIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", patientIds);
      for (const s of sess) { (s as any).patient_name = profiles?.find(p => p.id === s.user_id)?.full_name || "Patient"; }
      setPatients((profiles || []).map(p => ({ id: p.id, full_name: p.full_name })));
    }
    setSessions(sess);
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear(), m = date.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const days: Date[] = [];
    const startDay = first.getDay();
    for (let i = startDay - 1; i >= 0; i--) { const d = new Date(first); d.setDate(d.getDate() - i - 1); days.push(d); }
    for (let i = 1; i <= last.getDate(); i++) { days.push(new Date(y, m, i)); }
    while (days.length % 7 !== 0) { const d = new Date(last); d.setDate(d.getDate() + (days.length - last.getDate() - startDay + 1)); days.push(d); }
    return days;
  };

  const getSessionsForDay = (date: Date) => {
    const ds = date.toISOString().split("T")[0];
    return sessions.filter(s => s.session_date.split("T")[0] === ds);
  };

  const updateStatus = async (sessionId: string, status: string) => {
    await supabase.from("sessions_log").update({ status } as any).eq("id", sessionId);
    toast({ title: `Session marked as ${status}` });
    setSelectedEvent(null);
    fetchData();
  };

  const submitSchedule = async () => {
    if (!user || !schedPatient || !schedDate || !schedTime) return;
    setSubmitting(true);
    const dt = new Date(`${schedDate}T${schedTime}`);
    const { error } = await supabase.from("sessions_log").insert({ user_id: schedPatient, therapist_id: user.id, session_date: dt.toISOString(), notes_text: schedNotes, claims_status: "pending" as const, status: "pending" });
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else {
      await supabase.from("notifications").insert({ recipient_id: schedPatient, sender_id: user.id, type: "appointment", message: `New appointment on ${dt.toLocaleDateString()}` } as any);
      toast({ title: "Appointment scheduled!" });
      setSchedOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const days = getDaysInMonth(currentDate);
  const monthLabel = currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });

  return (
    <div className="flex min-h-screen bg-background">
      <TherapistSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
              <NotificationBell />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-semibold text-foreground">{monthLabel}</span>
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>

            {loading ? <Skeleton className="h-96 w-full" /> : (
              <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                <div className="grid grid-cols-7 border-b">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {days.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const daySessions = getSessionsForDay(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className={cn("min-h-[80px] border-b border-r p-1 cursor-pointer hover:bg-muted/30", !isCurrentMonth && "opacity-40")}
                        onClick={() => { setSchedDate(day.toISOString().split("T")[0]); setSchedOpen(true); }}>
                        <p className={cn("text-xs font-medium mb-1", isToday && "text-primary font-bold")}>{day.getDate()}</p>
                        {daySessions.map(s => (
                          <Popover key={s.id}>
                            <PopoverTrigger asChild>
                              <button onClick={(e) => e.stopPropagation()} className={cn(
                                "w-full text-left text-[10px] px-1 py-0.5 rounded mb-0.5 truncate",
                                s.status === "attended" ? "bg-primary/20 text-primary" : s.status === "missed" ? "bg-crisis/20 text-crisis" : "bg-warning/20 text-warning"
                              )}>{(s as any).patient_name}</button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3">
                              <p className="text-sm font-medium text-foreground">{(s as any).patient_name}</p>
                              <p className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleString()}</p>
                              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 capitalize ${s.status === "attended" ? "bg-success/10 text-success" : s.status === "missed" ? "bg-crisis/10 text-crisis" : "bg-warning/10 text-warning"}`}>{s.status}</span>
                              <div className="flex gap-1 mt-2">
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(s.id, "attended")}>Attended</Button>
                                <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(s.id, "missed")}>Missed</Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PageTransition>
      </main>

      <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Patient</Label><Select value={schedPatient} onValueChange={setSchedPatient}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" className="mt-1" value={schedDate} onChange={e => setSchedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} /></div>
              <div><Label>Time</Label><Input type="time" className="mt-1" value={schedTime} onChange={e => setSchedTime(e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea className="mt-1" value={schedNotes} onChange={e => setSchedNotes(e.target.value)} /></div>
            <Button onClick={submitSchedule} disabled={submitting || !schedPatient || !schedDate || !schedTime} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistSchedule;
