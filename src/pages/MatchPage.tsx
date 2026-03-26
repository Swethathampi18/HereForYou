import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { PageTransition } from "@/components/PageTransition";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapPin, Clock, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const MatchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [groups, setGroups] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailGroup, setDetailGroup] = useState<any>(null);
  const [detailTherapist, setDetailTherapist] = useState<any>(null);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: groupsData }, { data: therapistsData }] = await Promise.all([
      supabase.from("therapy_groups").select("*").eq("is_active", true),
      supabase.from("therapists").select("*").eq("accepting_patients", true),
    ]);

    // Enrich groups with therapist names
    const gData = groupsData || [];
    if (gData.length > 0) {
      const tIds = [...new Set(gData.map(g => g.therapist_id).filter(Boolean))];
      if (tIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", tIds);
        for (const g of gData) {
          (g as any).therapist_name = profiles?.find(p => p.id === g.therapist_id)?.full_name || "TBD";
        }
      }
    }
    setGroups(gData);

    // Enrich therapists with profile info
    const tData = therapistsData || [];
    if (tData.length > 0) {
      const ids = tData.map(t => t.id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      for (const t of tData) {
        (t as any).full_name = profiles?.find(p => p.id === t.id)?.full_name || "Therapist";
      }
    }
    setTherapists(tData);
    setLoading(false);
  };

  const joinGroup = async (group: any) => {
    if (!user) return;
    setJoining(group.id);

    if ((group.current_count || 0) >= (group.max_capacity || 10)) {
      await supabase.from("waitlist").insert({ user_id: user.id, group_id: group.id });
      toast({ title: "This group is full. You have been added to the waitlist.", variant: "destructive" });
      setJoining(null);
      return;
    }

    // Update or create match
    const { data: existingMatch } = await supabase.from("matches").select("id").eq("user_id", user.id).limit(1).single();
    if (existingMatch) {
      await supabase.from("matches").update({ group_id: group.id, match_type: "group" as const } as any).eq("id", existingMatch.id);
    } else {
      await supabase.from("matches").insert({ user_id: user.id, group_id: group.id, match_type: "group" as const, therapist_id: group.therapist_id, match_rationale: `Joined ${group.name}` });
    }

    // Increment count
    await supabase.from("therapy_groups").update({ current_count: (group.current_count || 0) + 1 } as any).eq("id", group.id);

    // Create next 4 sessions
    const sessionDates = getUpcomingSessions(group.schedule_json, 4);
    for (const d of sessionDates) {
      await supabase.from("sessions_log").insert({
        user_id: user.id,
        therapist_id: group.therapist_id,
        session_date: d.toISOString(),
        claims_status: "pending" as const,
        status: "pending",
      });
    }

    // Notifications
    await supabase.from("notifications").insert({
      recipient_id: user.id,
      type: "match",
      message: `You have successfully joined ${group.name}. ${sessionDates.length > 0 ? `Your first session is on ${sessionDates[0].toLocaleDateString()}.` : ""}`,
    } as any);

    if (group.therapist_id) {
      const { data: userProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      await supabase.from("notifications").insert({
        recipient_id: group.therapist_id,
        sender_id: user.id,
        type: "match",
        message: `${userProfile?.full_name || "A patient"} has joined your group ${group.name}.`,
      } as any);
    }

    toast({ title: `You have joined ${group.name}! Check your dashboard for upcoming sessions.` });
    setJoining(null);
    setDetailGroup(null);
    navigate("/dashboard/patient");
  };

  const getUpcomingSessions = (scheduleJson: any, count: number): Date[] => {
    if (!scheduleJson) return [];
    const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const days: number[] = ((scheduleJson as any)?.days || []).map((d: string) => dayMap[d.toLowerCase()]).filter((d: number | undefined) => d !== undefined);
    const time = (scheduleJson as any)?.time || "18:00";
    const [h, m] = time.split(":").map(Number);

    if (days.length === 0) return [];
    const results: Date[] = [];
    const now = new Date();
    let cursor = new Date(now);
    while (results.length < count) {
      cursor.setDate(cursor.getDate() + 1);
      if (days.includes(cursor.getDay())) {
        const d = new Date(cursor);
        d.setHours(h || 18, m || 0, 0, 0);
        results.push(d);
      }
    }
    return results;
  };

  const formatSchedule = (sj: any) => {
    if (!sj) return "TBD";
    const days = (sj as any)?.days || [];
    const time = (sj as any)?.time || "";
    return `${days.join(" & ")}${time ? `, ${time}` : ""}`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">
        <PageTransition>
          <div className="p-6 md:p-8 max-w-4xl">
            <h1 className="text-2xl font-bold text-foreground">Your recommended care options</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-8">Based on your assessment, here are your best-fit options.</p>

            {loading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
            ) : (
              <>
                {/* Groups */}
                {groups.length > 0 && (
                  <div className="space-y-4 mb-10">
                    <h2 className="font-semibold text-foreground">Group Therapy Options</h2>
                    {groups.map((g) => (
                      <div key={g.id} className="bg-card rounded-xl shadow-sm border border-l-4 border-l-primary p-6 card-hover">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{g.name}</h3>
                            <span className="inline-block text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded mt-1">{g.type?.replace(/_/g, " ")}</span>
                          </div>
                          {g.severity_range && <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{g.severity_range}</span>}
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mb-4">
                          <p>📅 {formatSchedule(g.schedule_json)}</p>
                          <p>👩‍⚕️ {(g as any).therapist_name || "TBD"}</p>
                          <div className="flex items-center gap-3">
                            <span>{g.current_count || 0} of {g.max_capacity || 10} spots filled</span>
                            <Progress value={((g.current_count || 0) / (g.max_capacity || 10)) * 100} className="flex-1 h-2" />
                          </div>
                          {g.description && <p className="italic line-clamp-2">{g.description}</p>}
                        </div>
                        <div className="flex gap-3">
                          <Button size="sm" onClick={() => joinGroup(g)} disabled={joining === g.id}>
                            {joining === g.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Join This Group
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDetailGroup(g)}>Learn More</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Individual Therapists */}
                <div className="mb-6">
                  <h2 className="font-semibold text-foreground mb-1">Prefer one-on-one support? Choose a therapist.</h2>
                  <p className="text-sm text-muted-foreground mb-4">Browse available therapists matched to your assessment.</p>
                  {therapists.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No therapists available at the moment.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {therapists.map((t) => (
                        <div key={t.id} className="bg-card rounded-xl shadow-sm border border-l-4 border-l-primary p-5 card-hover">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                              {(t as any).full_name?.[0]?.toUpperCase() || "T"}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{(t as any).full_name}</p>
                              <p className="text-xs text-muted-foreground">{t.credentials}</p>
                            </div>
                          </div>
                          {t.specialty && <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">{t.specialty}</span>}
                          {t.clinic_name && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{t.clinic_name}{t.city ? `, ${t.city}` : ""}</p>}
                          {t.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.bio}</p>}
                          <Button size="sm" className="mt-3 w-full" asChild>
                            <Link to={`/therapist-profile/${t.id}`}>View Profile & Book</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </PageTransition>
      </main>

      {/* Group Detail Slide-over */}
      <Sheet open={!!detailGroup} onOpenChange={() => setDetailGroup(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{detailGroup?.name}</SheetTitle></SheetHeader>
          {detailGroup && (
            <div className="space-y-4 mt-4">
              <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{detailGroup.type?.replace(/_/g, " ")}</span>
              {detailGroup.description && <p className="text-sm text-muted-foreground">{detailGroup.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Led by</p><p className="font-medium text-foreground">{(detailGroup as any).therapist_name}</p></div>
                <div><p className="text-muted-foreground">Location</p><p className="font-medium text-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{detailGroup.location || "TBD"}</p></div>
                <div><p className="text-muted-foreground">Schedule</p><p className="font-medium text-foreground">{formatSchedule(detailGroup.schedule_json)}</p></div>
                <div><p className="text-muted-foreground">Duration</p><p className="font-medium text-foreground">{detailGroup.session_duration_minutes || 60} mins</p></div>
                <div><p className="text-muted-foreground">Condition focus</p><p className="font-medium text-foreground">{detailGroup.condition_focus || "General"}</p></div>
                <div><p className="text-muted-foreground">Severity range</p><p className="font-medium text-foreground capitalize">{detailGroup.severity_range || "All"}</p></div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{detailGroup.current_count || 0} of {detailGroup.max_capacity || 10}</span>
                  <Progress value={((detailGroup.current_count || 0) / (detailGroup.max_capacity || 10)) * 100} className="flex-1 h-2" />
                </div>
              </div>
              {detailGroup.what_to_expect && (
                <div><p className="text-sm text-muted-foreground mb-1">What to expect</p><p className="text-sm text-foreground">{detailGroup.what_to_expect}</p></div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Upcoming sessions</p>
                <div className="space-y-1">
                  {getUpcomingSessions(detailGroup.schedule_json, 3).map((d, i) => (
                    <p key={i} className="text-sm text-foreground flex items-center gap-2"><Clock className="h-3 w-3 text-primary" />{d.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}</p>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => joinGroup(detailGroup)} disabled={joining === detailGroup.id}>
                {joining === detailGroup.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Join This Group
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MatchPage;
