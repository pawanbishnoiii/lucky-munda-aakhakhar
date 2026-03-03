import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const colorOptions = ["red", "blue", "green", "purple", "orange", "cyan"] as const;

const GamesPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "closed">("all");
  const [games, setGames] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("games").select("*").eq("is_active", true).order("result_time")
      .then(({ data }) => setGames(data || []));
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

  const filtered = games.filter((g) => {
    const status = getStatus(g.result_time);
    if (filter !== "all" && status !== filter) return false;
    if (search && !(g.name.toLowerCase().includes(search.toLowerCase()) || g.name_hindi?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background bg-dots pb-24">
      <Header title="गेम्स" />

      <div className="px-4 py-3">
        <div className="bg-card rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3 border border-border/50 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="गेम खोजें..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-foreground text-sm w-full outline-none placeholder:text-muted-foreground" />
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {(["all", "live", "upcoming", "closed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${filter === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {f === "all" ? "सभी गेम्स" : f === "live" ? "🔴 लाइव" : f === "upcoming" ? "🕐 आने वाले" : "बंद"}
            </button>
          ))}
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {games.filter(g => getStatus(g.result_time) !== "closed").map((g) => (
            <div key={g.id} className="bg-card rounded-xl p-3 min-w-[140px] flex-shrink-0 border border-border/50 shadow-sm">
              <p className="text-foreground font-semibold text-xs mb-2">{g.name_hindi || g.name}</p>
              <CountdownTimer targetTime={g.result_time} label="बंद होने में" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {filtered.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GameCard
                title={game.name_hindi || game.name}
                subtitle={game.game_type === "both" ? "मुंडा और आखर" : game.game_type === "munda" ? "मुंडा" : "आखर"}
                nextResult={game.result_time}
                multiplier={`${game.payout_percentage}x`}
                color={colorOptions[i % colorOptions.length]}
                status={getStatus(game.result_time)}
                onPlay={() => navigate(`/bet/${game.id}`)}
              />
            </motion.div>
          ))}
          {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground">कोई गेम नहीं मिला</div>}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
