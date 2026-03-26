import { useState, useEffect } from "react";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import { PageTransition } from "@/components/PageTransition";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CONDITIONS = ["Generalized Anxiety", "Depression", "Alcohol Recovery", "Workplace Burnout", "Teen Anxiety", "PTSD", "OCD", "Other"];
const TYPE_MAP: Record<string, string> = { "Generalized Anxiety": "cbt_anxiety", "Depression": "cbt_anxiety", "Alcohol Recovery": "alcohol_recovery", "Workplace Burnout": "workplace_burnout", "Teen Anxiety": "teen_anxiety", "PTSD": "gad_mindfulness", "OCD": "gad_mindfulness", "Other": "gad_mindfulness" };

const TherapistGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [membersGroup, setMembersGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState("60");
  const [maxCap, setMaxCap] = useState("10");
  const [severity, setSeverity] = useState("moderate");
  const [whatToExpect, setWhatToExpect] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => { if (user) fetchGroups(); }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("therapy_groups").select("*").eq("therapist_id", user.id);
    setGroups(data || []);
    setLoading(false);
  };

  const createGroup = async () => {
    if (!user || !name || !condition) return;
    setSubmitting(true);
    const { error } = await supabase.from("therapy_groups").insert({
      name,
      therapist_id: user.id,
      type: (TYPE_MAP[condition] || "gad_mindfulness") as any,
      condition_focus: condition,
      description,
      location,
      schedule_json: { days: selectedDays, time } as any,
      session_duration_minutes: parseInt(duration),
      max_capacity: parseInt(maxCap),
      current_count: 0,
      severity_range: severity as any,
      what_to_expect: whatToExpect,
      is_active: isActive,
    });
    if (error) { toast({ title: error.message, variant: "destructive" }); }
    else { toast({ title: `Group '${name}' created successfully.` }); setCreateOpen(false); resetForm(); fetchGroups(); }
    setSubmitting(false);
  };

  const resetForm = () => { setName(""); setCondition(""); setDescription(""); setLocation(""); setSelectedDays([]); setTime("18:00"); setDuration("60"); setMaxCap("10"); setSeverity("moderate"); setWhatToExpect(""); setIsActive(true); };

  const viewMembers = async (group: any) => {
    setMembersGroup(group);
    if (!user) return;
    const { data: matchData } = await supabase.from("matches").select("user_id").eq("group_id", group.id).eq("therapist_id", user.id);
    if (matchData && matchData.length > 0) {
      const ids = matchData.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setMembers(profiles || []);
    } else { setMembers([]); }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <TherapistSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-foreground">My Groups</h1>
              <div className="flex items-center gap-3">
                <Button onClick={() => setCreateOpen(true)}>Create New Group</Button>
                <NotificationBell />
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16"><p className="text-sm text-muted-foreground">No groups created yet. Use the button above to create one.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <div key={g.id} className="bg-card rounded-xl shadow-sm border p-5 card-hover">
                    <h3 className="font-semibold text-foreground mb-1">{g.name}</h3>
                    <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">{g.condition_focus || g.type?.replace(/_/g, " ")}</span>
                    {g.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="h-3 w-3" />{g.location}</p>}
                    <p className="text-xs text-muted-foreground mb-2">{((g.schedule_json as any)?.days || []).join(" & ")}{(g.schedule_json as any)?.time ? `, ${(g.schedule_json as any).time}` : ""}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">{g.current_count || 0}/{g.max_capacity || 10}</span>
                      <Progress value={((g.current_count || 0) / (g.max_capacity || 10)) * 100} className="flex-1 h-1.5" />
                    </div>
                    {g.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{g.description}</p>}
                    <Button variant="outline" size="sm" onClick={() => viewMembers(g)}>View Members</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PageTransition>
      </main>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create a New Therapy Group</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Group Name</Label><Input className="mt-1" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Condition Focus</Label><Select value={condition} onValueChange={setCondition}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Description</Label><Textarea className="mt-1" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what this group focuses on..." /></div>
            <div><Label>Location</Label><Input className="mt-1" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 204, Apollo Clinic" /></div>
            <div><Label className="mb-2 block">Schedule Days</Label><div className="flex flex-wrap gap-2">{DAYS.map(d => (<label key={d} className="flex items-center gap-1.5 text-sm"><Checkbox checked={selectedDays.includes(d)} onCheckedChange={(c) => setSelectedDays(prev => c ? [...prev, d] : prev.filter(x => x !== d))} />{d.slice(0, 3)}</label>))}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Time</Label><Input type="time" className="mt-1" value={time} onChange={e => setTime(e.target.value)} /></div>
              <div><Label>Duration</Label><Select value={duration} onValueChange={setDuration}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="45">45 mins</SelectItem><SelectItem value="60">60 mins</SelectItem><SelectItem value="90">90 mins</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Max Capacity</Label><Input type="number" className="mt-1" value={maxCap} onChange={e => setMaxCap(e.target.value)} /></div>
              <div><Label>Severity Range</Label><Select value={severity} onValueChange={setSeverity}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>What to Expect (optional)</Label><Textarea className="mt-1" value={whatToExpect} onChange={e => setWhatToExpect(e.target.value)} placeholder="e.g. Each session includes a check-in, a CBT exercise..." /></div>
            <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label></div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createGroup} disabled={submitting || !name || !condition}>{submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Group</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Slide-over */}
      <Sheet open={!!membersGroup} onOpenChange={() => setMembersGroup(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{membersGroup?.name} — Members</SheetTitle></SheetHeader>
          <div className="mt-4">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members in this group yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{m.full_name?.[0]?.toUpperCase() || "?"}</div>
                    <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TherapistGroups;
