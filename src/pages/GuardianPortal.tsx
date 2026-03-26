import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Shield } from "lucide-react";

const moodData = Array.from({ length: 14 }, (_, i) => ({ day: `${i + 1}`, score: Math.floor(Math.random() * 3) + 5 }));

const GuardianPortal = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <main className="flex-1 min-w-0">
      <PageTransition>
        <div className="p-6 md:p-8 max-w-4xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">Guardian Portal</h1>
          <p className="text-sm text-muted-foreground mb-8">Monitoring care for your linked minor</p>

          {/* Ward Info */}
          <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-lg">Aarav P.</h2>
                <p className="text-sm text-muted-foreground">Age 15 · Matched: CBT for Teen Anxiety</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Intake Status</p>
                <p className="font-medium text-foreground">Completed</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sessions Attended</p>
                <p className="font-medium text-foreground">6 of 8</p>
              </div>
            </div>
          </div>

          {/* Mood */}
          <div className="bg-card rounded-xl p-6 shadow-sm border mb-6">
            <h2 className="font-semibold text-foreground mb-4">Mood Trend (Read Only)</h2>
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
          </div>

          {/* Consent */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold text-foreground mb-3">Consent Management</h2>
            <p className="text-sm text-muted-foreground">You have approved therapy sessions for Aarav P.</p>
            <button className="text-sm text-crisis hover:underline mt-2">Revoke consent</button>
          </div>
        </div>
      </PageTransition>
    </main>
  </div>
);

export default GuardianPortal;
