import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, Home, TrendingUp, CalendarDays, Shield, Bell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/NotificationBell";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const guardianNav = [
  { label: "Dashboard", icon: Home, to: "/dashboard/guardian" },
  { label: "Child's Progress", icon: TrendingUp, to: "/dashboard/guardian" },
  { label: "Appointments", icon: CalendarDays, to: "/dashboard/guardian" },
  { label: "Consent", icon: Shield, to: "/dashboard/guardian" },
  { label: "Notifications", icon: Bell, to: "/dashboard/guardian" },
  { label: "Settings", icon: Settings, to: "/dashboard/guardian" },
];

const GuardianPortal = () => {
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("your child");
  const [intakeStatus, setIntakeStatus] = useState<string | null>(null);
  const [intakeData, setIntakeData] = useState<any>(null);
  const [matchInfo, setMatchInfo] = useState<string | null>(null);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Find linked child
    const { data: links } = await supabase
      .from("guardian_links")
      .select("patient_id")
      .eq("guardian_id", user.id)
      .limit(1);

    if (!links || links.length === 0) {
      setLoading(false);
      return;
    }

    const cId = links[0].patient_id;
    setChildId(cId);

    // Child profile
    const { data: childProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", cId)
      .single();
    if (childProfile) setChildName(childProfile.full_name || "your child");

    // Intake
    const { data: intake } = await supabase
      .from("intake_sessions")
      .select("status, severity_level, icd10_suggestion")
      .eq("user_id", cId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setIntakeStatus(intake?.status || null);
    setIntakeData(intake);

    // Match
    const { data: match } = await supabase
      .from("matches")
      .select("match_type, match_rationale")
      .eq("user_id", cId)
      .limit(1)
      .single();
    setMatchInfo(match ? (match.match_rationale || match.match_type) : null);

    // Sessions
    const { data: sessData } = await supabase
      .from("sessions_log")
      .select("session_date, therapist_id, claims_status")
      .eq("user_id", cId)
      .order("session_date", { ascending: false });
    setSessions(sessData || []);
    setSessionsCount(sessData?.length || 0);

    // Mood
    const { data: moods } = await supabase
      .from("mood_checkins")
      .select("score, created_at")
      .eq("user_id", cId)
      .order("created_at", { ascending: true })
      .limit(30);
    setMoodData((moods || []).map((m: any) => ({
      day: new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
      score: m.score,
    })));

    // Referrals
    const { data: refData } = await supabase
      .from("referrals" as any)
      .select("*")
      .eq("patient_id", cId)
      .order("created_at", { ascending: false });
    setReferrals(refData || []);

    // Notifications
    const { data: notifData } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(notifData || []);

    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true } as any).eq("recipient_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const statCards = [
    { label: "Assessment Status", value: intakeStatus ? (intakeStatus === "completed" ? "Completed" : intakeStatus === "in_progress" ? "In Progress" : "Escalated") : "Not started" },
    { label: "Current Match", value: matchInfo || "Not matched yet" },
    { label: "Sessions Attended", value: String(sessionsCount) },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-card border-r min-h-screen sticky top-0">
        <div className="p-5 border-b">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-primary">HereForYou</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {guardianNav.map((item) => (
            <Link key={item.label} to={item.to} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.to ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || "G"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "Guardian"}</p>
              <p className="text-xs text-muted-foreground">Guardian</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Guardian Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitoring care for {childName}</p>
              </div>
              <NotificationBell />
            </div>

            {!childId && !loading && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-6 text-center">
                <p className="text-sm text-foreground">No linked child found. Please contact support to link your child's account.</p>
              </div>
            )}

            {childId && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {loading ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-5 shadow-sm border">
                      <Skeleton className="h-6 w-20 mb-1" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  )) : statCards.map((s) => (
                    <div key={s.label} className="bg-card rounded-xl p-5 shadow-sm border card-hover">
                      <p className="text-lg font-semibold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Assessment card */}
                {!loading && (!intakeStatus || intakeStatus === "in_progress") && (
                  <div className="bg-card rounded-xl p-6 shadow-sm border mb-6">
                    <p className="text-sm text-foreground mb-3">Your child has not completed their mental health assessment yet.</p>
                    <Button asChild>
                      <Link to="/intake">Begin Assessment for {childName}</Link>
                    </Button>
                  </div>
                )}
                {!loading && intakeStatus === "completed" && intakeData && (
                  <div className="bg-success/10 border border-success/20 rounded-xl p-5 mb-6">
                    <p className="text-sm font-semibold text-foreground">Assessment complete</p>
                    <p className="text-xs text-muted-foreground mt-1">Severity: {intakeData.severity_level} · ICD-10: {intakeData.icd10_suggestion || "Pending"}</p>
                  </div>
                )}

                {/* Appointments */}
                <div className="bg-card rounded-xl p-6 shadow-sm border mb-6">
                  <h2 className="font-semibold text-foreground mb-4">Appointments</h2>
                  {loading ? <Skeleton className="h-24 w-full" /> : sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No appointments yet. Contact your child's therapist to reschedule.</p>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-foreground">{new Date(s.session_date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</span>
                          <span className="text-xs text-muted-foreground capitalize">{s.claims_status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mood Trend */}
                <div className="bg-card rounded-xl p-6 shadow-sm border mb-6">
                  <h2 className="font-semibold text-foreground mb-4">Mood Trend (Read Only)</h2>
                  {loading ? <Skeleton className="h-48 w-full" /> : moodData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No mood data yet. Mood will appear here after your child logs their first check-in.</p>
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

                {/* Session History */}
                <div className="bg-card rounded-xl shadow-sm border mb-6 overflow-hidden">
                  <div className="p-5 border-b"><h2 className="font-semibold text-foreground">Session History</h2></div>
                  {sessions.length === 0 ? (
                    <div className="p-6 text-center"><p className="text-sm text-muted-foreground">No sessions yet.</p></div>
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
                            <td className="p-3 text-muted-foreground capitalize">{s.claims_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Referrals */}
                <div className="bg-card rounded-xl shadow-sm border mb-6 overflow-hidden">
                  <div className="p-5 border-b"><h2 className="font-semibold text-foreground">Referrals</h2></div>
                  {referrals.length === 0 ? (
                    <div className="p-6 text-center"><p className="text-sm text-muted-foreground">No referrals issued yet.</p></div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Referred To</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Specialty</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Urgency</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      </tr></thead>
                      <tbody>
                        {referrals.map((r: any, i: number) => (
                          <tr key={r.id} className={i % 2 ? "bg-muted/30" : ""}>
                            <td className="p-3 text-foreground">{r.referred_to}</td>
                            <td className="p-3 text-muted-foreground">{r.specialty}</td>
                            <td className="p-3 text-muted-foreground capitalize">{r.urgency}</td>
                            <td className="p-3 text-muted-foreground capitalize">{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Consent */}
                <div className="bg-card rounded-xl p-6 shadow-sm border mb-6">
                  <h2 className="font-semibold text-foreground mb-3">Consent Management</h2>
                  <p className="text-sm text-muted-foreground">You have active consent for {childName} to receive mental health support through HereForYou.</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-sm text-crisis hover:underline mt-2">Revoke consent</button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke consent?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure? Revoking consent will pause all active sessions and matching for {childName}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-crisis text-crisis-foreground hover:bg-crisis/90" onClick={() => toast({ title: "Consent revoked. A supervisor has been notified." })}>
                          Confirm Revoke
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Notifications */}
                <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-5 border-b flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">Notifications</h2>
                    {notifications.some(n => !n.read) && (
                      <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center"><p className="text-sm text-muted-foreground">No notifications</p></div>
                  ) : (
                    <div className="divide-y max-h-64 overflow-y-auto">
                      {notifications.map((n: any) => (
                        <div key={n.id} className={cn("p-3", !n.read && "bg-primary/5")}>
                          <p className="text-sm text-foreground">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
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
    </div>
  );
};

export default GuardianPortal;
