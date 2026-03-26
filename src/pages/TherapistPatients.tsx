import { useState, useEffect } from "react";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const TherapistPatients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

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
      return { ...p, match_type: matchInfo?.match_type, severity: intake?.severity_level || "N/A", icd10: intake?.icd10_suggestion || "Pending", sessionsAttended: sessCount, lastSession: lastSess ? new Date(lastSess.session_date).toLocaleDateString() : "None", report_markdown: report?.report_markdown };
    });
    setPatients(joined);
    setLoading(false);
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
                        <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.severity === "high" ? "bg-crisis/10 text-crisis" : p.severity === "moderate" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>{p.severity}</span></td>
                        <td className="p-3 text-muted-foreground">{p.icd10}</td>
                        <td className="p-3 text-muted-foreground capitalize">{p.match_type}</td>
                        <td className="p-3 text-muted-foreground">{p.sessionsAttended}</td>
                        <td className="p-3 text-muted-foreground">{p.lastSession}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedReport(p.report_markdown || null)} disabled={!p.report_markdown}>
                            <Eye className="h-4 w-4" />
                          </Button>
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
    </div>
  );
};

export default TherapistPatients;
