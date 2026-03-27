import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";
import { Loader2 } from "lucide-react";
import { useGuardianChild } from "@/pages/GuardianPortal";

const GuardianAddPatient = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { childId, childName, loading: childLoading } = useGuardianChild();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [language, setLanguage] = useState("en");
  const [primaryConcern, setPrimaryConcern] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const handleSubmit = async () => {
    if (!user || !fullName || !dob || !gender) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Create patient account via edge function or direct insert
      // For now we create a profile entry and link
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `patient_${Date.now()}@hereforyou.app`,
        password: `temp_${crypto.randomUUID()}`,
        options: {
          data: {
            full_name: fullName,
            role: "patient",
            age: String(age || ""),
            language,
            gender,
            phone,
            address,
            city,
            pincode,
            country,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create patient account");

      // Link guardian to patient
      await supabase.from("guardian_links").insert({
        guardian_id: user.id,
        patient_id: authData.user.id,
      });

      toast({ title: `${fullName} has been registered successfully.` });
      navigate("/dashboard/guardian/assessment");
    } catch (err: any) {
      toast({ title: err.message || "Failed to register patient", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (childLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  if (childId) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Patient Details</h1>
          <NotificationBell />
        </div>
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <p className="text-sm text-foreground">Your child <span className="font-semibold">{childName}</span> is already registered.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard/guardian/assessment")}>Go to Assessment</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Register Your Child or Patient</h1>
        <NotificationBell />
      </div>
      <div className="bg-card rounded-xl shadow-sm border p-6 space-y-4">
        <div>
          <Label>Full Name *</Label>
          <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date of Birth *</Label>
            <Input type="date" className="mt-1" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <Label>Age</Label>
            <Input className="mt-1" value={age !== null ? String(age) : ""} disabled />
          </div>
        </div>
        <div>
          <Label>Gender *</Label>
          <RadioGroup value={gender} onValueChange={setGender} className="flex flex-wrap gap-4 mt-1.5">
            {["Male", "Female", "Non-binary", "Prefer not to say"].map((g) => (
              <div key={g} className="flex items-center gap-1.5">
                <RadioGroupItem value={g.toLowerCase().replace(/ /g, "_")} id={`pg-${g}`} />
                <Label htmlFor={`pg-${g}`} className="text-sm font-normal cursor-pointer">{g}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div><Label>Phone Number</Label><Input type="tel" className="mt-1" placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><Label>Address</Label><Input className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>City</Label><Input className="mt-1" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div><Label>Pincode</Label><Input className="mt-1" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
        </div>
        <div><Label>Country</Label><Select value={country} onValueChange={setCountry}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["India", "USA", "UK", "Canada", "Australia", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Language Preference</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">Hindi</SelectItem><SelectItem value="ta">Tamil</SelectItem><SelectItem value="te">Telugu</SelectItem><SelectItem value="bn">Bengali</SelectItem></SelectContent></Select></div>
        <div><Label>Primary Concern</Label><Select value={primaryConcern} onValueChange={setPrimaryConcern}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Anxiety", "Depression", "Stress", "Behavioral Issues", "Sleep Problems", "Trauma", "Other"].map((c) => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Any known medical conditions (optional)</Label><Textarea className="mt-1" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} /></div>
        <div><Label>Current medications (optional)</Label><Textarea className="mt-1" value={medications} onChange={(e) => setMedications(e.target.value)} /></div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Register Patient
        </Button>
      </div>
    </div>
  );
};

export default GuardianAddPatient;
