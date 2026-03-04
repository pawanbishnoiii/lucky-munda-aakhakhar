import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Wallet, Users, Settings, BarChart3, MessageSquare, Bell, Plus, Check, X, Eye, Download, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("games");
  const [games, setGames] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [showAddGame, setShowAddGame] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", name_hindi: "", game_type: "aakhar", result_time: "12:00", closure_minutes: 30, payout_percentage: 93, commission_percentage: 7 });
  const [editingGame, setEditingGame] = useState<any>(null);

  // Results calendar
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [declareGameId, setDeclareGameId] = useState("");
  const [declareAakhar, setDeclareAakhar] = useState("");

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/profile");
  }, [loading, user, isAdmin]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [g, t, tk, s, p, r, b] = await Promise.all([
      supabase.from("games").select("*").order("result_time"),
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_settings").select("*"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("game_results").select("*, games(name, name_hindi)").order("result_date", { ascending: false }).limit(100),
      supabase.from("bets").select("*, games(name, name_hindi)").order("created_at", { ascending: false }).limit(100),
    ]);
    setGames(g.data || []);
    setTransactions(t.data || []);
    setTickets(tk.data || []);
    setProfiles(p.data || []);
    setResults(r.data || []);
    setBets(b.data || []);
    const settingsMap: Record<string, string> = {};
    (s.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
    setSettings(settingsMap);
  };

  const updateSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("admin_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("admin_settings").update({ value }).eq("key", key);
    } else {
      await supabase.from("admin_settings").insert({ key, value });
    }
    setSettings({ ...settings, [key]: value });
    toast({ title: "Setting Updated ✅" });
  };

  const addGame = async () => {
    const { error } = await supabase.from("games").insert(newGame);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Game Added ✅" }); setShowAddGame(false); setNewGame({ name: "", name_hindi: "", game_type: "aakhar", result_time: "12:00", closure_minutes: 30, payout_percentage: 93, commission_percentage: 7 }); fetchAll(); }
  };

  const updateGame = async () => {
    if (!editingGame) return;
    const { error } = await supabase.from("games").update({
      name: editingGame.name, name_hindi: editingGame.name_hindi, game_type: editingGame.game_type,
      result_time: editingGame.result_time, closure_minutes: editingGame.closure_minutes,
      payout_percentage: editingGame.payout_percentage, commission_percentage: editingGame.commission_percentage,
    }).eq("id", editingGame.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Game Updated ✅" }); setEditingGame(null); fetchAll(); }
  };

  const toggleGame = async (id: string, isActive: boolean) => {
    await supabase.from("games").update({ is_active: !isActive }).eq("id", id);
    fetchAll();
  };

  const handleTransaction = async (id: string, action: "approved" | "rejected") => {
    await supabase.from("wallet_transactions").update({ status: action, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    const tx = transactions.find((t) => t.id === id);
    if (action === "approved" && tx?.type === "deposit") {
      const { data: w } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).maybeSingle();
      if (w) await supabase.from("wallets").update({ balance: Number(w.balance) + Number(tx.amount) }).eq("user_id", tx.user_id);
    }
    if (action === "approved" && tx?.type === "withdraw") {
      // Already deducted on request, just mark completed
    }
    if (action === "rejected" && tx?.type === "withdraw") {
      const { data: w } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).maybeSingle();
      if (w) await supabase.from("wallets").update({ balance: Number(w.balance) + Number(tx.amount) }).eq("user_id", tx.user_id);
    }
    toast({ title: `Transaction ${action} ✅` });
    fetchAll();
  };

  const declareResult = async () => {
    if (!declareGameId || !declareAakhar) { toast({ title: "Game और Number दोनों ज़रूरी हैं", variant: "destructive" }); return; }
    const aakharNum = parseInt(declareAakhar);
    if (aakharNum < 1 || aakharNum > 100) { toast({ title: "Number 01-100 के बीच होना चाहिए", variant: "destructive" }); return; }
    
    const { error } = await supabase.from("game_results").insert({
      game_id: declareGameId,
      aakhar_result: aakharNum,
      result_date: selectedCalDate,
      declared_at: new Date().toISOString(),
      declared_by: user!.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Auto-payout: find winning bets for this game on this date
    const { data: winBets } = await supabase.from("bets")
      .select("*")
      .eq("game_id", declareGameId)
      .eq("bet_date", selectedCalDate)
      .eq("status", "pending");

    if (winBets && winBets.length > 0) {
      const selectedGame = games.find(g => g.id === declareGameId);
      const payoutMultiplier = selectedGame ? selectedGame.payout_percentage / 100 : 0.93;
      const commissionRate = selectedGame ? selectedGame.commission_percentage / 100 : 0.07;

      for (const bet of winBets) {
        if (bet.number === aakharNum) {
          // Winner!
          const grossWin = bet.amount * payoutMultiplier * 100; // e.g. 93x
          const platformFee = grossWin * commissionRate;
          const netWin = grossWin - platformFee;
          
          await supabase.from("bets").update({ status: "won", payout: netWin }).eq("id", bet.id);
          // Add to wallet
          const { data: w } = await supabase.from("wallets").select("*").eq("user_id", bet.user_id).maybeSingle();
          if (w) {
            await supabase.from("wallets").update({ balance: Number(w.balance) + netWin }).eq("user_id", bet.user_id);
          }
          // Create win transaction
          await supabase.from("wallet_transactions").insert({
            user_id: bet.user_id, type: "win", amount: netWin, status: "completed",
            payment_method: "auto-payout", admin_note: `Won on ${selectedGame?.name} - #${String(aakharNum).padStart(2, "0")}`,
          });
        } else {
          // Loser
          await supabase.from("bets").update({ status: "lost", payout: 0 }).eq("id", bet.id);
        }
      }
    }

    toast({ title: "✅ Result Declared & Auto-Payout Done!" });
    setDeclareAakhar(""); setDeclareGameId("");
    fetchAll();
  };

  const replyTicket = async (id: string, reply: string) => {
    await supabase.from("support_tickets").update({ admin_reply: reply, replied_by: user!.id, status: "resolved" }).eq("id", id);
    toast({ title: "Reply Sent ✅" }); fetchAll();
  };

  const sendNotification = async () => {
    if (!notifTitle || !notifMessage) return;
    await supabase.from("notifications").insert({ title: notifTitle, message: notifMessage, is_global: true });
    toast({ title: "Notification Sent ✅" }); setNotifTitle(""); setNotifMessage("");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Calendar helpers
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getResultsForDate = (date: string) => results.filter(r => r.result_date === date);

  const tabs = [
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "results", label: "Results", icon: BarChart3 },
    { id: "bets", label: "Bets", icon: BarChart3 },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "users", label: "Users", icon: Users },
    { id: "tickets", label: "Tickets", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "notifications", label: "Notify", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
        <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary"><span className="text-primary-foreground font-display font-bold text-xs">BK</span></div>
        <h1 className="font-display font-bold text-lg text-foreground">Admin Panel</h1>
      </header>

      <div className="px-4 pt-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 min-w-max">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition-all ${tab === t.id ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* GAMES TAB */}
        {tab === "games" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-foreground">Games Manage ({games.length})</h3>
              <button onClick={() => setShowAddGame(!showAddGame)} className="gradient-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>

            {showAddGame && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 space-y-2 border border-border/50">
                <input placeholder="Game Name (English)" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <input placeholder="Hindi Name" value={newGame.name_hindi} onChange={(e) => setNewGame({ ...newGame, name_hindi: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground text-[10px]">Result Time</label>
                    <input type="time" value={newGame.result_time} onChange={(e) => setNewGame({ ...newGame, result_time: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[10px]">Close Before (min)</label>
                    <input type="number" value={newGame.closure_minutes} onChange={(e) => setNewGame({ ...newGame, closure_minutes: parseInt(e.target.value) })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground text-[10px]">Payout %</label>
                    <input type="number" value={newGame.payout_percentage} onChange={(e) => setNewGame({ ...newGame, payout_percentage: parseFloat(e.target.value) })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[10px]">Commission %</label>
                    <input type="number" value={newGame.commission_percentage} onChange={(e) => setNewGame({ ...newGame, commission_percentage: parseFloat(e.target.value) })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  </div>
                </div>
                <button onClick={addGame} className="w-full gradient-primary text-primary-foreground py-2 rounded-xl font-semibold text-sm">Add Game</button>
              </motion.div>
            )}

            {/* Edit Game Modal */}
            {editingGame && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 space-y-2 border border-primary/30">
                <h4 className="font-display font-bold text-foreground text-sm">Editing: {editingGame.name}</h4>
                <input value={editingGame.name} onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                <input value={editingGame.name_hindi || ""} onChange={(e) => setEditingGame({ ...editingGame, name_hindi: e.target.value })} placeholder="Hindi Name" className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" value={editingGame.result_time} onChange={(e) => setEditingGame({ ...editingGame, result_time: e.target.value })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  <input type="number" value={editingGame.closure_minutes} onChange={(e) => setEditingGame({ ...editingGame, closure_minutes: parseInt(e.target.value) })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" placeholder="Close min" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={editingGame.payout_percentage} onChange={(e) => setEditingGame({ ...editingGame, payout_percentage: parseFloat(e.target.value) })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  <input type="number" value={editingGame.commission_percentage} onChange={(e) => setEditingGame({ ...editingGame, commission_percentage: parseFloat(e.target.value) })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={updateGame} className="flex-1 gradient-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold">Save</button>
                  <button onClick={() => setEditingGame(null)} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-xl text-sm font-semibold">Cancel</button>
                </div>
              </motion.div>
            )}

            {games.map((g) => (
              <div key={g.id} className="bg-card rounded-xl p-3 border border-border/50 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-foreground font-medium text-sm">{g.name_hindi || g.name} <span className="text-muted-foreground text-xs">({g.name})</span></p>
                  <p className="text-muted-foreground text-xs">⏰ {g.result_time} · Close {g.closure_minutes}min · Pay {g.payout_percentage}% · Com {g.commission_percentage}%</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditingGame({ ...g })} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Edit2 className="w-3 h-3 text-primary" /></button>
                  <button onClick={() => toggleGame(g.id, g.is_active)} className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${g.is_active ? "bg-game-green/20 text-game-green" : "bg-destructive/20 text-destructive"}`}>{g.is_active ? "ON" : "OFF"}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESULTS TAB with Calendar */}
        {tab === "results" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Declare Result</h3>
            
            {/* Mini Calendar */}
            <div className="bg-card rounded-xl p-3 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1))} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
                <span className="font-display font-bold text-foreground text-sm">{monthNames[calMonth]} {calYear}</span>
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1))} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                  <div key={d} className="text-center text-muted-foreground text-[10px] font-medium">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {calDays.map(day => {
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasResults = results.some(r => r.result_date === dateStr);
                  const isSelected = dateStr === selectedCalDate;
                  return (
                    <button key={day} onClick={() => setSelectedCalDate(dateStr)}
                      className={`w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${isSelected ? "gradient-primary text-primary-foreground" : hasResults ? "bg-game-green/15 text-game-green" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results for selected date */}
            <div className="bg-card rounded-xl p-3 border border-border/50">
              <h4 className="font-display font-bold text-foreground text-sm mb-2">📅 {selectedCalDate} के नतीजे</h4>
              {getResultsForDate(selectedCalDate).length > 0 ? (
                <div className="space-y-1.5">
                  {getResultsForDate(selectedCalDate).map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-secondary rounded-lg px-3 py-2">
                      <span className="text-foreground text-sm font-medium">{(r as any).games?.name_hindi || (r as any).games?.name}</span>
                      <span className="bg-primary/15 text-primary font-mono font-bold px-3 py-1 rounded-lg text-sm">{r.aakhar_result != null ? String(r.aakhar_result).padStart(2, "0") : "-"}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-xs text-center py-3">इस तारीख का कोई नतीजा नहीं</p>}
            </div>

            {/* Declare Form */}
            <div className="bg-card rounded-xl p-4 space-y-2 border border-primary/20">
              <h4 className="font-display font-bold text-foreground text-sm">🎯 नतीजा घोषित करें ({selectedCalDate})</h4>
              <select value={declareGameId} onChange={(e) => setDeclareGameId(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none">
                <option value="">Game चुनें</option>
                {games.map((g) => <option key={g.id} value={g.id}>{g.name_hindi || g.name} ({g.result_time})</option>)}
              </select>
              <input type="number" min={1} max={100} placeholder="Number (01-100)" value={declareAakhar} onChange={(e) => setDeclareAakhar(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
              <button onClick={declareResult} className="w-full gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm">Declare Result & Auto-Payout</button>
            </div>
          </div>
        )}

        {/* BETS TAB */}
        {tab === "bets" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">All Bets ({bets.length})</h3>
            {bets.slice(0, 50).map((b) => (
              <div key={b.id} className="bg-card rounded-xl p-3 border border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-foreground text-sm font-medium">{(b as any).games?.name_hindi || (b as any).games?.name}</p>
                  <p className="text-muted-foreground text-xs">#{String(b.number).padStart(2, "0")} · ₹{parseFloat(b.amount).toFixed(0)} · {b.bet_date}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.status === "won" ? "bg-game-green/10 text-game-green" : b.status === "lost" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* WALLET TAB */}
        {tab === "wallet" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Pending Requests</h3>
            {transactions.filter(t => t.status === "pending").map((tx) => (
              <div key={tx.id} className="bg-card rounded-xl p-3 space-y-2 border border-border/50">
                <div className="flex justify-between">
                  <div>
                    <p className="text-foreground font-medium text-sm capitalize">{tx.type} — ₹{parseFloat(tx.amount)}</p>
                    <p className="text-muted-foreground text-xs">{tx.payment_method} · UTR: {tx.utr_number || "-"}</p>
                    {tx.upi_id && <p className="text-muted-foreground text-xs">UPI: {tx.upi_id}</p>}
                    {tx.bank_holder_name && <p className="text-muted-foreground text-xs">Bank: {tx.bank_holder_name} | {tx.bank_account_number} | {tx.bank_ifsc_code}</p>}
                  </div>
                </div>
                {tx.screenshot_url && (
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      const { data } = await supabase.storage.from("payment-screenshots").createSignedUrl(tx.screenshot_url, 600);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }} className="text-primary text-xs font-semibold flex items-center gap-1"><Eye className="w-3 h-3" /> View</button>
                    <button onClick={async () => {
                      const { data } = await supabase.storage.from("payment-screenshots").download(tx.screenshot_url);
                      if (data) {
                        const url = URL.createObjectURL(data);
                        const a = document.createElement("a"); a.href = url; a.download = tx.screenshot_url.split("/").pop() || "screenshot"; a.click();
                      }
                    }} className="text-game-blue text-xs font-semibold flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleTransaction(tx.id, "approved")} className="flex-1 bg-game-green/20 text-game-green py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                  <button onClick={() => handleTransaction(tx.id, "rejected")} className="flex-1 bg-destructive/20 text-destructive py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><X className="w-3 h-3" /> Reject</button>
                </div>
              </div>
            ))}
            {transactions.filter(t => t.status === "pending").length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No pending requests</p>}

            <h4 className="font-display font-bold text-foreground text-sm pt-2">All Transactions</h4>
            {transactions.slice(0, 30).map((tx) => (
              <div key={tx.id} className="bg-card rounded-xl p-3 flex justify-between items-center border border-border/50">
                <div>
                  <p className="text-foreground text-sm capitalize">{tx.type} — ₹{parseFloat(tx.amount)}</p>
                  <p className="text-muted-foreground text-xs">{new Date(tx.created_at).toLocaleString("hi-IN")}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tx.status === "approved" || tx.status === "completed" ? "bg-game-green/10 text-game-green" : tx.status === "pending" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>{tx.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Users ({profiles.length})</h3>
            {profiles.map((p) => (
              <div key={p.id} className="bg-card rounded-xl p-3 border border-border/50">
                <p className="text-foreground font-medium text-sm">{p.full_name || "No Name"}</p>
                <p className="text-muted-foreground text-xs">📞 {p.phone || "-"} · Joined: {new Date(p.created_at).toLocaleDateString("hi-IN")}</p>
              </div>
            ))}
          </div>
        )}

        {/* TICKETS TAB */}
        {tab === "tickets" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Support Tickets ({tickets.length})</h3>
            {tickets.map((t) => (
              <div key={t.id} className="bg-card rounded-xl p-3 space-y-2 border border-border/50">
                <div className="flex justify-between items-start">
                  <div><p className="text-foreground font-medium text-sm">{t.subject}</p><p className="text-muted-foreground text-xs">{t.message}</p></div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.status === "open" ? "bg-accent/10 text-accent" : "bg-game-green/10 text-game-green"}`}>{t.status}</span>
                </div>
                {t.status === "open" && (
                  <div className="flex gap-2">
                    <input id={`reply-${t.id}`} placeholder="Reply..." className="flex-1 bg-secondary text-foreground px-3 py-2 rounded-xl text-xs outline-none placeholder:text-muted-foreground" />
                    <button onClick={() => { const el = document.getElementById(`reply-${t.id}`) as HTMLInputElement; replyTicket(t.id, el.value); }} className="gradient-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold">Send</button>
                  </div>
                )}
                {t.admin_reply && <p className="text-game-green text-xs">✅ {t.admin_reply}</p>}
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">App Settings</h3>
            {[
              { key: "live_ticker", label: "Live Ticker Text" },
              { key: "deposit_upi", label: "Deposit UPI ID" },
              { key: "telegram_link", label: "Telegram Link" },
              { key: "min_deposit", label: "Min Deposit (₹)" },
              { key: "min_withdraw", label: "Min Withdraw (₹)" },
              { key: "max_withdraw", label: "Max Withdraw (₹)" },
            ].map((s) => (
              <div key={s.key} className="bg-card rounded-xl p-3 space-y-1 border border-border/50">
                <label className="text-muted-foreground text-xs">{s.label}</label>
                <div className="flex gap-2">
                  <input value={settings[s.key] || ""} onChange={(e) => setSettings({ ...settings, [s.key]: e.target.value })} className="flex-1 bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  <button onClick={() => updateSetting(s.key, settings[s.key] || "")} className="gradient-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold">Save</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === "notifications" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Send Notification</h3>
            <div className="bg-card rounded-xl p-4 space-y-2 border border-border/50">
              <input placeholder="Title" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
              <textarea placeholder="Message" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={3} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground resize-none" />
              <button onClick={sendNotification} className="w-full gradient-primary text-primary-foreground py-2 rounded-xl font-semibold text-sm">Send to All Users</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
