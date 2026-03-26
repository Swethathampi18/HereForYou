import { useState, useEffect } from "react";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TherapistNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [notesText, setNotesText] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) fetchSessions(); }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("sessions_log").select("*").eq("therapist_id", user.id).order("session_date", { ascending: false });
    const sess = data || [];
    if (sess.length > 0) {
      const ids = [...new Set(sess.map(s => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      for (const s of sess) { (s as any).patient_name = profiles?.find(p => p.id === s.user_id)?.full_name || "Patient"; }
    }
    setSessions(sess);
    setLoading(false);
  };

  const selectSession = (s: any) => {
    setSelected(s);
    setNotesText(s.notes_text || "");
    setDiagnosis(s.coded_diagnosis || "");
  };

  const saveNotes = async () => {
    if (!selected || !user) return;
    setSaving(true);
    const { error } = await supabase.from("sessions_log").update({ notes_text: notesText, coded_diagnosis: diagnosis } as any).eq("id", selected.id);
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else {
      await supabase.from("audit_log").insert({ agent_name: "therapist-notes", user_id: user.id, action: "notes_saved", input_summary: `Session ${selected.id}`, output_summary: notesText.substring(0, 100) });
      toast({ title: "Notes saved!" });
      fetchSessions();
    }
    setSaving(false);
  };

  const markAttended = async () => {
    if (!selected) return;
    await supabase.from("sessions_log").update({ status: "attended" } as any).eq("id", selected.id);
    toast({ title: "Session marked as attended" });
    fetchSessions();
    setSelected({ ...selected, status: "attended" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <TherapistSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Session Notes</h1>
              <NotificationBell />
            </div>

            <div className="flex gap-6 h-[calc(100vh-160px)]">
              {/* Left panel */}
              <div className="w-72 flex-shrink-0 bg-card rounded-xl shadow-sm border overflow-y-auto">
                {loading ? (
                  <div className="p-3 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center"><p className="text-sm text-muted-foreground">No sessions yet.</p></div>
                ) : sessions.map(s => (
                  <button key={s.id} onClick={() => selectSession(s)} className={cn("w-full text-left p-3 border-b transition-colors hover:bg-muted/30", selected?.id === s.id && "border-l-2 border-l-primary bg-muted/30")}>
                    <p className="text-sm font-medium text-foreground">{(s as any).patient_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${s.status === "attended" ? "bg-success/10 text-success" : s.status === "missed" ? "bg-crisis/10 text-crisis" : "bg-warning/10 text-warning"}`}>{s.status}</span>
                  </button>
                ))}
              </div>

              {/* Right panel */}
              <div className="flex-1 bg-card rounded-xl shadow-sm border p-6 overflow-y-auto">
                {!selected ? (
                  <div className="flex items-center justify-center h-full"><p className="text-sm text-muted-foreground">Select a session from the left to view or add notes.</p></div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{(selected as any).patient_name}</h2>
                      <p className="text-sm text-muted-foreground">{new Date(selected.session_date).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize mt-1 ${selected.status === "attended" ? "bg-success/10 text-success" : selected.status === "missed" ? "bg-crisis/10 text-crisis" : "bg-warning/10 text-warning"}`}>{selected.status}</span>
                    </div>
                    <div><Label>Notes</Label><Textarea className="mt-1 min-h-[200px]" value={notesText} onChange={e => setNotesText(e.target.value)} /></div>
                    <div><Label>Coded Diagnosis (ICD-10)</Label><Input className="mt-1" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} /></div>
                    <div className="flex gap-2">
                      {selected.status !== "attended" && <Button variant="outline" className="bg-success/10 text-success border-success/20 hover:bg-success/20" onClick={markAttended}>Mark as Attended</Button>}
                      <Button onClick={saveNotes} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Notes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default TherapistNotes;
