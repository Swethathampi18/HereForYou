import { useState, useEffect } from "react";
import { useGuardianChild } from "@/pages/GuardianPortal";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const GuardianProgress = () => {
  const { childId, childName, loading: childLoading } = useGuardianChild();
  const [report, setReport] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const [{ data: rep }, { data: intake }, { data: moods }] = await Promise.all([
        supabase.from("patient_reports").select("report_markdown").eq("user_id", childId).order("generated_at", { ascending: false }).limit(1).single(),
        supabase.from("intake_sessions").select("severity_level").eq("user_id", childId).order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("mood_checkins").select("score, created_at").eq("user_id", childId).order("created_at", { ascending: true }).limit(30),
      ]);
      setReport(rep?.report_markdown || null);
      setSeverity(intake?.severity_level || null);
      setMoodData((moods || []).map((m: any) => ({ day: new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }), score: m.score })));
      setLoading(false);
    };
    fetch();
  }, [childId]);

  if (childLoading || loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{childName}'s Progress</h1>
        <NotificationBell />
      </div>

      {/* Health Report */}
      <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-3">Health Report</h2>
        {report ? (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{report}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Assessment not completed yet. Complete the assessment to generate a health report.</p>
        )}
      </div>

      {/* Risk Level */}
      {severity && (
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-2">Risk Level</h2>
          <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full capitalize ${severity === "high" ? "bg-crisis/10 text-crisis" : severity === "moderate" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>{severity}</span>
        </div>
      )}

      {/* Mood Graph */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-foreground mb-4">Mood Trend</h2>
        {moodData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mood data yet. Mood data will appear here once your child logs their check-ins.</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(168 82% 32%)" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardianProgress;
