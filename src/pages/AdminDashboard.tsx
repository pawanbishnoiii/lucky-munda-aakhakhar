import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Wallet, Users, Settings, BarChart3, MessageSquare, Bell, Plus, Trash2, Check, X, Eye, Download, Clock } from "lucide-react";

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
  const [showAddGame, setShowAddGame] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", name_hindi: "", game_type: "both", result_time: "12:00", closure_minutes: 30, payout_percentage: 93, commission_percentage: 7 });
  const [declareGameId, setDeclareGameId] = useState("");
  const [declareMunda, setDeclareMunda] = useState("");
  const [declareAakhar, setDeclareAakhar] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/profile");
  }, [loading, user, isAdmin]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [g, t, tk, s, p, r] = await Promise.all([
      supabase.from("games").select("*").order("result_time"),
      supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_settings").select("*"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("game_results").select("*, games(name)").order("created_at", { ascending: false }).limit(50),
    ]);
    setGames(g.data || []);
    setTransactions(t.data || []);
    setTickets(tk.data || []);
    setProfiles(p.data || []);
    setResults(r.data || []);
    const settingsMap: Record<string, string> = {};
    (s.data || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
    setSettings(settingsMap);
  };

  const updateSetting = async (key: string, value: string) => {
    await supabase.from("admin_settings").update({ value }).eq("key", key);
    setSettings({ ...settings, [key]: value });
    toast({ title: "Setting Updated ✅" });
  };

  const addGame = async () => {
    const { error } = await supabase.from("games").insert(newGame);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Game Added ✅" }); setShowAddGame(false); fetchAll(); }
  };

  const toggleGame = async (id: string, isActive: boolean) => {
    await supabase.from("games").update({ is_active: !isActive }).eq("id", id);
    fetchAll();
  };

  const handleTransaction = async (id: string, action: "approved" | "rejected") => {
    await supabase.from("wallet_transactions").update({ status: action, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (action === "approved") {
      const tx = transactions.find((t) => t.id === id);
      if (tx?.type === "deposit") {
        const { data: w } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).maybeSingle();
        if (w) await supabase.from("wallets").update({ balance: Number(w.balance) + Number(tx.amount) }).eq("user_id", tx.user_id);
      }
    }
    if (action === "rejected") {
      const tx = transactions.find((t) => t.id === id);
      if (tx?.type === "withdraw") {
        const { data: w } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).maybeSingle();
        if (w) await supabase.from("wallets").update({ balance: Number(w.balance) + Number(tx.amount) }).eq("user_id", tx.user_id);
      }
    }
    toast({ title: `Transaction ${action} ✅` });
    fetchAll();
  };

  const declareResult = async () => {
    if (!declareGameId) return;
    const { error } = await supabase.from("game_results").insert({
      game_id: declareGameId,
      munda_result: declareMunda ? parseInt(declareMunda) : null,
      aakhar_result: declareAakhar ? parseInt(declareAakhar) : null,
      declared_at: new Date().toISOString(),
      declared_by: user!.id,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Result Declared ✅" }); setDeclareMunda(""); setDeclareAakhar(""); setDeclareGameId(""); fetchAll(); }
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

  const tabs = [
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "results", label: "Results", icon: BarChart3 },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "users", label: "Users", icon: Users },
    { id: "tickets", label: "Tickets", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "notifications", label: "Notify", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
        <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary"><span className="text-primary-foreground font-display font-bold text-xs">BK</span></div>
        <h1 className="font-display font-bold text-lg text-foreground">Admin Panel</h1>
      </header>

      {/* Tabs */}
      <div className="px-4 pt-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${tab === t.id ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
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
              <h3 className="font-display font-bold text-foreground">Games Manage</h3>
              <button onClick={() => setShowAddGame(!showAddGame)} className="gradient-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"><Plus className="w-3 h-3" /> Add Game</button>
            </div>
            {showAddGame && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-4 space-y-2">
                <input placeholder="Game Name" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <input placeholder="Hindi Name" value={newGame.name_hindi} onChange={(e) => setNewGame({ ...newGame, name_hindi: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <select value={newGame.game_type} onChange={(e) => setNewGame({ ...newGame, game_type: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none">
                  <option value="both">Both (Munda + Aakhar)</option>
                  <option value="munda">Munda Only</option>
                  <option value="aakhar">Aakhar Only</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" value={newGame.result_time} onChange={(e) => setNewGame({ ...newGame, result_time: e.target.value })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  <input type="number" placeholder="Closure (min)" value={newGame.closure_minutes} onChange={(e) => setNewGame({ ...newGame, closure_minutes: parseInt(e.target.value) })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Payout %" value={newGame.payout_percentage} onChange={(e) => setNewGame({ ...newGame, payout_percentage: parseFloat(e.target.value) })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                  <input type="number" placeholder="Commission %" value={newGame.commission_percentage} onChange={(e) => setNewGame({ ...newGame, commission_percentage: parseFloat(e.target.value) })} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none" />
                </div>
                <button onClick={addGame} className="w-full gradient-primary text-primary-foreground py-2 rounded-xl font-semibold text-sm">Add Game</button>
              </motion.div>
            )}
            {games.map((g) => (
              <div key={g.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium text-sm">{g.name} {g.name_hindi && <span className="text-muted-foreground">({g.name_hindi})</span>}</p>
                  <p className="text-muted-foreground text-xs">{g.game_type} · {g.result_time} · Payout: {g.payout_percentage}%</p>
                </div>
                <button onClick={() => toggleGame(g.id, g.is_active)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${g.is_active ? "bg-game-green/20 text-game-green" : "bg-destructive/20 text-destructive"}`}>{g.is_active ? "Active" : "Inactive"}</button>
              </div>
            ))}
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === "results" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Declare Result</h3>
            <div className="glass rounded-xl p-4 space-y-2">
              <select value={declareGameId} onChange={(e) => setDeclareGameId(e.target.value)} className="w-full bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none">
                <option value="">Select Game</option>
                {games.filter(g => g.is_active).map((g) => <option key={g.id} value={g.id}>{g.name} ({g.name_hindi})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min={0} max={9} placeholder="Munda (0-9)" value={declareMunda} onChange={(e) => setDeclareMunda(e.target.value)} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <input type="number" min={1} max={99} placeholder="Aakhar (01-99)" value={declareAakhar} onChange={(e) => setDeclareAakhar(e.target.value)} className="bg-secondary text-foreground px-3 py-2 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <button onClick={declareResult} className="w-full gradient-primary text-primary-foreground py-2 rounded-xl font-semibold text-sm">Declare Result</button>
            </div>
            <h4 className="font-display font-bold text-foreground text-sm">Recent Results</h4>
            {results.map((r) => (
              <div key={r.id} className="glass rounded-xl p-3">
                <p className="text-foreground text-sm font-medium">{(r as any).games?.name} — {r.result_date}</p>
                <p className="text-muted-foreground text-xs">Munda: <span className="text-accent font-bold">{r.munda_result ?? "-"}</span> · Aakhar: <span className="text-accent font-bold">{r.aakhar_result ?? "-"}</span></p>
              </div>
            ))}
          </div>
        )}

        {/* WALLET TAB */}
        {tab === "wallet" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Wallet Requests</h3>
            {transactions.filter(t => t.status === "pending").map((tx) => (
              <div key={tx.id} className="glass rounded-xl p-3 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <p className="text-foreground font-medium text-sm capitalize">{tx.type} — ₹{parseFloat(tx.amount)}</p>
                    <p className="text-muted-foreground text-xs">{tx.payment_method} · UTR: {tx.utr_number || "-"}</p>
                    {tx.upi_id && <p className="text-muted-foreground text-xs">UPI: {tx.upi_id}</p>}
                    {tx.bank_holder_name && <p className="text-muted-foreground text-xs">Bank: {tx.bank_holder_name} | {tx.bank_account_number} | {tx.bank_ifsc_code}</p>}
                  </div>
                </div>
                {tx.screenshot_url && (
                  <button onClick={async () => {
                    const { data } = await supabase.storage.from("payment-screenshots").createSignedUrl(tx.screenshot_url, 600);
                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                  }} className="text-primary text-xs font-semibold flex items-center gap-1"><Eye className="w-3 h-3" /> View Screenshot</button>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleTransaction(tx.id, "approved")} className="flex-1 bg-game-green/20 text-game-green py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                  <button onClick={() => handleTransaction(tx.id, "rejected")} className="flex-1 bg-destructive/20 text-destructive py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><X className="w-3 h-3" /> Reject</button>
                </div>
              </div>
            ))}
            {transactions.filter(t => t.status === "pending").length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No pending requests</p>}

            <h4 className="font-display font-bold text-foreground text-sm pt-2">All Transactions</h4>
            {transactions.slice(0, 20).map((tx) => (
              <div key={tx.id} className="glass rounded-xl p-3 flex justify-between items-center">
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
              <div key={p.id} className="glass rounded-xl p-3">
                <p className="text-foreground font-medium text-sm">{p.full_name || "No Name"}</p>
                <p className="text-muted-foreground text-xs">Joined: {new Date(p.created_at).toLocaleDateString("hi-IN")}</p>
              </div>
            ))}
          </div>
        )}

        {/* TICKETS TAB */}
        {tab === "tickets" && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-foreground">Support Tickets</h3>
            {tickets.map((t) => (
              <div key={t.id} className="glass rounded-xl p-3 space-y-2">
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
                {t.admin_reply && <p className="text-game-green text-xs">Reply: {t.admin_reply}</p>}
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
              <div key={s.key} className="glass rounded-xl p-3 space-y-1">
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
            <div className="glass rounded-xl p-4 space-y-2">
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
