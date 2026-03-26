import { Link, useLocation } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, LayoutDashboard, Users, UserCircle, FileText, Receipt, Settings, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/therapist" },
  { label: "My Groups", icon: Users, to: "/therapist/groups" },
  { label: "Patients", icon: UserCircle, to: "/therapist/patients" },
  { label: "Session Notes", icon: FileText, to: "/therapist/notes" },
  { label: "Claims", icon: Receipt, to: "/therapist/claims" },
  { label: "Settings", icon: Settings, to: "/therapist/settings" },
];

const stats = [
  { label: "Total Patients", value: "24" },
  { label: "Active Groups", value: "3" },
  { label: "Sessions This Week", value: "8" },
  { label: "Pending Claims", value: "5" },
];

const flaggedIntakes = [
  { name: "Ravi K.", severity: "High", reason: "Confidence 0.62 — ambiguous responses" },
  { name: "Meera S.", severity: "Moderate", reason: "Confidence 0.55 — substance use indicators" },
];

const TherapistDashboard = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex flex-col w-60 bg-card border-r min-h-screen sticky top-0">
        <div className="p-5 border-b">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-primary">HereForYou</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === item.to ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">P</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Dr. Priya Sharma</p>
              <p className="text-xs text-muted-foreground">Therapist</p>
            </div>
          </div>
          <button className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <h1 className="text-2xl font-bold text-foreground mb-8">Therapist Dashboard</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="bg-card rounded-xl p-5 shadow-sm border card-hover">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Flagged Intakes */}
            <div className="bg-card rounded-xl shadow-sm border border-l-4 border-l-crisis mb-8">
              <div className="p-5 border-b flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-crisis" />
                <h2 className="font-semibold text-foreground">Flagged Intakes — Needs Review</h2>
              </div>
              <div className="divide-y">
                {flaggedIntakes.map((f) => (
                  <div key={f.name} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.reason}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        f.severity === "High" ? "bg-crisis/10 text-crisis" : "bg-warning/10 text-warning"
                      }`}>{f.severity}</span>
                      <Button variant="outline" size="sm">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Groups */}
            <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="font-semibold text-foreground">My Groups</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Group</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Members</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Next Session</th>
                    <th className="text-right p-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-medium text-foreground">CBT for Anxiety</td>
                    <td className="p-3 text-muted-foreground">CBT</td>
                    <td className="p-3 text-muted-foreground">7/10</td>
                    <td className="p-3 text-muted-foreground">Tue, Mar 24</td>
                    <td className="p-3 text-right"><Button variant="ghost" size="sm">View</Button></td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="p-3 font-medium text-foreground">Mindfulness GAD</td>
                    <td className="p-3 text-muted-foreground">Mindfulness</td>
                    <td className="p-3 text-muted-foreground">9/12</td>
                    <td className="p-3 text-muted-foreground">Wed, Mar 25</td>
                    <td className="p-3 text-right"><Button variant="ghost" size="sm">View</Button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default TherapistDashboard;
