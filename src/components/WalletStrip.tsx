import { motion } from "framer-motion";
import { Wallet, TrendingUp, Trophy, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const WalletStrip = () => {
  const { user } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet-strip", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 15000,
  });

  const { data: betStats } = useQuery({
    queryKey: ["bet-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("bets").select("status, payout").eq("user_id", user!.id);
      const wins = (data || []).filter(b => b.status === "won");
      const totalWin = wins.reduce((s, b) => s + Number(b.payout || 0), 0);
      return { totalWin, wonCount: wins.length };
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const balance = wallet ? Number(wallet.balance) : 0;

  const stats = [
    { icon: Wallet, label: "बैलेंस", value: user ? `₹${balance.toFixed(0)}` : "₹0", color: "gradient-primary" },
    { icon: TrendingUp, label: "जीत", value: `₹${betStats?.totalWin?.toFixed(0) || "0"}`, color: "gradient-green" },
    { icon: Trophy, label: "जीते गेम", value: String(betStats?.wonCount || 0), color: "gradient-gold" },
    { icon: Flame, label: "स्ट्रीक", value: "🔥", color: "gradient-red" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          className={`${stat.color} rounded-2xl p-3 min-w-[110px] flex-shrink-0`}
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className="w-4 h-4 text-primary-foreground/70" />
            <span className="text-primary-foreground/70 text-xs font-medium">{stat.label}</span>
          </div>
          <p className="text-primary-foreground font-display font-bold text-lg">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default WalletStrip;
