import { motion } from "framer-motion";
import GameCard from "@/components/GameCard";
import WalletStrip from "@/components/WalletStrip";
import LiveTicker from "@/components/LiveTicker";
import ResultsChart from "@/components/ResultsChart";
import Header from "@/components/Header";
import { ArrowRight, Sparkles, TrendingUp, Shield, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGames, useSettings, getStatus } from "@/hooks/useGames";
import { Skeleton } from "@/components/ui/skeleton";

const colorOptions = ["red", "blue", "green", "purple", "orange", "cyan"] as const;

const Index = () => {
  const navigate = useNavigate();
  const { data: games = [], isLoading } = useGames();
  const { data: settings = {} } = useSettings();
  const tickerText = settings.live_ticker || "🔥 खेलो और जीतो — सबसे भरोसेमंद Platform!";
  const appName = settings.app_name || "Matka Pro";

  const liveCount = games.filter(g => getStatus(g.result_time) === "live").length;

  return (
    <div className="min-h-screen bg-background bg-grid pb-24 relative">
      <div className="fixed top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-40 left-0 w-48 h-48 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <Header />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-2 relative">
        <div className="bg-card rounded-2xl p-5 relative overflow-hidden border border-border/50 shadow-sm">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-accent/5 blur-2xl" />
          <div className="relative z-10">
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3"><Sparkles className="w-3 h-3" /> {appName} में स्वागत है</span>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">समझदारी से खेलो, <span className="text-gradient-gold">बड़ा जीतो</span></h1>
              <p className="text-muted-foreground text-sm mb-4">India का सबसे भरोसेमंद Platform</p>
              <div className="flex gap-2">
                <button onClick={() => navigate("/games")} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow-glow-primary hover:opacity-90 transition-opacity flex items-center gap-1.5">अभी खेलें <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => navigate("/results")} className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors">नतीजे देखें</button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <WalletStrip />
      <LiveTicker text={tickerText} />

      <div className="px-4 py-2 grid grid-cols-3 gap-2">
        {[
          { icon: TrendingUp, label: "Payout", value: "Fast", bg: "bg-game-green/10", text: "text-game-green" },
          { icon: Shield, label: "Verified", value: "100% Safe", bg: "bg-game-blue/10", text: "text-game-blue" },
          { icon: Users, label: "Players", value: "Active", bg: "bg-game-purple/10", text: "text-game-purple" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 flex flex-col items-center gap-1 border border-border/30`}>
            <s.icon className={`w-5 h-5 ${s.text}`} />
            <p className={`font-display font-bold text-sm ${s.text}`}>{s.value}</p>
            <p className="text-muted-foreground text-[9px]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display font-bold text-lg text-foreground">🎮 लाइव गेम्स</h2>
          <span className="text-xs text-primary font-medium flex items-center gap-1"><Zap className="w-3 h-3" /> {liveCount} Active</span>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {games.map((game, i) => (
              <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GameCard
                  title={game.name_hindi || game.name}
                  subtitle="आखर (01-100)"
                  nextResult={game.result_time}
                  multiplier={`${game.payout_percentage}x`}
                  color={colorOptions[i % colorOptions.length]}
                  status={getStatus(game.result_time)}
                  onPlay={() => navigate(`/game/${game.id}`)}
                />
              </motion.div>
            ))}
            {games.length === 0 && <p className="text-center text-muted-foreground py-8">कोई गेम उपलब्ध नहीं</p>}
          </div>
        )}
      </div>

      <ResultsChart />
    </div>
  );
};

export default Index;
