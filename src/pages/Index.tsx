import { motion } from "framer-motion";
import GameCard from "@/components/GameCard";
import WalletStrip from "@/components/WalletStrip";
import LiveTicker from "@/components/LiveTicker";
import ResultsChart from "@/components/ResultsChart";
import Header from "@/components/Header";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const colorOptions = ["red", "blue", "green", "purple", "orange", "cyan"] as const;

const Index = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const [tickerText, setTickerText] = useState("🔥 BK Matka — खेलो और जीतो!");

  useEffect(() => {
    supabase.from("games").select("*").eq("is_active", true).order("result_time")
      .then(({ data }) => setGames(data || []));
    supabase.from("admin_settings").select("*").eq("key", "live_ticker").maybeSingle()
      .then(({ data }) => { if (data) setTickerText(data.value); });
  }, []);

  const getStatus = (resultTime: string) => {
    const now = new Date();
    const [h, m] = resultTime.split(":").map(Number);
    const gameTime = new Date(); gameTime.setHours(h, m, 0);
    const diff = gameTime.getTime() - now.getTime();
    if (diff < 0) return "closed";
    if (diff < 3600000) return "live";
    return "upcoming";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-4 pb-2">
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
          <div className="relative z-10">
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3"><Sparkles className="w-3 h-3" /> BK Matka में आपका स्वागत है</span>
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">समझदारी से खेलो, <span className="text-gradient-gold">बड़ा जीतो</span></h2>
              <p className="text-muted-foreground text-sm mb-4">India का सबसे भरोसेमंद Matka platform</p>
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

      <div className="px-4 py-2 flex gap-3">
        {[
          { icon: TrendingUp, label: "Total Payout", value: "₹2.5Cr+", bg: "bg-game-green/10", text: "text-game-green" },
          { icon: Shield, label: "Verified", value: "100% Safe", bg: "bg-game-blue/10", text: "text-game-blue" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 flex-1 flex items-center gap-3`}>
            <s.icon className={`w-5 h-5 ${s.text}`} />
            <div><p className="text-muted-foreground text-[10px]">{s.label}</p><p className={`font-display font-bold text-sm ${s.text}`}>{s.value}</p></div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display font-bold text-lg text-foreground">🎮 लाइव गेम्स</h2>
          <span className="text-xs text-primary font-medium flex items-center gap-1">▶ {games.filter(g => getStatus(g.result_time) === "live").length} Active</span>
        </div>
        <div className="flex flex-col gap-4">
          {games.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
              <GameCard
                title={game.name_hindi || game.name}
                subtitle={game.game_type === "both" ? "मुंडा और आखर" : game.game_type === "munda" ? "मुंडा" : "आखर"}
                nextResult={game.result_time}
                multiplier={`${game.payout_percentage}x`}
                color={colorOptions[i % colorOptions.length]}
                status={getStatus(game.result_time)}
                onPlay={() => navigate("/games")}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <ResultsChart />
    </div>
  );
};

export default Index;
