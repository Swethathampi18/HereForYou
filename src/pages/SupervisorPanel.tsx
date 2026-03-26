import { Link, useLocation } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, LayoutDashboard, ClipboardList, AlertTriangle, ScrollText, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/supervisor" },
  { label: "Review Queue", icon: ClipboardList, to: "/supervisor/reviews" },
  { label: "Crisis Events", icon: AlertTriangle, to: "/supervisor/crisis" },
  { label: "Audit Log", icon: ScrollText, to: "/supervisor/audit" },
  { label: "Reports", icon: BarChart3, to: "/supervisor/reports" },
];

const reviewQueue = [
  { patient: "Ravi K.", severity: "High", confidence: 0.62, submitted: "Mar 25, 2026" },
  { patient: "Meera S.", severity: "Moderate", confidence: 0.55, submitted: "Mar 24, 2026" },
  { patient: "Arjun P.", severity: "Moderate", confidence: 0.68, submitted: "Mar 24, 2026" },
];

const crisisEvents = [
  { patient: "Sita R.", detected: "Mar 25, 11:42 AM", escalatedTo: "Dr. Sharma", status: "Active" },
];

const SupervisorPanel = () => {
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
            <Link key={item.to} to={item.to} className={cn(
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
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">S</div>
            <div>
              <p className="text-sm font-medium text-foreground">Dr. Kumar</p>
              <p className="text-xs text-muted-foreground">Supervisor</p>
            </div>
          </div>
          <button className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-3.5 w-3.5" />Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <h1 className="text-2xl font-bold text-foreground mb-8">Supervisor Panel</h1>

            {/* Review Queue */}
            <div className="bg-card rounded-xl shadow-sm border mb-8 overflow-hidden">
              <div className="p-5 border-b"><h2 className="font-semibold text-foreground">Review Queue</h2></div>
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Severity</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Confidence</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Submitted</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
                </tr></thead>
                <tbody>
                  {reviewQueue.map((r, i) => (
                    <tr key={r.patient} className={i % 2 ? "bg-muted/30" : ""}>
                      <td className="p-3 font-medium text-foreground">{r.patient}</td>
                      <td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.severity === "High" ? "bg-crisis/10 text-crisis" : "bg-warning/10 text-warning"
                      }`}>{r.severity}</span></td>
                      <td className="p-3 text-muted-foreground">{r.confidence.toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">{r.submitted}</td>
                      <td className="p-3 text-right"><Button variant="outline" size="sm">Review</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Crisis Events */}
            <div className="bg-card rounded-xl shadow-sm border border-l-4 border-l-crisis overflow-hidden">
              <div className="p-5 border-b flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-crisis" />
                <h2 className="font-semibold text-foreground">Active Crisis Events</h2>
              </div>
              <div className="divide-y">
                {crisisEvents.map((c) => (
                  <div key={c.patient} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.patient}</p>
                      <p className="text-xs text-muted-foreground">Detected: {c.detected} · Escalated to: {c.escalatedTo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-crisis/10 text-crisis animate-pulse-slow">{c.status}</span>
                      <Button variant="outline" size="sm">Mark Resolved</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default SupervisorPanel;
