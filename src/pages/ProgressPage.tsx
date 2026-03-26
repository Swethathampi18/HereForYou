import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Flame } from "lucide-react";

const moodData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  score: Math.floor(Math.random() * 4) + 4,
}));

const sessions = [
  { date: "Mar 20, 2026", type: "Group - CBT", status: "Attended", therapist: "Dr. Sharma" },
  { date: "Mar 18, 2026", type: "Group - CBT", status: "Attended", therapist: "Dr. Sharma" },
  { date: "Mar 15, 2026", type: "Group - CBT", status: "Missed", therapist: "Dr. Sharma" },
  { date: "Mar 13, 2026", type: "Group - CBT", status: "Attended", therapist: "Dr. Sharma" },
];

const ProgressPage = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <main className="flex-1 min-w-0">
      <PageTransition>
        <div className="p-6 md:p-8 max-w-5xl">
          <h1 className="text-2xl font-bold text-foreground mb-8">Your Progress</h1>

          {/* Mood Chart */}
          <div className="bg-card rounded-xl p-6 shadow-sm border mb-6">
            <h2 className="font-semibold text-foreground mb-4">Mood — Last 30 Days</h2>
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Streak */}
            <div className="bg-primary rounded-xl p-5 text-primary-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5" />
                <span className="font-semibold">Session Streak</span>
              </div>
              <p className="text-3xl font-bold">4 🔥</p>
              <p className="text-sm opacity-80 mt-1">Sessions attended in a row</p>
            </div>

            {/* Attendance */}
            <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="font-semibold text-foreground">Attendance</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Therapist</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={i} className={i % 2 ? "bg-muted/30" : ""}>
                      <td className="p-3 text-foreground">{s.date}</td>
                      <td className="p-3 text-muted-foreground">{s.type}</td>
                      <td className="p-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.status === "Attended" ? "bg-success/10 text-success" : "bg-crisis/10 text-crisis"
                        }`}>{s.status}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{s.therapist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageTransition>
    </main>
  </div>
);

export default ProgressPage;
