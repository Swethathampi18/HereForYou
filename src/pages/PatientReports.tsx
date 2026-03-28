import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { formatShortDate } from "@/lib/dateUtils";

const PatientReports = () => {
  const { user } = useAuth();
  const [autoReports, setAutoReports] = useState<any[]>([]);
  const [therapistReports, setTherapistReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: auto }, { data: tReports }] = await Promise.all([
        supabase.from("patient_reports").select("*").eq("user_id", user.id).order("generated_at", { ascending: false }),
        supabase.from("therapist_reports").select("*").eq("patient_id", user.id).eq("sent_to_patient", true).order("created_at", { ascending: false }),
      ]);

      setAutoReports(auto || []);

      // Enrich therapist reports with therapist names
      if (tReports && tReports.length > 0) {
        const tIds = [...new Set(tReports.map(r => r.therapist_id).filter(Boolean))];
        if (tIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", tIds as string[]);
          for (const r of tReports) {
            (r as any).therapist_name = profiles?.find(p => p.id === r.therapist_id)?.full_name || "Therapist";
          }
        }
      }
      setTherapistReports(tReports || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Reports</h1>
              <NotificationBell />
            </div>

            {loading ? <Skeleton className="h-64 w-full" /> : (
              <>
                {/* Auto-generated */}
                <div className="mb-8">
                  <h2 className="font-semibold text-foreground mb-3">My Health Reports</h2>
                  {autoReports.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border p-8 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No health reports yet. Complete your assessment to generate a report.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {autoReports.map(r => (
                        <div key={r.id} className="bg-card rounded-xl shadow-sm border p-5 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Intake Assessment Report</p>
                            <p className="text-xs text-muted-foreground">Generated {r.generated_at ? formatShortDate(r.generated_at) : "N/A"}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setViewReport(r.report_markdown)}>View Report</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* From therapist */}
                <div>
                  <h2 className="font-semibold text-foreground mb-3">From My Therapist</h2>
                  {therapistReports.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border p-8 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No reports from your therapist yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {therapistReports.map(r => (
                        <div key={r.id} className="bg-card rounded-xl shadow-sm border p-5 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{r.title || "Session Report"}</p>
                            <p className="text-xs text-muted-foreground">By {(r as any).therapist_name} · {r.created_at ? formatShortDate(r.created_at) : ""}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setViewReport(r.report_markdown)}>View Report</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </PageTransition>
      </main>

      <Sheet open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Report</SheetTitle></SheetHeader>
          <div className="mt-4 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: (viewReport || "").replace(/\n/g, "<br/>") }} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PatientReports;
