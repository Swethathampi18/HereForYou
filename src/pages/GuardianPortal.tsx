import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, Home, UserPlus, MessageCircle, TrendingUp, CalendarDays, Clock, FileText, Shield, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { Separator } from "@/components/ui/separator";

const guardianNav = [
  { label: "Dashboard", icon: Home, to: "/dashboard/guardian" },
  { label: "Add Patient", icon: UserPlus, to: "/dashboard/guardian/add-patient" },
  { label: "Assessment", icon: MessageCircle, to: "/dashboard/guardian/assessment" },
  { label: "Child's Progress", icon: TrendingUp, to: "/dashboard/guardian/progress" },
  { label: "Appointments", icon: CalendarDays, to: "/dashboard/guardian/appointments" },
  { label: "Appointment History", icon: Clock, to: "/dashboard/guardian/appointment-history" },
  { label: "Reports", icon: FileText, to: "/dashboard/guardian/reports" },
  { label: "Consent", icon: Shield, to: "/dashboard/guardian/consent" },
  { label: "Settings", icon: Settings, to: "/dashboard/guardian/settings" },
];

export const GuardianSidebar = () => {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
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
            pathname === item.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "Guardian"}</p>
            <p className="text-xs text-muted-foreground">Guardian</p>
          </div>
        </div>
        <Separator className="mb-3" />
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-3.5 w-3.5" />Log Out
        </button>
      </div>
    </aside>
  );
};

// Hook to get linked child
export const useGuardianChild = () => {
  const { user } = useAuth();
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("your child");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data: links } = await supabase.from("guardian_links").select("patient_id").eq("guardian_id", user.id).limit(1);
      if (links && links.length > 0) {
        setChildId(links[0].patient_id);
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", links[0].patient_id).single();
        if (profile) setChildName(profile.full_name || "your child");
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { childId, childName, loading };
};

// Main dashboard page
const GuardianDashboardMain = () => {
  const { user, profile } = useAuth();
  const { childId, childName, loading: childLoading } = useGuardianChild();
  const [intakeStatus, setIntakeStatus] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<string | null>(null);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const [{ data: intake }, { data: match }, { data: sess }] = await Promise.all([
        supabase.from("intake_sessions").select("status, severity_level").eq("user_id", childId).order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("matches").select("match_type, match_rationale").eq("user_id", childId).limit(1).single(),
        supabase.from("sessions_log").select("id").eq("user_id", childId),
      ]);
      setIntakeStatus(intake?.status || null);
      setMatchInfo(match ? (match.match_rationale || match.match_type) : null);
      setSessionsCount(sess.data?.length || 0);
      setLoading(false);
    };
    fetch();
  }, [childId]);

  const statCards = [
    { label: "Assessment Status", value: intakeStatus ? (intakeStatus === "completed" ? "Completed" : intakeStatus === "in_progress" ? "In Progress" : "Escalated") : "Not started" },
    { label: "Current Match", value: matchInfo || "Not matched yet" },
    { label: "Sessions Attended", value: String(sessionsCount) },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guardian Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitoring care for {childName}</p>
        </div>
        <NotificationBell />
      </div>

      {!childId && !childLoading && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-6 text-center">
          <p className="text-sm text-foreground mb-3">No patient linked yet. Please add your child's details first.</p>
          <Link to="/dashboard/guardian/add-patient" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <UserPlus className="h-4 w-4" /> Add Patient
          </Link>
        </div>
      )}

      {childId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(loading ? Array.from({ length: 3 }) : statCards).map((s: any, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-sm border card-hover">
              <p className="text-lg font-semibold text-foreground">{s.value || ""}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label || ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GuardianPortal = () => {
  const { pathname } = useLocation();
  const isMainDashboard = pathname === "/dashboard/guardian";

  return (
    <div className="flex min-h-screen bg-background">
      <GuardianSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          {isMainDashboard ? <GuardianDashboardMain /> : <Outlet />}
        </PageTransition>
      </main>
    </div>
  );
};

export default GuardianPortal;
