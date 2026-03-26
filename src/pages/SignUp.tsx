import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTransition } from "@/components/PageTransition";
import { Heart, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getRoleRedirect } from "@/components/RoleGuard";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState("en");
  const [role, setRole] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isMinor = age !== "" && parseInt(age) < 18;

  const handleSubmit = async () => {
    if (!name || !email || !password || !role) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Please agree to Terms and Privacy Policy", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, {
        full_name: name,
        role,
        age,
        language,
        ...(isMinor && guardianEmail ? { guardian_email: guardianEmail } : {}),
      });
      toast({ title: "Account created! You can now sign in." });
      navigate(getRoleRedirect(role));
    } catch (err: any) {
      toast({ title: err.message || "Sign up failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">HereForYou</span>
            </Link>
          </div>
          <div className="bg-card rounded-xl shadow-sm border p-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">Create your account</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your full name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="Age" className="mt-1.5" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
                <div>
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                      <SelectItem value="te">Telugu</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="therapist">Therapist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isMinor && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Guardian required</p>
                    <p className="text-xs text-muted-foreground mt-0.5">A guardian must register on your behalf.</p>
                    <Input placeholder="Guardian's email" className="mt-2" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal cursor-pointer">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms</a> and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </Label>
              </div>
              <Button className="w-full mt-2" size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/signin" className="text-primary hover:underline font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SignUp;
