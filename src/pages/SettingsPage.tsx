import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SettingsPage = () => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [language, setLanguage] = useState(profile?.language || "en");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const showGender = role === "patient" || role === "therapist";
  const showRelation = role === "guardian";

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setLanguage(data.language || "en");
        setGender((data as any).gender || "");
        setPhone((data as any).phone || "");
        setAddress((data as any).address || "");
        setCity((data as any).city || "");
        setPincode((data as any).pincode || "");
        setCountry((data as any).country || "India");
        setGuardianRelation((data as any).guardian_relation || "");
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, language,
      gender: showGender ? gender : undefined,
      phone, address, city, pincode, country,
      guardian_relation: showRelation ? guardianRelation : undefined,
    } as any).eq("id", user.id);
    if (error) toast({ title: error.message, variant: "destructive" });
    else toast({ title: "Profile updated successfully." });
    setSaving(false);
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: error.message, variant: "destructive" });
    else {
      toast({ title: "Password updated successfully." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
    setUpdatingPassword(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      {/* Profile */}
      <div className="bg-card rounded-xl shadow-sm border p-6 space-y-4 mb-6">
        <h2 className="font-semibold text-foreground">My Profile</h2>
        <div><Label>Full Name</Label><Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div><Label>Email</Label><Input className="mt-1" value={user?.email || ""} disabled /></div>
        {showGender && (
          <div>
            <Label>Gender</Label>
            <RadioGroup value={gender} onValueChange={setGender} className="flex flex-wrap gap-3 mt-1.5">
              {["Male", "Female", "Non-binary", "Prefer not to say"].map((g) => (
                <div key={g} className="flex items-center gap-1.5">
                  <RadioGroupItem value={g.toLowerCase().replace(/ /g, "_")} id={`sg-${g}`} />
                  <Label htmlFor={`sg-${g}`} className="text-sm font-normal cursor-pointer">{g}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
        <div><Label>Phone</Label><Input className="mt-1" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><Label>Address</Label><Input className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>City</Label><Input className="mt-1" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div><Label>Pincode</Label><Input className="mt-1" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
        </div>
        <div><Label>Country</Label><Select value={country} onValueChange={setCountry}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["India", "USA", "UK", "Canada", "Australia", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Language</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">Hindi</SelectItem><SelectItem value="ta">Tamil</SelectItem><SelectItem value="te">Telugu</SelectItem><SelectItem value="kn">Kannada</SelectItem></SelectContent></Select></div>
        {showRelation && (
          <div><Label>Relation to Patient</Label><Select value={guardianRelation} onValueChange={setGuardianRelation}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Father", "Mother", "Sibling", "Relative", "Legal Guardian", "Other"].map(r => <SelectItem key={r} value={r.toLowerCase().replace(/ /g, "_")}>{r}</SelectItem>)}</SelectContent></Select></div>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Changes
        </Button>
      </div>

      {/* Change Password */}
      <div className="bg-card rounded-xl shadow-sm border p-6 space-y-4 mb-6">
        <h2 className="font-semibold text-foreground">Change Password</h2>
        <div><Label>Current Password</Label><Input className="mt-1" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
        <div><Label>New Password</Label><Input className="mt-1" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
        <div><Label>Confirm New Password</Label><Input className="mt-1" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
        <Button onClick={handlePasswordUpdate} disabled={updatingPassword}>
          {updatingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Update Password
        </Button>
      </div>

      {/* Privacy */}
      <div className="bg-card rounded-xl shadow-sm border p-6 space-y-3 mb-6">
        <h2 className="font-semibold text-foreground">Privacy</h2>
        <Button variant="outline" onClick={() => toast({ title: "Your data export will be emailed to you shortly." })}>Download my data</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive border-destructive ml-3">Delete my account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete account?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground">Confirm Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Account */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-foreground mb-4">Account</h2>
        <Button variant="outline" className="text-destructive border-destructive" onClick={handleLogout}>Log Out</Button>
      </div>
    </div>
  );
};

export default SettingsPage;
