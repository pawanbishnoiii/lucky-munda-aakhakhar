import { motion, AnimatePresence } from "framer-motion";
import { Filter, Download, Calendar, Image, ChevronLeft, ChevronRight } from "lucide-react";
import { useGames, useGameResults } from "@/hooks/useGames";
import { useState, useRef, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ResultsChart = () => {
  const { data: games = [] } = useGames();
  const { data: rawResults = [], isLoading } = useGameResults(90); // 3 months
  const [selectedGame, setSelectedGame] = useState("All Games");
  const [showFilters, setShowFilters] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Current month navigation
  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = currentMonth.toLocaleDateString("hi-IN", { month: "long", year: "numeric" });

  const results = useMemo(() => rawResults.map((row: any) => ({
    game_name: row.games?.name || "Unknown",
    game_name_hindi: row.games?.name_hindi || null,
    result_time: row.games?.result_time || "",
    aakhar_result: row.aakhar_result,
    result_date: row.result_date,
  })), [rawResults]);

  // Filter by selected game and current month
  const filtered = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return results.filter((r) => {
      if (selectedGame !== "All Games" && r.game_name !== selectedGame) return false;
      const d = new Date(r.result_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [results, selectedGame, currentMonth]);

  // Group by date
  const dates = useMemo(() => [...new Set(filtered.map(r => r.result_date))].sort((a, b) => b.localeCompare(a)), [filtered]);

  // Unique game names for the month (for chart table columns)
  const monthGames = useMemo(() => {
    const names = [...new Set(filtered.map(r => r.game_name))];
    return names.sort();
  }, [filtered]);

  // All dates in the month for chart table
  const allDatesInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const arr: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date > today) break;
      arr.push(date.toISOString().split("T")[0]);
    }
    return arr.reverse();
  }, [currentMonth]);

  const handleDownloadCSV = () => {
    const csv = ["Game,Time,Number,Date", ...filtered.map(r => `${r.game_name},${r.result_time},${r.aakhar_result ?? "-"},${r.result_date}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `results_${monthLabel.replace(/\s/g, "_")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(chartRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const link = document.createElement("a");
      link.download = `chart_${monthLabel.replace(/\s/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback: create a simple canvas
      const el = chartRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = el.scrollWidth * 2;
      canvas.height = el.scrollHeight * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.font = "24px monospace";
      ctx.fillText("Chart data - use CSV for full export", 20, 40);
      const link = document.createElement("a");
      link.download = `chart_${monthLabel.replace(/\s/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, [monthLabel]);

  if (isLoading) return <div className="px-4 py-3"><Skeleton className="h-40 rounded-2xl" /></div>;

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg text-foreground">📊 Monthly Chart</h2>
        <div className="flex gap-1.5">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-2 rounded-xl text-[11px] font-medium hover:bg-secondary/80 transition-colors">
            <Filter className="w-3 h-3" /> फ़िल्टर
          </button>
          <button onClick={handleDownloadCSV} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-2 rounded-xl text-[11px] font-medium hover:bg-secondary/80 transition-colors">
            <Download className="w-3 h-3" /> CSV
          </button>
          <button onClick={handleDownloadPNG} className="flex items-center gap-1 gradient-primary text-primary-foreground px-2.5 py-2 rounded-xl text-[11px] font-medium hover:opacity-90 transition-opacity">
            <Image className="w-3 h-3" /> PNG
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-card rounded-xl p-2.5 mb-3 border border-border/50 shadow-sm">
        <button onClick={() => setMonthOffset(o => o + 1)} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-foreground text-sm">{monthLabel}</span>
        </div>
        <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors disabled:opacity-30">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Filters */}
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

      {/* Chart Table (monthly grid) */}
      {monthGames.length > 0 && (
        <div ref={chartRef} className="mb-4">
          <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="gradient-primary text-primary-foreground">
                    <th className="px-2 py-2 text-left font-semibold sticky left-0 bg-primary/90 z-10 min-w-[60px]">तारीख</th>
                    {monthGames.map(gName => (
                      <th key={gName} className="px-2 py-2 text-center font-semibold min-w-[50px]">
                        {games.find(g => g.name === gName)?.name_hindi || gName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allDatesInMonth.map((date, di) => (
                    <tr key={date} className={`border-b border-border/20 ${di % 2 === 0 ? "" : "bg-secondary/30"}`}>
                      <td className="px-2 py-1.5 font-semibold text-muted-foreground sticky left-0 bg-card z-10">
                        {new Date(date).getDate()}/{new Date(date).getMonth() + 1}
                      </td>
                      {monthGames.map(gName => {
                        const result = filtered.find(r => r.result_date === date && r.game_name === gName);
                        return (
                          <td key={gName} className="px-2 py-1.5 text-center">
                            {result?.aakhar_result != null ? (
                              <span className="bg-primary/15 text-primary font-mono font-bold px-1.5 py-0.5 rounded-md text-xs">
                                {String(result.aakhar_result).padStart(2, "0")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Daily detail list */}
      {dates.map(date => (
        <div key={date} className="mb-3">
          <p className="text-muted-foreground text-xs font-semibold mb-1.5 px-1">
            {new Date(date).toLocaleDateString("hi-IN", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="gradient-primary text-primary-foreground">
                  <th className="px-3 py-2 text-left font-semibold text-xs">गेम</th>
                  <th className="px-3 py-2 text-left font-semibold text-xs">समय</th>
                  <th className="px-3 py-2 text-center font-semibold text-xs">नंबर</th>
                </tr>
              </thead>
              <tbody>
                {filtered.filter(r => r.result_date === date).map((row, i) => (
                  <tr key={`${row.game_name}-${date}-${i}`} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2"><p className="font-semibold text-foreground text-xs">{row.game_name_hindi || row.game_name}</p></td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{row.result_time}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-primary/15 text-primary font-mono font-bold px-2.5 py-1 rounded-lg text-sm">
                        {row.aakhar_result != null ? String(row.aakhar_result).padStart(2, "0") : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
          <p className="text-muted-foreground text-sm">इस महीने कोई नतीजे नहीं मिले</p>
        </div>
      )}
    </div>
  );
};

export default ResultsChart;
