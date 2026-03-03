import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Download, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResultRow {
  game_name: string;
  game_name_hindi: string | null;
  result_time: string;
  munda_result: number | null;
  aakhar_result: number | null;
  result_date: string;
}

const ResultsChart = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState("All Games");
  const [selectedDate, setSelectedDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: g } = await supabase.from("games").select("*").order("result_time");
      setGames(g || []);
      const { data: r } = await supabase.from("game_results").select("*, games(name, name_hindi, result_time)").order("result_date", { ascending: false }).limit(50);
      if (r) {
        setResults(r.map((row: any) => ({
          game_name: row.games?.name || "Unknown",
          game_name_hindi: row.games?.name_hindi || null,
          result_time: row.games?.result_time || "",
          munda_result: row.munda_result,
          aakhar_result: row.aakhar_result,
          result_date: row.result_date,
        })));
      }
    };
    fetchData();
  }, []);

  const filtered = results.filter((r) => {
    if (selectedGame !== "All Games" && r.game_name !== selectedGame) return false;
    if (selectedDate && r.result_date !== selectedDate) return false;
    return true;
  });

  const handleDownload = () => {
    const csv = [
      "Game,Hindi Name,Result Time,Munda,Aakhar,Date",
      ...filtered.map(r => `${r.game_name},${r.game_name_hindi || ""},${r.result_time},${r.munda_result ?? "-"},${r.aakhar_result ?? "-"},${r.result_date}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
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
            <Download className="w-3.5 h-3.5" /> डाउनलोड
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
            <div className="bg-card rounded-xl p-3 flex flex-col gap-3 border border-border/50">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">गेम</label>
                <div className="flex gap-2 flex-wrap">
                  {["All Games", ...games.map(g => g.name)].map((g) => (
                    <button key={g} onClick={() => setSelectedGame(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedGame === g ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                      {g === "All Games" ? "सभी गेम्स" : games.find(gm => gm.name === g)?.name_hindi || g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">तारीख</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-xs w-full border-none outline-none" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="gradient-primary text-primary-foreground">
                <th className="px-3 py-3 text-left font-semibold text-xs">गेम</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">समय</th>
                <th className="px-3 py-3 text-center font-semibold text-xs">मुंडा</th>
                <th className="px-3 py-3 text-center font-semibold text-xs">आखर</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <motion.tr key={`${row.game_name}-${row.result_date}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-3">
                    <div>
                      <p className="font-semibold text-foreground text-xs">{row.game_name_hindi || row.game_name}</p>
                      <p className="text-muted-foreground text-[10px]">{row.result_date}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{row.result_time}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="bg-accent/20 text-accent font-mono font-bold px-2.5 py-1 rounded-lg text-sm">{row.munda_result ?? "-"}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="bg-primary/15 text-primary font-mono font-bold px-2.5 py-1 rounded-lg text-sm">{row.aakhar_result ?? "-"}</span>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">कोई नतीजे नहीं मिले</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsChart;
