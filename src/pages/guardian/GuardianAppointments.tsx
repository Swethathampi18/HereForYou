import { useState, useEffect } from "react";
import { useGuardianChild } from "@/pages/GuardianPortal";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GuardianAppointments = () => {
  const { user } = useAuth();
  const { childId, childName, loading: childLoading } = useGuardianChild();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!childId) { setLoading(false); return; }
    fetchSessions();
  }, [childId]);

  const fetchSessions = async () => {
    if (!childId) return;
    setLoading(true);
    const { data } = await supabase.from("sessions_log").select("*").eq("user_id", childId).neq("status", "cancelled").order("session_date", { ascending: true });
    const sess = data || [];
    if (sess.length > 0) {
      const tIds = [...new Set(sess.map(s => s.therapist_id).filter(Boolean))];
      if (tIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", tIds);
        for (const s of sess) { (s as any).therapist_name = profiles?.find(p => p.id === s.therapist_id)?.full_name || "Therapist"; }
      }
    }
    setSessions(sess);
    setLoading(false);
  };

  const handleReschedule = async () => {
    if (!selectedSession || !newDate || !newTime) return;
    setSubmitting(true);
    const dt = new Date(`${newDate}T${newTime}`);
    await supabase.from("appointment_history").insert({
      original_session_id: selectedSession.id, user_id: selectedSession.user_id, therapist_id: selectedSession.therapist_id,
      original_date: selectedSession.session_date, new_date: dt.toISOString(), action: "rescheduled", actioned_by: user?.id,
    });
    await supabase.from("sessions_log").update({ session_date: dt.toISOString(), status: "rescheduled" } as any).eq("id", selectedSession.id);
    if (selectedSession.therapist_id) {
      await supabase.from("notifications").insert({ recipient_id: selectedSession.therapist_id, sender_id: user?.id, type: "appointment", message: `Appointment for ${childName} rescheduled to ${dt.toLocaleDateString()}` } as any);
    }
    toast({ title: "Appointment rescheduled." });
    setRescheduleOpen(false);
    setSubmitting(false);
    fetchSessions();
  };

  const handleCancel = async () => {
    if (!selectedSession) return;
    setSubmitting(true);
    await supabase.from("appointment_history").insert({
      original_session_id: selectedSession.id, user_id: selectedSession.user_id, therapist_id: selectedSession.therapist_id,
      original_date: selectedSession.session_date, action: "cancelled", actioned_by: user?.id,
    });
    await supabase.from("sessions_log").update({ status: "cancelled" } as any).eq("id", selectedSession.id);
    if (selectedSession.therapist_id) {
      await supabase.from("notifications").insert({ recipient_id: selectedSession.therapist_id, sender_id: user?.id, type: "appointment", message: `Appointment for ${childName} has been cancelled.` } as any);
    }
    toast({ title: "Appointment cancelled." });
    setCancelOpen(false);
    setSubmitting(false);
    fetchSessions();
  };

  const upcoming = sessions.filter(s => new Date(s.session_date) >= new Date() && s.status !== "cancelled");

  // Simple calendar
  const getDays = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const days: Date[] = [];
    for (let i = 0; i < first.getDay(); i++) { const d = new Date(first); d.setDate(d.getDate() - (first.getDay() - i)); days.push(d); }
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i));
    while (days.length % 7 !== 0) { const d = new Date(last); d.setDate(last.getDate() + (days.length - last.getDate() - first.getDay() + 1)); days.push(d); }
    return days;
  };

  const getSessionsForDay = (d: Date) => {
    const ds = d.toISOString().split("T")[0];
    return sessions.filter(s => new Date(s.session_date).toISOString().split("T")[0] === ds);
  };

  if (childLoading || loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <NotificationBell />
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl shadow-sm border mb-6 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-semibold text-foreground">{currentDate.toLocaleDateString("en", { month: "long", year: "numeric" })}</span>
          <Button variant="ghost" size="icon" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {getDays().map((day, i) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const daySess = getSessionsForDay(day);
            return (
              <div key={i} className={cn("min-h-[60px] border-b border-r p-1", !isCurrentMonth && "opacity-40")}>
                <p className="text-xs font-medium">{day.getDate()}</p>
                {daySess.map(s => <div key={s.id} className="text-[10px] bg-primary/20 text-primary px-1 rounded truncate">{(s as any).therapist_name}</div>)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="p-5 border-b"><h2 className="font-semibold text-foreground">Upcoming Appointments</h2></div>
        {upcoming.length === 0 ? (
          <div className="p-6 text-center"><p className="text-sm text-muted-foreground">No upcoming appointments.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Date & Time</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Therapist</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {upcoming.map((s, i) => (
                <tr key={s.id} className={i % 2 ? "bg-muted/30" : ""}>
                  <td className="p-3 text-foreground">{new Date(s.session_date).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3 text-muted-foreground">{(s as any).therapist_name}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${s.status === "attended" ? "bg-success/10 text-success" : s.status === "rescheduled" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>{s.status}</span></td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedSession(s); setRescheduleOpen(true); }}>Reschedule</Button>
                    <Button variant="ghost" size="sm" className="text-crisis" onClick={() => { setSelectedSession(s); setCancelOpen(true); }}>Cancel</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reschedule Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Current: {selectedSession && new Date(selectedSession.session_date).toLocaleString()}</p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>New Date</Label><Input type="date" className="mt-1" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} /></div>
              <div><Label>New Time</Label><Input type="time" className="mt-1" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
            </div>
            <Button onClick={handleReschedule} disabled={submitting || !newDate || !newTime} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm Reschedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to cancel this appointment with {(selectedSession as any)?.therapist_name} on {selectedSession && new Date(selectedSession.session_date).toLocaleDateString()}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-crisis text-crisis-foreground hover:bg-crisis/90" onClick={handleCancel}>Yes, Cancel Appointment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GuardianAppointments;
