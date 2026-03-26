import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { CheckCircle2, Clock, Users, FileText } from "lucide-react";

const IntakeResults = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <main className="flex-1 flex items-start justify-center p-6 md:p-8">
      <PageTransition>
        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-xl shadow-sm border p-8">
            {/* Checkmark */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Assessment Complete</h1>
            </div>

            {/* Severity */}
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-5 mb-6 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-warning text-warning-foreground text-sm font-semibold mb-3">
                Moderate
              </span>
              <p className="text-sm text-muted-foreground">
                Based on your responses, our system has classified your condition as moderate. A licensed clinician has been notified to review this.
              </p>
            </div>

            {/* ICD-10/CPT */}
            <div className="bg-muted/50 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Clinical Codes</span>
              </div>
              <p className="text-sm text-muted-foreground italic">Pending clinician review</p>
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-4">What happens next</h3>
              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, label: "Assessment complete", status: "done" },
                  { icon: Clock, label: "Matching in progress", status: "active" },
                  { icon: Users, label: "Your care team confirmed", status: "pending" },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === "done" ? "bg-success/10" :
                      step.status === "active" ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <step.icon className={`h-4 w-4 ${
                        step.status === "done" ? "text-success" :
                        step.status === "active" ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <span className={`text-sm ${
                      step.status === "pending" ? "text-muted-foreground" : "text-foreground font-medium"
                    }`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link to="/match">Continue to My Match</Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    </main>
  </div>
);

export default IntakeResults;
