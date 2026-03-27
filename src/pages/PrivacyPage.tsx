import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Heart, ArrowLeft } from "lucide-react";

const sections = [
  { title: "1. Information We Collect", content: "We collect information you provide during registration including name, age, gender, contact details, and location. We also collect mental health assessment responses, session notes, mood check-in data, and appointment history for the purpose of providing care." },
  { title: "2. How We Use Your Information", content: "Your data is used exclusively to match you with appropriate mental health professionals, facilitate therapy sessions, and track your progress over time. We do not use your data for advertising, marketing, or any commercial purpose." },
  { title: "3. Data Sharing", content: "Your health information is shared only with your assigned therapist and, if applicable, your guardian — with your explicit consent. We do not sell or share your data with third parties under any circumstances." },
  { title: "4. Data Security", content: "All data is encrypted in transit and at rest. We use industry-standard security practices to protect your information. Access to health records is restricted to authorized personnel only." },
  { title: "5. Your Rights", content: "You have the right to access, correct, or delete your personal data at any time. You may revoke consent for data sharing through your account settings. To request data deletion, contact us at hereforyou@gmail.com." },
  { title: "6. Cookies", content: "We use essential cookies only to maintain your login session. We do not use tracking or advertising cookies." },
  { title: "7. Contact", content: "For privacy-related queries, email us at hereforyou@gmail.com or call +91 98765 43210." },
];

const PrivacyPage = () => (
  <PageTransition>
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2"><Heart className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">HereForYou</span></Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</Link>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
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

export default PrivacyPage;
