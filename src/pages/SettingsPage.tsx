import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SettingsPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [language, setLanguage] = useState(profile?.language || "en");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, language }).eq("id", user.id);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved!" });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="bg-card rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-foreground mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" value={user?.email || ""} disabled />
            </div>
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                  <SelectItem value="te">Telugu</SelectItem>
                  <SelectItem value="kn">Kannada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Changes
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="font-semibold text-foreground mb-4">Privacy</h2>
          <div className="space-y-3">
            <Button variant="outline" onClick={() => toast({ title: "Your data export will be emailed to you shortly." })}>
              Download my data
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive ml-3">Delete my account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. All your data will be permanently deleted.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground">Confirm Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="font-semibold text-foreground mb-4">Account</h2>
          <Button variant="outline" className="text-destructive border-destructive" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
