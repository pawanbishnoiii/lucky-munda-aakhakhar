import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  title?: string;
}

const Header = ({ title }: HeaderProps) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("notifications").select("*").or(`user_id.eq.${user.id},is_global.eq.true`).eq("is_read", false).order("created_at", { ascending: false });
      setNotifs(data || []);
      setUnreadCount(data?.length || 0);
    };
    fetch();
    const channel = supabase.channel("notif-updates").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetch()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const ids = notifs.filter(n => !n.is_global).map(n => n.id);
    if (ids.length > 0) await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    // For global notifications, we insert a read record or just hide them
    setUnreadCount(0);
    setShowNotifs(false);
  };

  return (
    <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary">
          <span className="text-primary-foreground font-display font-bold text-sm">BK</span>
        </div>
        <h1 className="font-display font-bold text-lg text-foreground">{title || "BK Matka"}</h1>
      </div>
      <div className="relative">
        <button onClick={() => setShowNotifs(!showNotifs)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[8px] text-destructive-foreground font-bold flex items-center justify-center">{unreadCount}</span>}
        </button>
        {showNotifs && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 top-12 w-72 glass rounded-xl p-3 z-50 max-h-60 overflow-y-auto space-y-2">
            {notifs.length > 0 ? notifs.slice(0, 10).map((n) => (
              <div key={n.id} className="bg-secondary rounded-lg p-2">
                <p className="text-foreground text-xs font-semibold">{n.title}</p>
                <p className="text-muted-foreground text-[10px]">{n.message}</p>
              </div>
            )) : <p className="text-muted-foreground text-xs text-center py-2">कोई notification नहीं</p>}
            {notifs.length > 0 && <button onClick={markAllRead} className="w-full text-primary text-xs font-semibold text-center pt-1">सब पढ़ा हुआ</button>}
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
