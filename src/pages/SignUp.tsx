import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageTransition } from "@/components/PageTransition";
import { Heart, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState("en");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ageError, setAgeError] = useState(false);

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const showGender = role === "patient" || role === "therapist";
  const showRelation = role === "guardian";

  const validateAge = (val: string) => {
    setAge(val);
    if (val && parseInt(val) < 18) {
      setAgeError(true);
    } else {
      setAgeError(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !password || !role || !phone || !city || !pincode) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (ageError) return;
    if (showGender && !gender) {
      toast({ title: "Please select your gender", variant: "destructive" });
      return;
    }
    if (showRelation && !guardianRelation) {
      toast({ title: "Please select your relation to the patient", variant: "destructive" });
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
        gender: showGender ? gender : "",
        phone,
        address,
        city,
        pincode,
        country,
        guardian_relation: showRelation ? guardianRelation : "",
      });
      toast({ title: "Account created successfully! Please log in." });
      navigate("/signin");
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
          <div className="bg-card rounded-xl shadow-sm border p-8 max-h-[85vh] overflow-y-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">Create your account</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="Your full name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* Gender - only for patient and therapist */}
              {showGender && (
                <div>
                  <Label>Gender *</Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="flex flex-wrap gap-4 mt-1.5">
                    {["Male", "Female", "Non-binary", "Prefer not to say"].map((g) => (
                      <div key={g} className="flex items-center gap-1.5">
                        <RadioGroupItem value={g.toLowerCase().replace(/ /g, "_")} id={`gender-${g}`} />
                        <Label htmlFor={`gender-${g}`} className="text-sm font-normal cursor-pointer">{g}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="Age" className="mt-1.5" value={age} onChange={(e) => validateAge(e.target.value)} onBlur={() => validateAge(age)} />
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

              {ageError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">You must be 18 or older to create an account. Please ask your parent or guardian to register on your behalf.</p>
                </div>
              )}

              {/* Location Fields */}
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" placeholder="+91 XXXXX XXXXX" className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="address">Address Line</Label>
                <Input id="address" placeholder="Street address, apartment, suite" className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" placeholder="City" className="mt-1.5" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input id="pincode" placeholder="6 digits" className="mt-1.5" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} />
                </div>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["India", "USA", "UK", "Canada", "Australia", "Other"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="therapist">Therapist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Guardian Relation */}
              {showRelation && (
                <div>
                  <Label>Your relation to the patient *</Label>
                  <Select value={guardianRelation} onValueChange={setGuardianRelation}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select relation" /></SelectTrigger>
                    <SelectContent>
                      {["Father", "Mother", "Sibling", "Relative", "Legal Guardian", "Other"].map((r) => (
                        <SelectItem key={r} value={r.toLowerCase().replace(/ /g, "_")}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                <Label htmlFor="terms" className="text-sm text-muted-foreground font-normal cursor-pointer">
                  I agree to the <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>
              <Button className="w-full mt-2" size="lg" onClick={handleSubmit} disabled={submitting || ageError}>
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
