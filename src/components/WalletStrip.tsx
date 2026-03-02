import { motion } from "framer-motion";
import { Wallet, TrendingUp, Trophy, Flame } from "lucide-react";

const stats = [
  { icon: Wallet, label: "Balance", value: "₹0.00", color: "gradient-primary" },
  { icon: TrendingUp, label: "Winnings", value: "₹0.00", color: "gradient-green" },
  { icon: Trophy, label: "Games Won", value: "0", color: "gradient-gold" },
  { icon: Flame, label: "Streak", value: "0", color: "gradient-red" },
];

const WalletStrip = () => {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`${stat.color} rounded-2xl p-3 min-w-[130px] flex-shrink-0`}
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
