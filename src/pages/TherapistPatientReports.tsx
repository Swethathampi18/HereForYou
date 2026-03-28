import { useState, useEffect } from "react";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatShortDate } from "@/lib/dateUtils";

const TherapistPatientReports = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [autoReports, setAutoReports] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create report form
  const [formPatient, setFormPatient] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [sendPatient, setSendPatient] = useState(false);
  const [sendGuardian, setSendGuardian] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Get matched patient IDs
    const { data: matchData } = await supabase.from("matches").select("user_id").eq("therapist_id", user.id);
    const patientIds = (matchData || []).map(m => m.user_id);

    if (patientIds.length > 0) {
      const [{ data: autoData }, { data: myData }, { data: profilesData }] = await Promise.all([
        supabase.from("patient_reports").select("*").in("user_id", patientIds).order("generated_at", { ascending: false }),
        supabase.from("therapist_reports").select("*").eq("therapist_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name").in("id", patientIds),
      ]);

      const nameMap: Record<string, string> = {};
      for (const p of profilesData || []) nameMap[p.id] = p.full_name || "Patient";

      setAutoReports((autoData || []).map(r => ({ ...r, patient_name: nameMap[r.user_id || ""] || "Patient" })));
      setMyReports((myData || []).map(r => ({ ...r, patient_name: nameMap[r.patient_id || ""] || "Patient" })));
      setPatients((profilesData || []).map(p => ({ id: p.id, full_name: p.full_name })));
    } else {
      setAutoReports([]);
      setMyReports([]);
      setPatients([]);
    }
    setLoading(false);
  };

  const sendToPatient = async (reportId: string) => {
    setSendingId(reportId);
    const report = autoReports.find(r => r.id === reportId);
    await supabase.from("patient_reports").update({ sent_to_therapist_id: user!.id, sent_at: new Date().toISOString() } as any).eq("id", reportId);

    if (report?.user_id) {
      await supabase.from("notifications").insert({
        recipient_id: report.user_id,
        sender_id: user!.id,
        type: "new_report",
        message: "Your therapist has shared your intake assessment report with you. View it in your Reports section.",
      } as any);
    }

    toast({ title: "Report sent to patient." });
    setSendingId(null);
    fetchData();
  };

  const submitReport = async () => {
    if (!user || !formPatient || !formTitle || !formContent) return;
    setSubmitting(true);

    const { error } = await supabase.from("therapist_reports").insert({
      therapist_id: user.id,
      patient_id: formPatient,
      title: formTitle,
      report_markdown: formContent,
      sent_to_patient: sendPatient,
      sent_to_guardian: sendGuardian,
      sent_at: (sendPatient || sendGuardian) ? new Date().toISOString() : null,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      const patientName = patients.find(p => p.id === formPatient)?.full_name || "Patient";
      if (sendPatient) {
        await supabase.from("notifications").insert({
          recipient_id: formPatient,
          sender_id: user.id,
          type: "new_report",
          message: `Your therapist ${profile?.full_name || ""} has sent you a new report: "${formTitle}". View it in your Reports section.`,
        } as any);
      }
      if (sendGuardian) {
        const { data: guardianLink } = await supabase.from("guardian_links").select("guardian_id").eq("patient_id", formPatient).limit(1).single();
        if (guardianLink?.guardian_id) {
          await supabase.from("notifications").insert({
            recipient_id: guardianLink.guardian_id,
            sender_id: user.id,
            type: "new_report",
            message: `${profile?.full_name || "Therapist"} has sent a report about ${patientName}: "${formTitle}". View it in Reports.`,
          } as any);
        }
      }
      await supabase.from("audit_log").insert({ user_id: user.id, action: "report_created", agent_name: "therapist", input_summary: formTitle });
      toast({ title: "Report saved and sent!" });
      setCreateOpen(false);
      setFormPatient(""); setFormTitle(""); setFormContent(""); setSendPatient(false); setSendGuardian(false);
      fetchData();
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <TherapistSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Patient Reports</h1>
              <div className="flex items-center gap-3">
                <Button onClick={() => setCreateOpen(true)}>Create New Report</Button>
                <NotificationBell />
              </div>
            </div>

            <Tabs defaultValue="auto">
              <TabsList>
                <TabsTrigger value="auto">Auto-Generated Reports</TabsTrigger>
                <TabsTrigger value="my">My Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="mt-4">
                {loading ? <Skeleton className="h-64 w-full" /> : autoReports.length === 0 ? (
                  <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground">No auto-generated reports yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Reports appear here when your patients complete their assessment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {autoReports.map(r => (
                      <div key={r.id} className="bg-card rounded-xl shadow-sm border p-5 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{r.patient_name}</p>
                          <p className="text-xs text-muted-foreground">Generated {r.generated_at ? formatShortDate(r.generated_at) : "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setViewReport(r.report_markdown)}>View Report</Button>
                          {r.sent_to_therapist_id ? (
                            <span className="text-xs text-primary flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sent</span>
                          ) : (
                            <Button size="sm" onClick={() => sendToPatient(r.id)} disabled={sendingId === r.id}>
                              {sendingId === r.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Send to Patient
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my" className="mt-4">
                {loading ? <Skeleton className="h-64 w-full" /> : myReports.length === 0 ? (
                  <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground">No reports created yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Create New Report" to write a report for your patient.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myReports.map(r => (
                      <div key={r.id} className="bg-card rounded-xl shadow-sm border p-5 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{r.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">{r.patient_name} · {r.created_at ? formatShortDate(r.created_at) : ""}</p>
                          <div className="flex gap-1 mt-1">
                            {r.sent_to_patient && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Sent to Patient</span>}
                            {r.sent_to_guardian && <span className="text-[10px] bg-accent/50 text-accent-foreground px-1.5 py-0.5 rounded">Sent to Guardian</span>}
                            {!r.sent_to_patient && !r.sent_to_guardian && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Draft</span>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setViewReport(r.report_markdown)}>View</Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </PageTransition>
      </main>

      {/* View Report Slide-over */}
      <Sheet open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Report</SheetTitle></SheetHeader>
          <div className="mt-4 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: (viewReport || "").replace(/\n/g, "<br/>") }} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Report Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Create Patient Report</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Patient</Label>
              <Select value={formPatient} onValueChange={setFormPatient}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Report Title</Label><Input className="mt-1" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Session Summary — March 2026" /></div>
            <div><Label>Report Content</Label><Textarea className="mt-1 min-h-[200px]" value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Write your clinical observations, session summary, progress notes, and recommendations..." /></div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Checkbox checked={sendPatient} onCheckedChange={(v) => setSendPatient(!!v)} id="send-patient" /><Label htmlFor="send-patient" className="font-normal">Send to Patient</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={sendGuardian} onCheckedChange={(v) => setSendGuardian(!!v)} id="send-guardian" /><Label htmlFor="send-guardian" className="font-normal">Send to Guardian</Label></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { /* save as draft */ submitReport(); }}>Save as Draft</Button>
              <Button onClick={submitReport} disabled={submitting || !formPatient || !formTitle || !formContent}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save & Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistPatientReports;
