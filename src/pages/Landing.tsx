import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { Heart, Shield, Users, ArrowRight, UserPlus, MessageCircle, AlertTriangle, Search, Brain, Stethoscope } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Onboarding", desc: "Create your secure account in under a minute." },
  { icon: MessageCircle, title: "AI Intake", desc: "A guided conversation to understand your needs." },
  { icon: AlertTriangle, title: "Severity Check", desc: "Smart classification based on clinical standards." },
  { icon: Shield, title: "Crisis Detection", desc: "Real-time safety monitoring throughout." },
  { icon: Search, title: "Smart Matching", desc: "Paired with the right group or therapist." },
  { icon: Stethoscope, title: "Human Therapy", desc: "Licensed professionals guide your care." },
];

const stats = [
  { value: "1 in 8", label: "people globally live with a mental health condition" },
  { value: "70%", label: "of people lack access to adequate mental health care" },
  { value: "10×", label: "more reach through group therapy models" },
];

const Landing = () => (
  <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">HereForYou</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
          Mental health support,{" "}
          <span className="text-primary">built around you.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          AI-assisted intake. Human-led therapy. Complete compliance.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild className="text-base px-8">
            <Link to="/signup">
              Start Your Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base px-8">
            <Link to="/signup">For Therapists</Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.value} className="bg-card rounded-xl p-6 shadow-sm border-t-4 border-t-primary card-hover">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-y py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.title} className="bg-background rounded-xl p-6 shadow-sm card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </div>
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">HereForYou</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p>Compassionate care, powered by technology.</p>
        </div>
      </footer>
    </div>
  </PageTransition>
);

export default Landing;
