import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true } as any).eq("recipient_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const typeColor: Record<string, string> = {
    crisis: "text-crisis",
    waitlist: "text-success",
    match: "text-primary",
    review: "text-warning",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-crisis text-crisis-foreground text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>Mark all read</Button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
          ) : notifications.map((n) => (
            <div key={n.id} className={cn("p-3 text-sm", !n.read && "bg-primary/5")}>
              <p className={cn("font-medium", typeColor[n.type] || "text-foreground")}>{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
