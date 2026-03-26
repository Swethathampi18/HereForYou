import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { Bell, ArrowRight, ClipboardCheck, Users, CalendarDays } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const moodData = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  score: Math.floor(Math.random() * 4) + 5,
}));

const statCards = [
  { icon: ClipboardCheck, label: "Intake Status", value: "Not Started", color: "text-warning" },
  { icon: Users, label: "Match Status", value: "Pending", color: "text-muted-foreground" },
  { icon: CalendarDays, label: "Next Session", value: "Not scheduled", color: "text-muted-foreground" },
];

const Dashboard = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <main className="flex-1 min-w-0">
      <PageTransition>
        <div className="p-6 md:p-8 max-w-5xl">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Good morning, Alex</h1>
              <p className="text-sm text-muted-foreground mt-1">Here's your care overview</p>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-crisis" />
            </button>
          </div>

          {/* Status Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Start your 5-minute assessment</span> to get matched with the right support.
            </p>
            <Button asChild size="sm">
              <Link to="/intake">
                Begin Assessment <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {statCards.map((c) => (
              <div key={c.label} className="bg-card rounded-xl p-5 shadow-sm card-hover border">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <c.icon className="h-4 w-4 text-primary" />
                </div>
                <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Mood Chart */}
          <div className="bg-card rounded-xl p-6 shadow-sm border mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">Your mood over time</h2>
              <Button variant="outline" size="sm">Log Today's Mood</Button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(168 82% 32%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(168 82% 32%)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Care Plan */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold text-foreground mb-4">My Care Plan</h2>
            <p className="text-sm text-muted-foreground">
              Complete your assessment to receive your personalized care plan.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link to="/intake">Start Assessment</Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    </main>
  </div>
);

export default Dashboard;
