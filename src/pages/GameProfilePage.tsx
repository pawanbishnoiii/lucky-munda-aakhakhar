import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Trophy, TrendingUp, Calendar, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/CountdownTimer";

const GameProfilePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;
    supabase.from("games").select("*").eq("id", gameId).maybeSingle().then(({ data }) => setGame(data));
    supabase.from("game_results").select("*").eq("game_id", gameId).order("result_date", { ascending: false }).limit(30)
      .then(({ data }) => setResults(data || []));
  }, [gameId]);

  if (!game) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const getStatus = () => {
    const now = new Date();
    const [h, m] = game.result_time.split(":").map(Number);
    const gameTime = new Date(); gameTime.setHours(h, m, 0);
    const closureTime = new Date(gameTime.getTime() - game.closure_minutes * 60000);
    if (now >= gameTime) return "closed";
    if (now >= closureTime) return "betting_closed";
    return "open";
  };

  const status = getStatus();
  const isBettingOpen = status === "open";

  // Group results by date for chart
  const uniqueDates = [...new Set(results.map(r => r.result_date))].slice(0, 15);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card/95 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b border-border/50">
        <button onClick={() => navigate("/games")} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-foreground">{game.name_hindi || game.name}</h1>
          <p className="text-muted-foreground text-xs">{game.name}</p>
        </div>
      </header>

      {/* Game Info Card */}
      <div className="px-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-5 shadow-glow-primary relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-foreground/5" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-primary-foreground font-display font-bold text-2xl">{game.name_hindi || game.name}</h2>
              <p className="text-primary-foreground/70 text-sm mt-1">नंबर बेटिंग गेम (01-100)</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isBettingOpen ? "bg-foreground/20 text-primary-foreground" : "bg-foreground/10 text-primary-foreground/60"}`}>
              {isBettingOpen ? "🟢 बेटिंग खुली" : status === "betting_closed" ? "🟡 बेटिंग बंद" : "🔴 बंद"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-foreground/10 rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-primary-foreground/60 mx-auto mb-1" />
              <p className="text-primary-foreground/60 text-[10px]">नतीजा समय</p>
              <p className="text-primary-foreground font-bold text-sm">{game.result_time}</p>
            </div>
            <div className="bg-foreground/10 rounded-xl p-3 text-center">
              <Trophy className="w-4 h-4 text-primary-foreground/60 mx-auto mb-1" />
              <p className="text-primary-foreground/60 text-[10px]">जीत Reward</p>
              <p className="text-primary-foreground font-bold text-sm">{game.payout_percentage}x</p>
            </div>
            <div className="bg-foreground/10 rounded-xl p-3 text-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground/60 mx-auto mb-1" />
              <p className="text-primary-foreground/60 text-[10px]">Commission</p>
              <p className="text-primary-foreground font-bold text-sm">{game.commission_percentage}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <CountdownTimer targetTime={game.result_time} label="नतीजे में बाकी" />
            {isBettingOpen && (
              <button onClick={() => navigate(`/bet/${game.id}`)} className="bg-foreground/20 hover:bg-foreground/30 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <Play className="w-4 h-4" /> बेट लगाएं
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Reward Info */}
      <div className="px-4 pt-4">
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <h3 className="font-display font-bold text-foreground mb-3">💰 Reward कैसे मिलता है?</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between bg-secondary rounded-xl px-4 py-3">
              <span className="text-muted-foreground">बेट Amount</span>
              <span className="text-foreground font-medium">₹100</span>
            </div>
            <div className="flex justify-between bg-secondary rounded-xl px-4 py-3">
              <span className="text-muted-foreground">Payout ({game.payout_percentage}x)</span>
              <span className="text-game-green font-bold">₹{(100 * game.payout_percentage / 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between bg-secondary rounded-xl px-4 py-3">
              <span className="text-muted-foreground">Platform Fee ({game.commission_percentage}%)</span>
              <span className="text-destructive font-medium">-₹{(100 * game.commission_percentage / 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between bg-primary/10 rounded-xl px-4 py-3 border border-primary/20">
              <span className="text-primary font-bold">Net Winning</span>
              <span className="text-primary font-bold">₹{(100 * game.payout_percentage / 100 - 100 * game.commission_percentage / 100).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result History Chart */}
      <div className="px-4 pt-4">
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> नतीजों का इतिहास</h3>
            <span className="text-muted-foreground text-xs">{results.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-semibold">तारीख</th>
                  <th className="px-3 py-2.5 text-center text-xs text-muted-foreground font-semibold">नंबर</th>
                </tr>
              </thead>
              <tbody>
                {results.length > 0 ? results.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2.5 text-foreground text-xs">{new Date(r.result_date).toLocaleDateString("hi-IN")}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="bg-primary/15 text-primary font-mono font-bold px-3 py-1 rounded-lg text-sm">
                        {r.aakhar_result != null ? String(r.aakhar_result).padStart(2, "0") : "-"}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} className="text-center py-8 text-muted-foreground text-sm">अभी कोई नतीजा नहीं</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA */}
      {isBettingOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto px-4 pb-4">
            <button onClick={() => navigate(`/bet/${game.id}`)} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-sm shadow-glow-primary flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> अभी बेट लगाएं →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameProfilePage;
