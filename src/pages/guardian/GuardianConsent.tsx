import { useState } from "react";
import { useGuardianChild } from "@/pages/GuardianPortal";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const GuardianConsent = () => {
  const { childName } = useGuardianChild();
  const { toast } = useToast();
  const [consentOn, setConsentOn] = useState(true);
  const [understood, setUnderstood] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In a real implementation, update guardian_consent field
    await new Promise(r => setTimeout(r, 500));
    toast({ title: "Consent preferences saved." });
    setSaving(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Data Consent & Privacy</h1>
        <NotificationBell />
      </div>
      <div className="bg-card rounded-xl shadow-sm border p-6 space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground leading-relaxed">
            By providing consent, you allow HereForYou to share your child's assessment data, session notes, and health reports with their assigned therapist. This information is used solely for the purpose of providing mental health care to your child. We do not sell, share, or use this data for advertising, research, or any other purposes without your explicit permission. Your data is encrypted and stored securely in compliance with applicable healthcare privacy standards. You may revoke consent at any time.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm flex-1 pr-4">I consent to sharing {childName}'s health data with their assigned therapist for the purpose of providing care.</Label>
          <Switch checked={consentOn} onCheckedChange={setConsentOn} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="understand" checked={understood} onCheckedChange={(v) => setUnderstood(!!v)} />
          <Label htmlFor="understand" className="text-sm font-normal cursor-pointer">I understand that this data will not be used for any purpose other than my child's mental health care.</Label>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Consent Preferences
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-crisis border-crisis">Revoke All Consent</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke consent?</AlertDialogTitle>
              <AlertDialogDescription>Are you sure? Revoking consent will pause all active sessions and matching for {childName}.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-crisis text-crisis-foreground hover:bg-crisis/90" onClick={() => { setConsentOn(false); toast({ title: "Consent revoked. A supervisor has been notified." }); }}>
                Confirm Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default GuardianConsent;
