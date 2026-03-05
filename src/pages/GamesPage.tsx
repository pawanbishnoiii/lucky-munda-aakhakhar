import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGames, getStatus } from "@/hooks/useGames";
import { Skeleton } from "@/components/ui/skeleton";

const colorOptions = ["red", "blue", "green", "purple", "orange", "cyan"] as const;

const GamesPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "closed">("all");
  const { data: games = [], isLoading } = useGames();
  const navigate = useNavigate();

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

        {/* Quick countdown strip */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {games.filter(g => getStatus(g.result_time) !== "closed").map((g) => (
            <div key={g.id} onClick={() => navigate(`/game/${g.id}`)} className="bg-card rounded-xl p-3 min-w-[140px] flex-shrink-0 border border-border/50 shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
              <p className="text-foreground font-semibold text-xs mb-2 flex items-center gap-1"><Zap className="w-3 h-3 text-primary" />{g.name_hindi || g.name}</p>
              <CountdownTimer targetTime={g.result_time} label="बंद होने में" />
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((game, i) => (
              <motion.div key={game.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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
            {filtered.length === 0 && <div className="text-center py-10 text-muted-foreground">कोई गेम नहीं मिला</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
