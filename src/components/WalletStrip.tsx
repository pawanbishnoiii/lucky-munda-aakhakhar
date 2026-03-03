import { motion } from "framer-motion";
import { Wallet, TrendingUp, Trophy, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const WalletStrip = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setBalance(parseFloat(data.balance as any)); });
  }, [user]);

  const stats = [
    { icon: Wallet, label: "बैलेंस", value: user ? `₹${balance.toFixed(0)}` : "₹0", color: "gradient-primary" },
    { icon: TrendingUp, label: "जीत", value: "₹0", color: "gradient-green" },
    { icon: Trophy, label: "जीते गेम", value: "0", color: "gradient-gold" },
    { icon: Flame, label: "स्ट्रीक", value: "0", color: "gradient-red" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`${stat.color} rounded-2xl p-3 min-w-[120px] flex-shrink-0`}
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
