import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGuardianChild } from "@/pages/GuardianPortal";
import { NotificationBell } from "@/components/NotificationBell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

const GuardianAssessment = () => {
  const { childId, childName, loading: childLoading } = useGuardianChild();
  const [intakeStatus, setIntakeStatus] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase.from("intake_sessions").select("status, severity_level").eq("user_id", childId).order("created_at", { ascending: false }).limit(1).single();
      setIntakeStatus(data?.status || null);
      setSeverity(data?.severity_level || null);
      setLoading(false);
    };
    fetch();
  }, [childId]);

  if (childLoading || loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  if (!childId) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Assessment</h1>
          <NotificationBell />
        </div>
        <div className="bg-card rounded-xl shadow-sm border p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Please add your child's details first.</p>
          <Button asChild><Link to="/dashboard/guardian/add-patient">Add Patient</Link></Button>
        </div>
      </div>
    );
  }

  if (intakeStatus === "completed" || intakeStatus === "escalated") {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Assessment</h1>
          <NotificationBell />
        </div>
        <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
          <p className="font-semibold text-foreground">Assessment already completed.</p>
          <p className="text-sm text-muted-foreground mt-1">Severity: <span className="font-medium capitalize">{severity}</span></p>
          <Button className="mt-4" asChild><Link to="/dashboard/guardian/progress">View Progress</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Assessment for {childName}</h1>
        <NotificationBell />
      </div>
      <div className="bg-card rounded-xl shadow-sm border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">Begin the intake assessment on behalf of your child. The AI will ask questions about your child's well-being.</p>
        <Button asChild><Link to="/intake">Begin Assessment for {childName}</Link></Button>
      </div>
    </div>
  );
};

export default GuardianAssessment;
