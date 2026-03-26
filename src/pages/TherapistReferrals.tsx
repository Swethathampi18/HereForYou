import { useState, useEffect } from "react";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TherapistReferrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [refTo, setRefTo] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("medium");

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: refData }, { data: matchData }] = await Promise.all([
      supabase.from("referrals").select("*").eq("referring_therapist_id", user.id).order("created_at", { ascending: false }),
      supabase.from("matches").select("user_id").eq("therapist_id", user.id),
    ]);

    const refs = refData || [];
    const patientIds = [...new Set([...refs.map(r => r.patient_id), ...(matchData || []).map(m => m.user_id)])];
    if (patientIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", patientIds);
      for (const r of refs) { (r as any).patient_name = profiles?.find(p => p.id === r.patient_id)?.full_name || "Patient"; }
      setPatients((profiles || []).map(p => ({ id: p.id, full_name: p.full_name })));
    }
    setReferrals(refs);
    setLoading(false);
  };

  const submit = async () => {
    if (!user || !patientId || !refTo || !reason) return;
    setSubmitting(true);
    const { error } = await supabase.from("referrals").insert({ patient_id: patientId, referring_therapist_id: user.id, referred_to: refTo, specialty, reason, urgency });
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else {
      await supabase.from("notifications").insert({ recipient_id: patientId, sender_id: user.id, type: "referral", message: `You have been referred to ${refTo}` } as any);
      toast({ title: "Referral submitted!" });
      setModalOpen(false);
      setPatientId(""); setRefTo(""); setSpecialty(""); setReason(""); setUrgency("medium");
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
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
              <div className="flex items-center gap-3">
                <Button onClick={() => setModalOpen(true)}>New Referral</Button>
                <NotificationBell />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-16"><p className="text-sm text-muted-foreground">No referrals made yet. Use the New Referral button to refer a patient to another specialist.</p></div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Referred To</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Specialty</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Urgency</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr></thead>
                  <tbody>
                    {referrals.map((r, i) => (
                      <tr key={r.id} className={i % 2 ? "bg-muted/30" : ""}>
                        <td className="p-3 font-medium text-foreground">{(r as any).patient_name}</td>
                        <td className="p-3 text-muted-foreground">{r.referred_to}</td>
                        <td className="p-3 text-muted-foreground">{r.specialty}</td>
                        <td className="p-3 text-muted-foreground truncate max-w-[200px]">{r.reason}</td>
                        <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.urgency === "high" ? "bg-crisis/10 text-crisis" : r.urgency === "medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{r.urgency}</span></td>
                        <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${r.status === "accepted" ? "bg-primary/10 text-primary" : r.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </PageTransition>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Patient</Label><Select value={patientId} onValueChange={setPatientId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Refer To</Label><Input className="mt-1" value={refTo} onChange={e => setRefTo(e.target.value)} placeholder="Specialist / clinic" /></div>
            <div><Label>Specialty</Label><Select value={specialty} onValueChange={setSpecialty}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="psychiatrist">Psychiatrist</SelectItem><SelectItem value="clinical_psychologist">Clinical Psychologist</SelectItem><SelectItem value="addiction_specialist">Addiction Specialist</SelectItem><SelectItem value="neurologist">Neurologist</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div><Label>Reason</Label><Textarea className="mt-1" value={reason} onChange={e => setReason(e.target.value)} /></div>
            <div><Label>Urgency</Label><RadioGroup value={urgency} onValueChange={setUrgency} className="flex gap-4 mt-1"><div className="flex items-center gap-1"><RadioGroupItem value="low" id="u-l" /><Label htmlFor="u-l" className="font-normal">Low</Label></div><div className="flex items-center gap-1"><RadioGroupItem value="medium" id="u-m" /><Label htmlFor="u-m" className="font-normal">Medium</Label></div><div className="flex items-center gap-1"><RadioGroupItem value="high" id="u-h" /><Label htmlFor="u-h" className="font-normal">High</Label></div></RadioGroup></div>
            <Button onClick={submit} disabled={submitting || !patientId || !refTo || !reason} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Referral
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistReferrals;
