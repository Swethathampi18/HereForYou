import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, ArrowLeft } from "lucide-react";

const sections = [
  { title: "1. Acceptance of Terms", content: "By creating an account on HereForYou, you agree to these terms. If you do not agree, please do not use this platform." },
  { title: "2. Eligibility", content: "You must be 18 or older to create a patient account. Users aged 13-17 may use the platform only with a registered guardian's consent and supervision." },
  { title: "3. Nature of Service", content: "HereForYou provides AI-assisted mental health triage and connects users with licensed therapists. The AI system does not provide diagnosis or therapy. All clinical decisions are made by licensed human professionals." },
  { title: "4. Not an Emergency Service", content: "HereForYou is not an emergency service. If you or someone you know is in immediate danger, please call 112 (India) or your local emergency number immediately." },
  { title: "5. User Responsibilities", content: "You agree to provide accurate information during registration and assessment. You agree not to misuse the platform or attempt to access other users' data." },
  { title: "6. Therapist Conduct", content: "All therapists on HereForYou are licensed professionals. However, HereForYou does not guarantee specific outcomes from therapy." },
  { title: "7. Cancellation Policy", content: "Appointments may be cancelled or rescheduled up to 24 hours in advance. Late cancellations may affect your session history." },
  { title: "8. Termination", content: "We reserve the right to suspend or terminate accounts that violate these terms." },
  { title: "9. Changes to Terms", content: "We may update these terms periodically. Continued use of the platform constitutes acceptance of updated terms." },
];

const TermsPage = () => (
  <PageTransition>
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2"><Heart className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">HereForYou</span></Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</Link>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-foreground mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </PageTransition>
);

export default TermsPage;
