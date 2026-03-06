import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useGames";

interface HeaderProps {
  title?: string;
}

const Header = ({ title }: HeaderProps) => {
  const { user } = useAuth();
  const { data: settings = {} } = useSettings();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  const appName = settings.app_name || "Matka Pro";

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase.from("notifications").select("*").or(`user_id.eq.${user.id},is_global.eq.true`).eq("is_read", false).order("created_at", { ascending: false });
      setNotifs(data || []);
      setUnreadCount(data?.length || 0);
    };
    fetchNotifs();
    const channel = supabase.channel("notif-updates").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchNotifs()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const ids = notifs.filter(n => !n.is_global).map(n => n.id);
    if (ids.length > 0) await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    setUnreadCount(0);
    setShowNotifs(false);
  };

  return (
    <header className="bg-card/95 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary">
          <span className="text-primary-foreground font-display font-bold text-[11px]">{appName.slice(0, 2).toUpperCase()}</span>
        </div>
        <h1 className="font-display font-bold text-lg text-foreground">{title || appName}</h1>
      </div>
      {user && (
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[9px] text-destructive-foreground font-bold flex items-center justify-center animate-pulse">{unreadCount}</span>}
          </button>
          {showNotifs && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 top-12 w-72 bg-card rounded-xl p-3 z-50 max-h-64 overflow-y-auto space-y-2 border border-border/50 shadow-lg">
              <p className="text-foreground font-display font-bold text-sm">🔔 Notifications</p>
              {notifs.length > 0 ? notifs.slice(0, 10).map((n) => (
                <div key={n.id} className="bg-secondary rounded-lg p-2.5">
                  <p className="text-foreground text-xs font-semibold">{n.title}</p>
                  <p className="text-muted-foreground text-[10px]">{n.message}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5">{new Date(n.created_at).toLocaleString("hi-IN")}</p>
                </div>
              )) : <p className="text-muted-foreground text-xs text-center py-3">कोई notification नहीं</p>}
              {notifs.length > 0 && <button onClick={markAllRead} className="w-full text-primary text-xs font-semibold text-center pt-1">सब पढ़ा हुआ ✓</button>}
            </motion.div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
