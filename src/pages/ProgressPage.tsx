import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const ProgressPage = () => {
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);

      const [{ data: moods }, { data: sessData }] = await Promise.all([
        supabase.from("mood_checkins").select("score, created_at, notes").eq("user_id", user.id).order("created_at", { ascending: true }).limit(30),
        supabase.from("sessions_log").select("session_date, notes_text, claims_status, therapist_id").eq("user_id", user.id).order("session_date", { ascending: false }),
      ]);

      setMoodData((moods || []).map((m: any) => ({
        day: new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
        score: m.score,
      })));
      setSessions(sessData || []);

      // Streak
      if (sessData && sessData.length > 0) {
        let count = 0;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const dates = new Set(sessData.map((s: any) => {
          const d = new Date(s.session_date); d.setHours(0, 0, 0, 0); return d.toISOString();
        }));
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          if (dates.has(d.toISOString())) count++;
          else if (i > 0) break;
        }
        setStreak(count);
      }

      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <h1 className="text-2xl font-bold text-foreground mb-8">Your Progress</h1>

            {/* Mood Chart */}
            <div className="bg-card rounded-xl p-6 shadow-sm border mb-6">
              <h2 className="font-semibold text-foreground mb-4">Mood — Last 30 Days</h2>
              {loading ? <Skeleton className="h-56 w-full" /> : moodData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mood data yet. Log your first mood check-in to see trends here.</p>
              ) : (
                <div className="h-56">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Streak */}
              <div className="bg-primary rounded-xl p-5 text-primary-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-5 w-5" />
                  <span className="font-semibold">Session Streak</span>
                </div>
                {loading ? <Skeleton className="h-10 w-20 bg-primary-foreground/20" /> : streak > 0 ? (
                  <>
                    <p className="text-3xl font-bold">{streak} 🔥</p>
                    <p className="text-sm opacity-80 mt-1">Sessions attended in a row</p>
                  </>
                ) : (
                  <p className="text-sm opacity-80">Start attending sessions to build your streak.</p>
                )}
              </div>

              {/* Attendance */}
              <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border overflow-hidden">
                <div className="p-5 border-b"><h2 className="font-semibold text-foreground">Attendance</h2></div>
                {loading ? (
                  <div className="p-5 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 text-center"><p className="text-sm text-muted-foreground">No sessions attended yet. Your session history will appear here.</p></div>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    </tr></thead>
                    <tbody>
                      {sessions.map((s: any, i: number) => (
                        <tr key={i} className={i % 2 ? "bg-muted/30" : ""}>
                          <td className="p-3 text-foreground">{new Date(s.session_date).toLocaleDateString()}</td>
                          <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            s.claims_status === "validated" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}>{s.claims_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default ProgressPage;
