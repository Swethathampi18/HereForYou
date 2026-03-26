import { Link, useLocation } from "react-router-dom";
import { Heart, Home, MessageCircle, Users, TrendingUp, Smile, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const patientNav = [
  { label: "Home", icon: Home, to: "/dashboard" },
  { label: "My Intake", icon: MessageCircle, to: "/intake" },
  { label: "My Match", icon: Users, to: "/match" },
  { label: "Progress", icon: TrendingUp, to: "/progress" },
  { label: "Mood Check-in", icon: Smile, to: "/dashboard/mood" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

export const DashboardSidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-card border-r min-h-screen sticky top-0">
      <div className="p-5 border-b">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-primary">HereForYou</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {patientNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.to
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Alex Patient</p>
            <p className="text-xs text-muted-foreground">Patient</p>
          </div>
        </div>
        <button className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
