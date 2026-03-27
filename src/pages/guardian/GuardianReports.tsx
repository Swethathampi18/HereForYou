import { useState, useEffect } from "react";
import { useGuardianChild } from "@/pages/GuardianPortal";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

const GuardianReports = () => {
  const { childId, loading: childLoading } = useGuardianChild();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("therapist_reports").select("*").eq("patient_id", childId).eq("sent_to_guardian", true).order("created_at", { ascending: false });
      if (data && data.length > 0) {
        const tIds = [...new Set(data.map(r => r.therapist_id).filter(Boolean))];
        if (tIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", tIds as string[]);
          for (const r of data) (r as any).therapist_name = profiles?.find(p => p.id === r.therapist_id)?.full_name || "Therapist";
        }
      }
      setReports(data || []);
      setLoading(false);
    };
    fetch();
  }, [childId]);

  if (childLoading || loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <NotificationBell />
      </div>
      {reports.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No reports yet</p>
          <p className="text-sm text-muted-foreground mt-1">Reports sent by your child's therapist will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-card rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{r.title || "Session Report"}</h3>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">By {(r as any).therapist_name}</p>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{r.report_markdown}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardianReports;
