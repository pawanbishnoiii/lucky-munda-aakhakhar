import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Download, ChevronDown, Calendar, Search } from "lucide-react";

interface ResultRow {
  game: string;
  timing: string;
  draw: string;
  oldResult: string;
  newResult: string;
  date: string;
}

const sampleResults: ResultRow[] = [
  { game: "New Gali", timing: "08:00 AM - 02:30 PM", draw: "02:30 PM", oldResult: "7", newResult: "42", date: "2026-03-02" },
  { game: "Desawar", timing: "08:00 AM - 05:00 PM", draw: "05:00 PM", oldResult: "3", newResult: "87", date: "2026-03-02" },
  { game: "Faridabad", timing: "10:00 AM - 06:15 PM", draw: "06:15 PM", oldResult: "9", newResult: "15", date: "2026-03-02" },
  { game: "Ghaziabad", timing: "09:00 AM - 07:00 PM", draw: "07:00 PM", oldResult: "1", newResult: "63", date: "2026-03-02" },
  { game: "New Gali", timing: "08:00 AM - 02:30 PM", draw: "02:30 PM", oldResult: "5", newResult: "28", date: "2026-03-01" },
  { game: "Desawar", timing: "08:00 AM - 05:00 PM", draw: "05:00 PM", oldResult: "8", newResult: "91", date: "2026-03-01" },
  { game: "Faridabad", timing: "10:00 AM - 06:15 PM", draw: "06:15 PM", oldResult: "2", newResult: "44", date: "2026-03-01" },
  { game: "Ghaziabad", timing: "09:00 AM - 07:00 PM", draw: "07:00 PM", oldResult: "6", newResult: "73", date: "2026-03-01" },
];

const games = ["All Games", "New Gali", "Desawar", "Faridabad", "Ghaziabad"];

const ResultsChart = () => {
  const [selectedGame, setSelectedGame] = useState("All Games");
  const [selectedDate, setSelectedDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = sampleResults.filter((r) => {
    if (selectedGame !== "All Games" && r.game !== selectedGame) return false;
    if (selectedDate && r.date !== selectedDate) return false;
    return true;
  });

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg text-foreground">Today's Results</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity">
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="glass rounded-xl p-3 flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Game</label>
                <div className="flex gap-2 flex-wrap">
                  {games.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGame(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedGame === g
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-xs w-full border-none outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="gradient-primary text-primary-foreground">
                <th className="px-3 py-3 text-left font-semibold text-xs">Game</th>
                <th className="px-3 py-3 text-left font-semibold text-xs">Draw</th>
                <th className="px-3 py-3 text-center font-semibold text-xs">Munda</th>
                <th className="px-3 py-3 text-center font-semibold text-xs">Aakhar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <motion.tr
                  key={`${row.game}-${row.date}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-3 py-3">
                    <div>
                      <p className="font-semibold text-foreground text-xs">{row.game}</p>
                      <p className="text-muted-foreground text-[10px]">{row.timing}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{row.draw}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="bg-accent/20 text-accent font-mono font-bold px-2 py-1 rounded-lg text-sm">
                      {row.oldResult}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="bg-primary/20 text-primary font-mono font-bold px-2 py-1 rounded-lg text-sm">
                      {row.newResult}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsChart;
