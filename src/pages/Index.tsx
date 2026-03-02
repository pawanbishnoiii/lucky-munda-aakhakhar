import { motion } from "framer-motion";
import GameCard from "@/components/GameCard";
import WalletStrip from "@/components/WalletStrip";
import LiveTicker from "@/components/LiveTicker";
import ResultsChart from "@/components/ResultsChart";
import Header from "@/components/Header";
import CountdownTimer from "@/components/CountdownTimer";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const games = [
  { title: "New Gali", subtitle: "Satta King Game", nextResult: "2:30 PM", multiplier: "93x", players: 1247, color: "red" as const, status: "live" as const },
  { title: "Desawar", subtitle: "Satta King Game", nextResult: "5:00 PM", multiplier: "93x", players: 892, color: "blue" as const, status: "upcoming" as const },
  { title: "Faridabad", subtitle: "Satta King Game", nextResult: "6:15 PM", multiplier: "93x", players: 654, color: "green" as const, status: "upcoming" as const },
  { title: "Ghaziabad", subtitle: "Satta King Game", nextResult: "7:00 PM", multiplier: "93x", players: 543, color: "purple" as const, status: "upcoming" as const },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
          <div className="relative z-10">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3 h-3" /> Welcome to BetKing
              </span>
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Play Smart, <span className="text-gradient-gold">Win Big</span>
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                India's most trusted betting platform with instant payouts
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/games")}
                  className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow-glow-primary hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  Play Now <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate("/results")}
                  className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors"
                >
                  View Results
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <WalletStrip />
      
      <LiveTicker text="🔥 New Gali result coming at 2:30 PM — Desawar opens at 5:00 PM — ₹50,000 won by player today — Join now and play! 🎮" />

      {/* Quick Stats */}
      <div className="px-4 py-2 flex gap-3">
        {[
          { icon: TrendingUp, label: "Total Payout", value: "₹2.5Cr+", bg: "bg-game-green/10", text: "text-game-green" },
          { icon: Shield, label: "Verified", value: "100% Safe", bg: "bg-game-blue/10", text: "text-game-blue" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 flex-1 flex items-center gap-3`}>
            <s.icon className={`w-5 h-5 ${s.text}`} />
            <div>
              <p className="text-muted-foreground text-[10px]">{s.label}</p>
              <p className={`font-display font-bold text-sm ${s.text}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live Games */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display font-bold text-lg text-foreground">Live Games</h2>
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            ▶ {games.filter(g => g.status === "live").length} Active
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {games.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <GameCard {...game} onPlay={() => navigate("/games")} />
            </motion.div>
          ))}
        </div>
      </div>

      <ResultsChart />
    </div>
  );
};

export default Index;
