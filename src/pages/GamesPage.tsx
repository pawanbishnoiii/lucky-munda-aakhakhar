import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import CountdownTimer from "@/components/CountdownTimer";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search } from "lucide-react";

const allGames = [
  { title: "New Gali", subtitle: "Munda & Aakhar", nextResult: "2:30 PM", multiplier: "93x", players: 1247, color: "red" as const, status: "live" as const, time: "14:30" },
  { title: "Desawar", subtitle: "Munda & Aakhar", nextResult: "5:00 PM", multiplier: "93x", players: 892, color: "blue" as const, status: "upcoming" as const, time: "17:00" },
  { title: "Faridabad", subtitle: "Munda & Aakhar", nextResult: "6:15 PM", multiplier: "93x", players: 654, color: "green" as const, status: "upcoming" as const, time: "18:15" },
  { title: "Ghaziabad", subtitle: "Munda & Aakhar", nextResult: "7:00 PM", multiplier: "93x", players: 543, color: "purple" as const, status: "upcoming" as const, time: "19:00" },
  { title: "Mumbai Morning", subtitle: "Aakhar Only", nextResult: "10:30 AM", multiplier: "90x", players: 320, color: "orange" as const, status: "closed" as const, time: "10:30" },
  { title: "Delhi Bazaar", subtitle: "Munda Only", nextResult: "8:00 PM", multiplier: "95x", players: 410, color: "cyan" as const, status: "upcoming" as const, time: "20:00" },
];

const GamesPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "closed">("all");

  const filtered = allGames.filter((g) => {
    if (filter !== "all" && g.status !== filter) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Games" />

      <div className="px-4 py-3">
        {/* Search */}
        <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-foreground text-sm w-full outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {(["all", "live", "upcoming", "closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filter === f
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f === "all" ? "All Games" : f}
            </button>
          ))}
        </div>

        {/* Countdown Timers */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {allGames.filter(g => g.status !== "closed").map((g) => (
            <div key={g.title} className="glass rounded-xl p-3 min-w-[140px] flex-shrink-0">
              <p className="text-foreground font-semibold text-xs mb-2">{g.title}</p>
              <CountdownTimer targetTime={g.time} label="Closes in" />
            </div>
          ))}
        </div>

        {/* Games List */}
        <div className="flex flex-col gap-4">
          {filtered.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GameCard {...game} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No games found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
