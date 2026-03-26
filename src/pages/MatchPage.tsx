import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { Progress } from "@/components/ui/progress";

const matches = [
  {
    name: "CBT for Anxiety",
    type: "Group Therapy",
    score: 94,
    schedule: "Tuesdays & Thursdays, 6:00 PM",
    therapist: "Dr. Priya Sharma, PhD",
    capacity: 7,
    maxCapacity: 10,
    rationale: "Matched based on GAD severity and CBT group availability.",
  },
  {
    name: "Mindfulness for GAD",
    type: "Group Therapy",
    score: 87,
    schedule: "Mondays & Wednesdays, 5:00 PM",
    therapist: "Dr. Arjun Mehta, PsyD",
    capacity: 9,
    maxCapacity: 12,
    rationale: "Strong alignment with mindfulness-based intervention preferences.",
  },
  {
    name: "Individual Sessions",
    type: "Individual",
    score: 81,
    schedule: "Flexible scheduling",
    therapist: "Dr. Neha Gupta, LCSW",
    capacity: 3,
    maxCapacity: 8,
    rationale: "Recommended for personalized attention based on functional impact score.",
  },
];

const MatchPage = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <main className="flex-1 min-w-0">
      <PageTransition>
        <div className="p-6 md:p-8 max-w-4xl">
          <h1 className="text-2xl font-bold text-foreground">Your recommended care options</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-8">
            Based on your assessment, here are your best-fit options.
          </p>

          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.name} className="bg-card rounded-xl shadow-sm border border-l-4 border-l-primary p-6 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{m.name}</h3>
                    <span className="inline-block text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded mt-1">
                      {m.type}
                    </span>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {m.score}% fit
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>📅 {m.schedule}</p>
                  <p>👩‍⚕️ {m.therapist}</p>
                  <div className="flex items-center gap-3">
                    <span>{m.capacity} of {m.maxCapacity} spots filled</span>
                    <Progress value={(m.capacity / m.maxCapacity) * 100} className="flex-1 h-2" />
                  </div>
                  <p className="italic">{m.rationale}</p>
                </div>

                <div className="flex gap-3">
                  <Button size="sm">Join This Group</Button>
                  <Button variant="outline" size="sm">Learn More</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    </main>
  </div>
);

export default MatchPage;
