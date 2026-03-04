import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResultRow {
  game_name: string;
  game_name_hindi: string | null;
  result_time: string;
  aakhar_result: number | null;
  result_date: string;
}

const ResultsChart = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState("All Games");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: g } = await supabase.from("games").select("*").order("result_time");
      setGames(g || []);
      
      // Last 5 days
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const dateStr = fiveDaysAgo.toISOString().split("T")[0];
      
      const { data: r } = await supabase.from("game_results")
        .select("*, games(name, name_hindi, result_time)")
        .gte("result_date", dateStr)
        .order("result_date", { ascending: false });
      
      if (r) {
        setResults(r.map((row: any) => ({
          game_name: row.games?.name || "Unknown",
          game_name_hindi: row.games?.name_hindi || null,
          result_time: row.games?.result_time || "",
          aakhar_result: row.aakhar_result,
          result_date: row.result_date,
        })));
      }
    };
    fetchData();
  }, []);

  const filtered = results.filter((r) => {
    if (selectedGame !== "All Games" && r.game_name !== selectedGame) return false;
    return true;
  });

  // Group by date
  const dates = [...new Set(filtered.map(r => r.result_date))];

  const handleDownload = () => {
    const csv = [
      "Game,Time,Number,Date",
      ...filtered.map(r => `${r.game_name},${r.result_time},${r.aakhar_result ?? "-"},${r.result_date}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `results_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg text-foreground">📊 आज के नतीजे</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary/80 transition-colors">
            <Filter className="w-3.5 h-3.5" /> फ़िल्टर
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 gradient-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
            <div className="bg-card rounded-xl p-3 flex gap-2 flex-wrap border border-border/50">
              {["All Games", ...games.map(g => g.name)].map((g) => (
                <button key={g} onClick={() => setSelectedGame(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedGame === g ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {g === "All Games" ? "सभी" : games.find(gm => gm.name === g)?.name_hindi || g}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {dates.map(date => (
        <div key={date} className="mb-3">
          <p className="text-muted-foreground text-xs font-semibold mb-1.5 px-1">{new Date(date).toLocaleDateString("hi-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
          <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="gradient-primary text-primary-foreground">
                  <th className="px-3 py-2.5 text-left font-semibold text-xs">गेम</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-xs">समय</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-xs">नंबर</th>
                </tr>
              </thead>
              <tbody>
                {filtered.filter(r => r.result_date === date).map((row, i) => (
                  <motion.tr key={`${row.game_name}-${date}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2.5"><p className="font-semibold text-foreground text-xs">{row.game_name_hindi || row.game_name}</p></td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{row.result_time}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="bg-primary/15 text-primary font-mono font-bold px-2.5 py-1 rounded-lg text-sm">{row.aakhar_result != null ? String(row.aakhar_result).padStart(2, "0") : "-"}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div className="bg-card rounded-2xl p-8 text-center border border-border/50"><p className="text-muted-foreground text-sm">कोई नतीजे नहीं मिले</p></div>}
    </div>
  );
};

export default ResultsChart;
