import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { Bell, ArrowRight, ClipboardCheck, Users, CalendarDays } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/NotificationBell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, profile, role } = useAuth();
  const { toast } = useToast();
  const [intakeStatus, setIntakeStatus] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [nextSession, setNextSession] = useState<string | null>(null);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moodScore, setMoodScore] = useState(5);
  const [moodNotes, setMoodNotes] = useState("");
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [submittingMood, setSubmittingMood] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      // Intake status
      const { data: intake } = await supabase
        .from("intake_sessions")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setIntakeStatus(intake?.status || null);

      // Match status
      const { data: match } = await supabase
        .from("matches")
        .select("match_type, waitlist_position")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (match) {
        setMatchStatus(match.waitlist_position ? `Waitlisted (#${match.waitlist_position})` : "Matched");
      } else {
        setMatchStatus(null);
      }

      // Next session
      const { data: nextSess } = await supabase
        .from("sessions_log")
        .select("session_date")
        .eq("user_id", user.id)
        .gte("session_date", new Date().toISOString())
        .order("session_date", { ascending: true })
        .limit(1)
        .single();
      setNextSession(nextSess ? new Date(nextSess.session_date).toLocaleDateString() : null);

      // Mood data
      const { data: moods } = await supabase
        .from("mood_checkins")
        .select("score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(30);
      setMoodData((moods || []).map((m: any, i: number) => ({
        day: new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
        score: m.score,
      })));

      // Sessions for calendar/attendance
      const { data: sessData } = await supabase
        .from("sessions_log")
        .select("session_date, notes_text, claims_status")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false })
        .limit(20);
      setSessions(sessData || []);

      // Streak calculation
      const { data: attendedSessions } = await supabase
        .from("sessions_log")
        .select("session_date")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false });

      if (attendedSessions && attendedSessions.length > 0) {
        let streakCount = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionDates = new Set(
          attendedSessions.map((s: any) => {
            const d = new Date(s.session_date);
            d.setHours(0, 0, 0, 0);
            return d.toISOString();
          })
        );
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          if (sessionDates.has(checkDate.toISOString())) {
            streakCount++;
          } else if (i > 0) {
            break;
          }
        }
        setStreak(streakCount);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const submitMood = async () => {
    if (!user) return;
    setSubmittingMood(true);
    const { error } = await supabase.from("mood_checkins").insert({
      user_id: user.id,
      score: moodScore,
      notes: moodNotes || null,
    });
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mood logged!" });
      setMoodDialogOpen(false);
      setMoodNotes("");
      // Refresh mood data
      const { data: moods } = await supabase
        .from("mood_checkins")
        .select("score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(30);
      setMoodData((moods || []).map((m: any) => ({
        day: new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
        score: m.score,
      })));
    }
    setSubmittingMood(false);
  };

  const getIntakeDisplay = () => {
    if (!intakeStatus) return { value: "Not Started", color: "text-warning" };
    if (intakeStatus === "completed") return { value: "Completed", color: "text-success" };
    if (intakeStatus === "in_progress") return { value: "In Progress", color: "text-primary" };
    return { value: "Escalated", color: "text-crisis" };
  };

  const statCards = [
    { icon: ClipboardCheck, label: "Intake Status", ...getIntakeDisplay() },
    { icon: Users, label: "Match Status", value: matchStatus || "Pending", color: matchStatus === "Matched" ? "text-success" : "text-muted-foreground" },
    { icon: CalendarDays, label: "Next Session", value: nextSession || "Not scheduled", color: nextSession ? "text-foreground" : "text-muted-foreground" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Good morning, {profile?.full_name || "there"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Here's your care overview</p>
              </div>
              <NotificationBell />
            </div>

            {/* Status Banner - only for patients */}
            {role === "patient" && !intakeStatus && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Start your 5-minute assessment</span> to get matched with the right support.
                </p>
                <Button asChild size="sm">
                  <Link to="/intake">Begin Assessment <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-5 shadow-sm border">
                  <Skeleton className="h-9 w-9 rounded-lg mb-3" />
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              )) : statCards.map((c) => (
                <div key={c.label} className="bg-card rounded-xl p-5 shadow-sm card-hover border">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <c.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* My Appointments */}
            <div className="bg-card rounded-xl p-6 shadow-sm border mb-8">
              <h2 className="font-semibold text-foreground mb-4">My Appointments</h2>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments scheduled yet. Your therapist will schedule sessions for you.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium text-foreground">
                        {new Date(s.session_date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{s.claims_status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mood Chart */}
            <div className="bg-card rounded-xl p-6 shadow-sm border mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-foreground">Your mood over time</h2>
                <Dialog open={moodDialogOpen} onOpenChange={setMoodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Log Today's Mood</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>How are you feeling today?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Score: {moodScore}/10</p>
                        <Slider
                          value={[moodScore]}
                          onValueChange={([v]) => setMoodScore(v)}
                          min={1}
                          max={10}
                          step={1}
                        />
                      </div>
                      <Textarea
                        placeholder="Any notes? (optional)"
                        value={moodNotes}
                        onChange={(e) => setMoodNotes(e.target.value)}
                      />
                      <Button onClick={submitMood} disabled={submittingMood} className="w-full">
                        {submittingMood ? "Saving..." : "Submit"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : moodData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete your assessment first, then log your daily mood here.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodData}>
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                      <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="hsl(168 82% 32%)" strokeWidth={2} dot={{ fill: "hsl(168 82% 32%)", r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Streak */}
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <h2 className="font-semibold text-foreground mb-2">Session Streak</h2>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : streak > 0 ? (
                <p className="text-3xl font-bold text-primary">{streak} 🔥</p>
              ) : (
                <p className="text-sm text-muted-foreground">Start attending sessions to build your streak.</p>
              )}
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default Dashboard;
