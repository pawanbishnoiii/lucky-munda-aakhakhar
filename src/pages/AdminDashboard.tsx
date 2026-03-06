import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Wallet, Users, Settings, BarChart3, MessageSquare, Bell, Plus, Check, X, Eye, Download, ChevronLeft, ChevronRight, Edit2, Trash2, EyeOff, Search, RefreshCw, DollarSign, Hash, Clock, UserCheck, AlertTriangle, Upload, Database, Activity } from "lucide-react";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [games, setGames] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [showAddGame, setShowAddGame] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", name_hindi: "", game_type: "aakhar", result_time: "12:00", closure_minutes: 30, payout_percentage: 93, commission_percentage: 7 });
  const [editingGame, setEditingGame] = useState<any>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [declareGameId, setDeclareGameId] = useState("");
  const [declareAakhar, setDeclareAakhar] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [betSearch, setBetSearch] = useState("");
  const [betFilter, setBetFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [userTxns, setUserTxns] = useState<any[]>([]);
  const [txFilter, setTxFilter] = useState("pending");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [editBetAmount, setEditBetAmount] = useState("");
  const [editBetStatus, setEditBetStatus] = useState("");
  const [allNotifications, setAllNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/profile");
  }, [loading, user, isAdmin]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setRefreshing(true);
    const [g, t, tk, s, p, r, b, w, n] = await Promise.all([
      supabase.from("games").select("*").order("result_time"),
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_settings").select("*"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("game_results").select("*, games(name, name_hindi)").order("result_date", { ascending: false }).limit(200),
      supabase.from("bets").select("*, games(name, name_hindi, payout_percentage, commission_percentage)").order("created_at", { ascending: false }).limit(500),
      supabase.from("wallets").select("*"),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setGames(g.data || []);
    setTransactions(t.data || []);
    setTickets(tk.data || []);
    setProfiles(p.data || []);
    setResults(r.data || []);
    setBets(b.data || []);
    setWallets(w.data || []);
    setAllNotifications(n.data || []);
    const settingsMap: Record<string, string> = {};
    (s.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
    setSettings(settingsMap);
    setRefreshing(false);
  };

  const updateSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("admin_settings").select("id").eq("key", key).maybeSingle();
    if (existing) await supabase.from("admin_settings").update({ value }).eq("key", key);
    else await supabase.from("admin_settings").insert({ key, value });
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
      is_active: editingGame.is_active,
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
      game_id: declareGameId, aakhar_result: aakharNum, result_date: selectedCalDate,
      declared_at: new Date().toISOString(), declared_by: user!.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Auto-payout
    const { data: pendingBets } = await supabase.from("bets").select("*").eq("game_id", declareGameId).eq("bet_date", selectedCalDate).eq("status", "pending");
    if (pendingBets && pendingBets.length > 0) {
      const selectedGame = games.find(g => g.id === declareGameId);
      const payoutMultiplier = selectedGame ? selectedGame.payout_percentage : 93;
      for (const bet of pendingBets) {
        if (bet.number === aakharNum) {
          const netWin = bet.amount * payoutMultiplier / 100;
          await supabase.from("bets").update({ status: "won", payout: netWin }).eq("id", bet.id);
          const { data: w } = await supabase.from("wallets").select("*").eq("user_id", bet.user_id).maybeSingle();
          if (w) await supabase.from("wallets").update({ balance: Number(w.balance) + netWin }).eq("user_id", bet.user_id);
          await supabase.from("wallet_transactions").insert({
            user_id: bet.user_id, type: "win", amount: netWin, status: "completed",
            payment_method: "auto-payout", admin_note: `Won on ${selectedGame?.name} - #${String(aakharNum).padStart(2, "0")}`,
          });
        } else {
          await supabase.from("bets").update({ status: "lost", payout: 0 }).eq("id", bet.id);
        }
      }
    }
    toast({ title: "✅ Result Declared & Auto-Payout Done!" });
    setDeclareAakhar(""); setDeclareGameId("");
    fetchAll();
  };

  const editResult = async (result: any) => {
    const newNum = prompt("New number (01-100):", result.aakhar_result);
    if (!newNum) return;
    const num = parseInt(newNum);
    if (num < 1 || num > 100) { toast({ title: "Invalid number", variant: "destructive" }); return; }
    await supabase.from("game_results").update({ aakhar_result: num }).eq("id", result.id);
    toast({ title: "Result Updated ✅" });
    fetchAll();
  };

  const deleteResult = async (id: string) => {
    if (!confirm("Delete this result?")) return;
    await supabase.from("game_results").delete().eq("id", id);
    toast({ title: "Result Deleted" });
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
    fetchAll();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    toast({ title: "Deleted" }); fetchAll();
  };

  const loadUserDetails = async (profile: any) => {
    setSelectedUser(profile);
    const [b, t] = await Promise.all([
      supabase.from("bets").select("*, games(name, name_hindi)").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("wallet_transactions").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(100),
    ]);
    setUserBets(b.data || []);
    setUserTxns(t.data || []);
  };

  const saveBetEdit = async () => {
    if (!selectedBet) return;
    const updates: any = {};
    if (editBetAmount) updates.amount = parseFloat(editBetAmount);
    if (editBetStatus) updates.status = editBetStatus;
    await supabase.from("bets").update(updates).eq("id", selectedBet.id);
    toast({ title: "Bet Updated ✅" });
    setSelectedBet(null);
    fetchAll();
  };

  // Export data
  const exportData = () => {
    const data = { games, profiles, bets: bets.map(b => ({ ...b, games: undefined })), results: results.map(r => ({ ...r, games: undefined })), transactions, wallets, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ Data Exported!" });
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        toast({ title: "📦 Import started..." });
        // Import settings
        if (data.settings) {
          for (const [key, value] of Object.entries(data.settings)) {
            await updateSetting(key, value as string);
          }
        }
        toast({ title: "✅ Settings imported!" });
        fetchAll();
      } catch {
        toast({ title: "Invalid file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const getResultsForDate = (date: string) => results.filter(r => r.result_date === date);

  const totalBets = bets.length;
  const totalWins = bets.filter(b => b.status === "won").length;
  const totalRevenue = bets.reduce((s, b) => s + Number(b.amount), 0);
  const pendingTxns = transactions.filter(t => t.status === "pending").length;
  const getUserWallet = (userId: string) => wallets.find(w => w.user_id === userId);
  const getUserProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const filteredBets = bets.filter(b => {
    if (betFilter !== "all" && b.status !== betFilter) return false;
    if (betSearch) {
      const gameName = ((b as any).games?.name_hindi || (b as any).games?.name || "").toLowerCase();
      const profile = getUserProfile(b.user_id);
      const userName = (profile?.full_name || "").toLowerCase();
      if (!gameName.includes(betSearch.toLowerCase()) && !userName.includes(betSearch.toLowerCase()) && !b.user_id.includes(betSearch)) return false;
    }
    return true;
  });

  const filteredTxns = transactions.filter(t => {
    if (txFilter === "pending") return t.status === "pending";
    if (txFilter === "completed") return t.status !== "pending";
    return true;
  });

  const filteredUsers = profiles.filter(p => {
    if (!userSearch) return true;
    return (p.full_name || "").toLowerCase().includes(userSearch.toLowerCase()) || (p.phone || "").includes(userSearch);
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "results", label: "Results", icon: Hash },
    { id: "bets", label: "Bets", icon: DollarSign },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "users", label: "Users", icon: Users },
    { id: "tickets", label: "Tickets", icon: MessageSquare },
    { id: "notifications", label: "Notify", icon: Bell },
    { id: "data", label: "Data", icon: Database },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary"><Activity className="w-4 h-4 text-primary-foreground" /></div>
            <h1 className="font-display font-bold text-lg text-foreground">Admin Panel</h1>
          </div>
        </div>
        <button onClick={fetchAll} disabled={refreshing} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="px-4 pt-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 min-w-max">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${tab === t.id ? "gradient-primary text-primary-foreground shadow-glow-primary" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Bets", value: totalBets, icon: DollarSign, color: "text-primary" },
                { label: "Total Wins", value: totalWins, icon: Check, color: "text-game-green" },
                { label: "Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: BarChart3, color: "text-game-blue" },
                { label: "Pending Txns", value: pendingTxns, icon: Clock, color: "text-accent" },
                { label: "Users", value: profiles.length, icon: Users, color: "text-game-purple" },
                { label: "Games", value: games.filter(g => g.is_active).length, icon: Gamepad2, color: "text-game-orange" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-1"><s.icon className={`w-4 h-4 ${s.color}`} /><span className="text-muted-foreground text-xs">{s.label}</span></div>
                  <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            {pendingTxns > 0 && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                <p className="text-accent text-sm font-medium">{pendingTxns} pending transaction(s)!</p>
                <button onClick={() => setTab("wallet")} className="ml-auto text-primary text-xs font-bold">View →</button>
              </div>
            )}
            {/* Recent Activity */}
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <h4 className="font-display font-bold text-foreground text-sm mb-3">📊 Recent Activity</h4>
              <div className="space-y-2">
                {bets.slice(0, 5).map(b => {
                  const p = getUserProfile(b.user_id);
                  return (
                    <div key={b.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 text-xs">
                      <span className="text-foreground">{p?.full_name || "User"} → {(b as any).games?.name_hindi || "Game"} #{String(b.number).padStart(2, "0")}</span>
                      <span className="font-bold text-foreground">₹{Number(b.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* GAMES TAB */}
        {tab === "games" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-foreground">Games ({games.length})</h3>
              <button onClick={() => setShowAddGame(!showAddGame)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-glow-primary"><Plus className="w-3.5 h-3.5" /> Add Game</button>
            </div>

            {showAddGame && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 space-y-3 border border-primary/20 shadow-sm">
                <h4 className="font-display font-bold text-foreground text-sm">➕ New Game</h4>
                <input placeholder="Game Name (English)" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <input placeholder="Hindi Name" value={newGame.name_hindi} onChange={(e) => setNewGame({ ...newGame, name_hindi: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Result Time</label><input type="time" value={newGame.result_time} onChange={(e) => setNewGame({ ...newGame, result_time: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Close Before (min)</label><input type="number" value={newGame.closure_minutes} onChange={(e) => setNewGame({ ...newGame, closure_minutes: parseInt(e.target.value) || 30 })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Payout Multiplier</label><input type="number" step="any" value={newGame.payout_percentage} onChange={(e) => setNewGame({ ...newGame, payout_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Commission %</label><input type="number" step="any" value={newGame.commission_percentage} onChange={(e) => setNewGame({ ...newGame, commission_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                </div>
                <p className="text-muted-foreground text-[10px]">💡 Payout: e.g. 9500 = ₹100 bet wins ₹9,500</p>
                <div className="flex gap-2">
                  <button onClick={addGame} className="flex-1 gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm">Add Game</button>
                  <button onClick={() => setShowAddGame(false)} className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm">Cancel</button>
                </div>
              </motion.div>
            )}

            {editingGame && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 space-y-3 border border-primary/30 shadow-sm">
                <h4 className="font-display font-bold text-foreground text-sm">✏️ Editing: {editingGame.name}</h4>
                <input value={editingGame.name} onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" placeholder="English Name" />
                <input value={editingGame.name_hindi || ""} onChange={(e) => setEditingGame({ ...editingGame, name_hindi: e.target.value })} placeholder="Hindi Name" className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Result Time</label><input type="time" value={editingGame.result_time} onChange={(e) => setEditingGame({ ...editingGame, result_time: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Close Before (min)</label><input type="number" value={editingGame.closure_minutes} onChange={(e) => setEditingGame({ ...editingGame, closure_minutes: parseInt(e.target.value) || 30 })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Payout Multiplier</label><input type="number" step="any" value={editingGame.payout_percentage} onChange={(e) => setEditingGame({ ...editingGame, payout_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                  <div><label className="text-muted-foreground text-[10px] mb-1 block">Commission %</label><input type="number" step="any" value={editingGame.commission_percentage} onChange={(e) => setEditingGame({ ...editingGame, commission_percentage: parseFloat(e.target.value) || 0 })} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none" /></div>
                </div>
                <p className="text-muted-foreground text-[10px]">💡 Payout can be any value (e.g. 10000 = 10000x)</p>
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-xs">Active:</label>
                  <button onClick={() => setEditingGame({ ...editingGame, is_active: !editingGame.is_active })} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editingGame.is_active ? "bg-game-green/20 text-game-green" : "bg-destructive/20 text-destructive"}`}>{editingGame.is_active ? "ON" : "OFF"}</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={updateGame} className="flex-1 gradient-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold">Save</button>
                  <button onClick={() => setEditingGame(null)} className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm">Cancel</button>
                </div>
              </motion.div>
            )}

            {games.map((g) => (
              <div key={g.id} className={`bg-card rounded-xl p-4 border transition-all shadow-sm ${g.is_active ? "border-border/50" : "border-destructive/30 opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-foreground font-bold text-base">{g.name_hindi || g.name}</p>
                    <p className="text-muted-foreground text-xs">{g.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditingGame({ ...g })} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"><Edit2 className="w-3.5 h-3.5 text-primary" /></button>
                    <button onClick={() => toggleGame(g.id, g.is_active)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      {g.is_active ? <Eye className="w-3.5 h-3.5 text-game-green" /> : <EyeOff className="w-3.5 h-3.5 text-destructive" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-secondary rounded-lg p-2.5 text-center"><p className="text-[9px] text-muted-foreground mb-0.5">Time</p><p className="text-foreground font-bold text-xs">{g.result_time}</p></div>
                  <div className="bg-secondary rounded-lg p-2.5 text-center"><p className="text-[9px] text-muted-foreground mb-0.5">Close</p><p className="text-foreground font-bold text-xs">{g.closure_minutes}m</p></div>
                  <div className="bg-secondary rounded-lg p-2.5 text-center"><p className="text-[9px] text-muted-foreground mb-0.5">Payout</p><p className="text-game-green font-bold text-xs">{g.payout_percentage}x</p></div>
                  <div className="bg-secondary rounded-lg p-2.5 text-center"><p className="text-[9px] text-muted-foreground mb-0.5">Com.</p><p className="text-accent font-bold text-xs">{g.commission_percentage}%</p></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === "results" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Results & Calendar</h3>
            
            <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
                <span className="font-display font-bold text-foreground text-sm">{monthNames[calMonth]} {calYear}</span>
                <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="text-center text-muted-foreground text-[10px] font-semibold">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {calDays.map(day => {
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasResults = results.some(r => r.result_date === dateStr);
                  const isSelected = dateStr === selectedCalDate;
                  const isToday = dateStr === new Date().toISOString().split("T")[0];
                  return (
                    <button key={day} onClick={() => setSelectedCalDate(dateStr)}
                      className={`w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${isSelected ? "gradient-primary text-primary-foreground shadow-glow-primary" : hasResults ? "bg-game-green/15 text-game-green font-bold" : isToday ? "bg-primary/10 text-primary font-bold" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
              <h4 className="font-display font-bold text-foreground text-sm mb-2">📅 {selectedCalDate} के नतीजे</h4>
              {getResultsForDate(selectedCalDate).length > 0 ? (
                <div className="space-y-1.5">
                  {getResultsForDate(selectedCalDate).map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2.5">
                      <span className="text-foreground text-sm font-medium">{(r as any).games?.name_hindi || (r as any).games?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/15 text-primary font-mono font-bold px-3 py-1 rounded-lg text-sm">{r.aakhar_result != null ? String(r.aakhar_result).padStart(2, "0") : "-"}</span>
                        <button onClick={() => editResult(r)} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20"><Edit2 className="w-3 h-3 text-primary" /></button>
                        <button onClick={() => deleteResult(r.id)} className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20"><Trash2 className="w-3 h-3 text-destructive" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-xs text-center py-3">कोई नतीजा नहीं</p>}
            </div>

            <div className="bg-card rounded-xl p-4 space-y-3 border border-primary/20 shadow-sm">
              <h4 className="font-display font-bold text-foreground text-sm">🎯 नतीजा घोषित करें ({selectedCalDate})</h4>
              <select value={declareGameId} onChange={(e) => setDeclareGameId(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none">
                <option value="">Game चुनें</option>
                {games.map((g) => <option key={g.id} value={g.id}>{g.name_hindi || g.name} ({g.result_time})</option>)}
              </select>
              <input type="number" min={1} max={100} placeholder="Number (01-100)" value={declareAakhar} onChange={(e) => setDeclareAakhar(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
              <button onClick={declareResult} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-bold text-sm shadow-glow-primary">Declare Result & Auto-Payout</button>
            </div>
          </div>
        )}

        {/* BETS TAB */}
        {tab === "bets" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">All Bets ({bets.length})</h3>
            <div className="bg-card rounded-xl px-3 py-2 flex items-center gap-2 border border-border/50">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input placeholder="Search game/user name..." value={betSearch} onChange={(e) => setBetSearch(e.target.value)} className="bg-transparent text-foreground text-xs w-full outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {["all", "pending", "won", "lost"].map(f => (
                <button key={f} onClick={() => setBetFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${betFilter === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{f === "all" ? "All" : f}</button>
              ))}
            </div>
            {filteredBets.slice(0, 100).map((b) => {
              const profile = getUserProfile(b.user_id);
              return (
                <button key={b.id} onClick={() => { setSelectedBet(b); setEditBetAmount(String(b.amount)); setEditBetStatus(b.status); }} className="w-full bg-card rounded-xl p-3 border border-border/50 text-left hover:border-primary/30 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-foreground font-bold text-sm">{(b as any).games?.name_hindi || (b as any).games?.name}</p>
                      <p className="text-muted-foreground text-[10px]">{profile?.full_name || "User"} · {new Date(b.created_at).toLocaleString("hi-IN")}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${b.status === "won" ? "bg-game-green/10 text-game-green" : b.status === "lost" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{b.status.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[9px] text-muted-foreground">Number</p><p className="font-mono font-bold text-primary text-sm">#{String(b.number).padStart(2, "0")}</p></div>
                    <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[9px] text-muted-foreground">Amount</p><p className="font-bold text-foreground text-sm">₹{Number(b.amount)}</p></div>
                    <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[9px] text-muted-foreground">Payout</p><p className="font-bold text-game-green text-sm">₹{b.payout ? Number(b.payout).toFixed(0) : "0"}</p></div>
                    <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[9px] text-muted-foreground">Date</p><p className="text-foreground text-[10px] font-medium">{b.bet_date}</p></div>
                  </div>
                  <p className="text-muted-foreground text-[10px] mt-1">Bet ID: {b.id.slice(0, 8).toUpperCase()}</p>
                </button>
              );
            })}

            {/* Bet Detail Modal */}
            <AnimatePresence>
              {selectedBet && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedBet(null)}>
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card rounded-2xl p-5 border border-border/50 shadow-lg max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-foreground">Bet Details</h3>
                      <button onClick={() => setSelectedBet(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Bet ID:</span><span className="font-mono font-bold text-foreground">{selectedBet.id.slice(0, 12).toUpperCase()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">User:</span><span className="text-foreground">{getUserProfile(selectedBet.user_id)?.full_name || selectedBet.user_id.slice(0, 8)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Game:</span><span className="text-foreground">{(selectedBet as any).games?.name_hindi || (selectedBet as any).games?.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Number:</span><span className="font-mono font-bold text-primary">#{String(selectedBet.number).padStart(2, "0")}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="text-foreground">{new Date(selectedBet.created_at).toLocaleString("hi-IN")}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Payout:</span><span className="text-game-green font-bold">₹{selectedBet.payout ? Number(selectedBet.payout).toFixed(0) : "0"}</span></div>
                      <div className="border-t border-dashed border-border pt-2 mt-2">
                        <p className="text-muted-foreground text-[10px] mb-1">Edit Bet</p>
                        <div className="space-y-2">
                          <div><label className="text-muted-foreground text-[10px]">Amount</label><input type="number" step="any" value={editBetAmount} onChange={(e) => setEditBetAmount(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" /></div>
                          <div><label className="text-muted-foreground text-[10px]">Status</label>
                            <select value={editBetStatus} onChange={(e) => setEditBetStatus(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none">
                              <option value="pending">Pending</option>
                              <option value="won">Won</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>
                          <button onClick={saveBetEdit} className="w-full gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm">Save Changes</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* WALLET TAB */}
        {tab === "wallet" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {["pending", "completed", "all"].map(f => (
                <button key={f} onClick={() => setTxFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${txFilter === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{f}</button>
              ))}
            </div>
            {filteredTxns.map((tx) => {
              const profile = getUserProfile(tx.user_id);
              return (
                <div key={tx.id} className="bg-card rounded-xl p-3 space-y-2 border border-border/50 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${tx.type === "deposit" ? "bg-game-green/10 text-game-green" : tx.type === "win" ? "bg-game-blue/10 text-game-blue" : "bg-destructive/10 text-destructive"}`}>{tx.type}</span>
                        <span className="font-bold text-foreground">₹{Number(tx.amount)}</span>
                      </div>
                      <p className="text-muted-foreground text-[10px]">{profile?.full_name || tx.user_id.slice(0, 8)} · {tx.payment_method || "-"}</p>
                      <p className="text-muted-foreground text-[10px]">ID: {tx.id.slice(0, 10).toUpperCase()}</p>
                      {tx.utr_number && <p className="text-muted-foreground text-[10px]">UTR: {tx.utr_number}</p>}
                      {tx.upi_id && <p className="text-muted-foreground text-[10px]">UPI: {tx.upi_id}</p>}
                      {tx.bank_holder_name && <p className="text-muted-foreground text-[10px]">Bank: {tx.bank_holder_name} | {tx.bank_account_number} | IFSC: {tx.bank_ifsc_code}</p>}
                      <p className="text-muted-foreground text-[10px]">{new Date(tx.created_at).toLocaleString("hi-IN")}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tx.status === "pending" ? "bg-accent/10 text-accent" : tx.status === "approved" || tx.status === "completed" ? "bg-game-green/10 text-game-green" : "bg-destructive/10 text-destructive"}`}>{tx.status}</span>
                  </div>
                  {tx.screenshot_url && (
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        const { data } = await supabase.storage.from("payment-screenshots").createSignedUrl(tx.screenshot_url, 600);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }} className="text-primary text-xs font-semibold flex items-center gap-1"><Eye className="w-3 h-3" /> View</button>
                      <button onClick={async () => {
                        const { data } = await supabase.storage.from("payment-screenshots").download(tx.screenshot_url);
                        if (data) { const url = URL.createObjectURL(data); const a = document.createElement("a"); a.href = url; a.download = "screenshot"; a.click(); }
                      }} className="text-game-blue text-xs font-semibold flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                    </div>
                  )}
                  {tx.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleTransaction(tx.id, "approved")} className="flex-1 bg-game-green/20 text-game-green py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                      <button onClick={() => handleTransaction(tx.id, "rejected")} className="flex-1 bg-destructive/20 text-destructive py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><X className="w-3 h-3" /> Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTxns.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No transactions</p>}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-foreground flex-shrink-0">Users ({profiles.length})</h3>
              <div className="flex-1 bg-card rounded-xl px-3 py-2 flex items-center gap-2 border border-border/50">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input placeholder="Search..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="bg-transparent text-foreground text-xs w-full outline-none placeholder:text-muted-foreground" />
              </div>
            </div>

            {selectedUser && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 border border-primary/30 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-foreground">{selectedUser.full_name || "No Name"}</h4>
                    <p className="text-muted-foreground text-xs">📞 {selectedUser.phone || "-"} · Joined: {new Date(selectedUser.created_at).toLocaleDateString("hi-IN")}</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                
                <div className="bg-primary/10 rounded-xl p-3">
                  <p className="text-muted-foreground text-xs">Wallet Balance</p>
                  <p className="font-display font-bold text-xl text-primary">₹{getUserWallet(selectedUser.user_id) ? Number(getUserWallet(selectedUser.user_id).balance).toFixed(0) : "0"}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary rounded-lg p-2 text-center"><p className="text-[9px] text-muted-foreground">Bets</p><p className="font-bold text-foreground text-sm">{userBets.length}</p></div>
                  <div className="bg-secondary rounded-lg p-2 text-center"><p className="text-[9px] text-muted-foreground">Wins</p><p className="font-bold text-game-green text-sm">{userBets.filter(b => b.status === "won").length}</p></div>
                  <div className="bg-secondary rounded-lg p-2 text-center"><p className="text-[9px] text-muted-foreground">Lost</p><p className="font-bold text-destructive text-sm">{userBets.filter(b => b.status === "lost").length}</p></div>
                </div>

                <div>
                  <p className="text-foreground font-bold text-xs mb-1">Recent Bets</p>
                  {userBets.slice(0, 10).map(b => (
                    <div key={b.id} className="flex justify-between items-center bg-secondary rounded-lg px-3 py-2 mb-1 text-xs">
                      <div>
                        <span className="text-foreground">{(b as any).games?.name_hindi || (b as any).games?.name} · #{String(b.number).padStart(2, "0")}</span>
                        <p className="text-muted-foreground text-[9px]">Bet: {b.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-foreground font-bold">₹{Number(b.amount)}</span>
                        <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${b.status === "won" ? "bg-game-green/10 text-game-green" : b.status === "lost" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-foreground font-bold text-xs mb-1">Transactions</p>
                  {userTxns.slice(0, 10).map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-secondary rounded-lg px-3 py-2 mb-1 text-xs">
                      <div>
                        <span className="text-foreground capitalize">{t.type} · {t.payment_method || "-"}</span>
                        <p className="text-muted-foreground text-[9px]">TX: {t.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${t.type === "deposit" || t.type === "win" ? "text-game-green" : "text-destructive"}`}>{t.type === "deposit" || t.type === "win" ? "+" : "-"}₹{Number(t.amount)}</span>
                        <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${t.status === "pending" ? "bg-accent/10 text-accent" : "bg-game-green/10 text-game-green"}`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {filteredUsers.map((p) => {
              const uw = getUserWallet(p.user_id);
              return (
                <button key={p.id} onClick={() => loadUserDetails(p)} className="w-full bg-card rounded-xl p-3 border border-border/50 flex items-center justify-between text-left hover:border-primary/30 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center"><UserCheck className="w-4 h-4 text-primary-foreground" /></div>
                    <div>
                      <p className="text-foreground font-medium text-sm">{p.full_name || "No Name"}</p>
                      <p className="text-muted-foreground text-[10px]">📞 {p.phone || "-"} · {new Date(p.created_at).toLocaleDateString("hi-IN")}</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-sm">₹{uw ? Number(uw.balance).toFixed(0) : "0"}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TICKETS TAB */}
        {tab === "tickets" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Support Tickets ({tickets.length})</h3>
            {tickets.map((t) => {
              const profile = getUserProfile(t.user_id);
              return (
                <div key={t.id} className="bg-card rounded-xl p-3 space-y-2 border border-border/50 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div><p className="text-foreground font-medium text-sm">{t.subject}</p><p className="text-muted-foreground text-xs">{t.message}</p><p className="text-muted-foreground text-[10px]">{profile?.full_name || "User"} · {new Date(t.created_at).toLocaleString("hi-IN")}</p></div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.status === "open" ? "bg-accent/10 text-accent" : "bg-game-green/10 text-game-green"}`}>{t.status}</span>
                  </div>
                  {t.status === "open" && (
                    <div className="flex gap-2">
                      <input id={`reply-${t.id}`} placeholder="Reply..." className="flex-1 bg-secondary text-foreground px-3 py-2 rounded-xl text-xs outline-none placeholder:text-muted-foreground" />
                      <button onClick={() => { const el = document.getElementById(`reply-${t.id}`) as HTMLInputElement; replyTicket(t.id, el.value); }} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold">Send</button>
                    </div>
                  )}
                  {t.admin_reply && <p className="text-game-green text-xs bg-game-green/5 rounded-lg px-3 py-2">✅ {t.admin_reply}</p>}
                </div>
              );
            })}
            {tickets.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No tickets</p>}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === "notifications" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">📢 Notifications</h3>
            <div className="bg-card rounded-xl p-4 space-y-3 border border-border/50 shadow-sm">
              <input placeholder="Title" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
              <textarea placeholder="Message" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={3} className="w-full bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground resize-none" />
              <button onClick={sendNotification} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-bold text-sm shadow-glow-primary">Send to All Users</button>
            </div>

            <h4 className="font-display font-bold text-foreground text-sm">Sent Notifications</h4>
            {allNotifications.map(n => (
              <div key={n.id} className="bg-card rounded-xl p-3 border border-border/50 flex items-start justify-between shadow-sm">
                <div>
                  <p className="text-foreground font-medium text-sm">{n.title}</p>
                  <p className="text-muted-foreground text-xs">{n.message}</p>
                  <p className="text-muted-foreground text-[10px]">{new Date(n.created_at).toLocaleString("hi-IN")} · {n.is_global ? "Global" : "User"}</p>
                </div>
                <button onClick={() => deleteNotification(n.id)} className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0"><Trash2 className="w-3 h-3 text-destructive" /></button>
              </div>
            ))}
            {allNotifications.length === 0 && <p className="text-muted-foreground text-xs text-center py-4">No notifications sent yet</p>}
          </div>
        )}

        {/* DATA TAB */}
        {tab === "data" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">💾 Data Management</h3>
            <div className="bg-card rounded-xl p-4 space-y-3 border border-border/50 shadow-sm">
              <h4 className="font-display font-bold text-foreground text-sm">Export Data</h4>
              <p className="text-muted-foreground text-xs">Download complete backup of games, users, bets, results, transactions & settings</p>
              <button onClick={exportData} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-bold text-sm shadow-glow-primary flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export Backup (JSON)</button>
            </div>
            <div className="bg-card rounded-xl p-4 space-y-3 border border-border/50 shadow-sm">
              <h4 className="font-display font-bold text-foreground text-sm">Import Data</h4>
              <p className="text-muted-foreground text-xs">Restore settings from a previously exported backup file</p>
              <label className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-secondary/80 transition-colors">
                <Upload className="w-4 h-4" /> Import Backup
                <input type="file" accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) importData(e.target.files[0]); }} />
              </label>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/50 shadow-sm">
              <h4 className="font-display font-bold text-foreground text-sm mb-2">📊 Stats</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Games</span><span className="text-foreground font-bold">{games.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Users</span><span className="text-foreground font-bold">{profiles.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Bets</span><span className="text-foreground font-bold">{bets.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Results</span><span className="text-foreground font-bold">{results.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Transactions</span><span className="text-foreground font-bold">{transactions.length}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">⚙️ App Settings</h3>
            {[
              { key: "app_name", label: "App Name (Logo Text)", placeholder: "Matka Pro" },
              { key: "live_ticker", label: "Live Ticker Text", placeholder: "Enter ticker message..." },
              { key: "deposit_upi", label: "Deposit UPI ID", placeholder: "admin@upi" },
              { key: "telegram_link", label: "Telegram Link", placeholder: "https://t.me/..." },
              { key: "whatsapp_link", label: "WhatsApp Link", placeholder: "https://wa.me/..." },
              { key: "min_deposit", label: "Min Deposit (₹)", placeholder: "100" },
              { key: "max_deposit", label: "Max Deposit (₹)", placeholder: "50000" },
              { key: "min_withdraw", label: "Min Withdraw (₹)", placeholder: "200" },
              { key: "max_withdraw", label: "Max Withdraw (₹)", placeholder: "25000" },
              { key: "min_bet", label: "Min Bet Amount (₹)", placeholder: "10" },
              { key: "max_bet", label: "Max Bet Amount (₹)", placeholder: "10000" },
              { key: "app_notice", label: "App Notice / Announcement", placeholder: "Important announcement..." },
              { key: "support_email", label: "Support Email", placeholder: "support@example.com" },
              { key: "maintenance_mode", label: "Maintenance Mode (true/false)", placeholder: "false" },
              { key: "referral_bonus", label: "Referral Bonus (₹)", placeholder: "50" },
              { key: "welcome_bonus", label: "Welcome Bonus (₹)", placeholder: "0" },
            ].map((s) => (
              <div key={s.key} className="bg-card rounded-xl p-3 space-y-1.5 border border-border/50 shadow-sm">
                <label className="text-muted-foreground text-xs font-medium">{s.label}</label>
                <div className="flex gap-2">
                  <input value={settings[s.key] || ""} onChange={(e) => setSettings({ ...settings, [s.key]: e.target.value })} placeholder={s.placeholder} className="flex-1 bg-secondary text-foreground px-3 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                  <button onClick={() => updateSetting(s.key, settings[s.key] || "")} className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-semibold shadow-glow-primary">Save</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
