import { useState, useEffect } from "react";
import { useGuardianChild } from "@/pages/GuardianPortal";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    attended: "bg-success/10 text-success",
    missed: "bg-crisis/10 text-crisis",
    cancelled: "bg-muted text-muted-foreground",
    rescheduled: "bg-warning/10 text-warning",
  };
  return map[status] || "bg-muted text-muted-foreground";
};

const GuardianAppointmentHistory = () => {
  const { childId, loading: childLoading } = useGuardianChild();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("sessions_log").select("*").eq("user_id", childId).or(`session_date.lt.${new Date().toISOString()},status.eq.cancelled`).order("session_date", { ascending: false });
      const sess = data || [];
      if (sess.length > 0) {
        const tIds = [...new Set(sess.map(s => s.therapist_id).filter(Boolean))];
        if (tIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", tIds);
          for (const s of sess) (s as any).therapist_name = profiles?.find(p => p.id === s.therapist_id)?.full_name || "Therapist";
        }
      }
      setSessions(sess);
      setLoading(false);
    };
    fetch();
  }, [childId]);

  if (childLoading || loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Appointment History</h1>
        <NotificationBell />
      </div>
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No appointment history yet.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Therapist</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.id} className={i % 2 ? "bg-muted/30" : ""}>
                  <td className="p-3 text-foreground">{new Date(s.session_date).toLocaleDateString()}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.session_date).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</td>
                  <td className="p-3 text-muted-foreground">{(s as any).therapist_name || "—"}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge(s.status)}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GuardianAppointmentHistory;
