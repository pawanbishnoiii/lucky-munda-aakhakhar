import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowDownLeft, ArrowUpRight, QrCode, LogIn, CreditCard, Building2, X, TrendingUp, TrendingDown, Wallet, Clock, Filter } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const WalletPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankInfoSaved, setBankInfoSaved] = useState(false);
  const [upiInfoSaved, setUpiInfoSaved] = useState(false);
  const [depositUpi, setDepositUpi] = useState("admin@upi");
  const [submitting, setSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [txFilter, setTxFilter] = useState<"all" | "deposit" | "withdraw" | "win">("all");

  useEffect(() => {
    supabase.from("admin_settings").select("*").eq("key", "deposit_upi").maybeSingle()
      .then(({ data }) => { if (data) setDepositUpi(data.value); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: w } = await supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(w);
      const { data: txs } = await supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      setTransactions(txs || []);
    };
    fetchData();
    const channel = supabase.channel("wallet-changes").on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filteredTx = useMemo(() => {
    if (txFilter === "all") return transactions;
    return transactions.filter(t => t.type === txFilter);
  }, [transactions, txFilter]);

  // Stats
  const totalDeposited = useMemo(() => transactions.filter(t => t.type === "deposit" && (t.status === "approved" || t.status === "completed")).reduce((s, t) => s + parseFloat(t.amount), 0), [transactions]);
  const totalWon = useMemo(() => transactions.filter(t => t.type === "win").reduce((s, t) => s + parseFloat(t.amount), 0), [transactions]);
  const totalWithdrawn = useMemo(() => transactions.filter(t => t.type === "withdraw" && (t.status === "approved" || t.status === "completed")).reduce((s, t) => s + parseFloat(t.amount), 0), [transactions]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title="वॉलेट" />
        <div className="px-4 pt-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 text-center border border-border/50 shadow-sm">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary"><LogIn className="w-8 h-8 text-primary-foreground" /></div>
            <h2 className="font-display font-bold text-xl text-foreground mb-2">Login Required</h2>
            <p className="text-muted-foreground text-sm mb-6">Wallet के लिए पहले Login करें</p>
            <button onClick={() => navigate("/profile")} className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm shadow-glow-primary w-full">Login / Sign Up →</button>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!depositAmount || !utrNumber) { toast({ title: "Amount और UTR ज़रूरी है", variant: "destructive" }); return; }
    if (!screenshotFile) { toast({ title: "Screenshot upload करना ज़रूरी है!", variant: "destructive" }); return; }
    setSubmitting(true);
    const filePath = `${user.id}/${Date.now()}_${screenshotFile.name}`;
    const { error: uploadError } = await supabase.storage.from("payment-screenshots").upload(filePath, screenshotFile);
    if (uploadError) { toast({ title: "Screenshot upload failed", variant: "destructive" }); setSubmitting(false); return; }
    const { error } = await supabase.from("wallet_transactions").insert({ user_id: user.id, type: "deposit", amount: parseFloat(depositAmount), status: "pending", utr_number: utrNumber, screenshot_url: filePath, payment_method: "UPI" });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Deposit Request Submitted!" }); setDepositAmount(""); setUtrNumber(""); setScreenshotFile(null); }
    setSubmitting(false);
    const { data: txs } = await supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setTransactions(txs || []);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawMethod) { toast({ title: "Amount और Method ज़रूरी है", variant: "destructive" }); return; }
    const amt = parseFloat(withdrawAmount);
    if (wallet && amt > parseFloat(wallet.balance)) { toast({ title: "Insufficient Balance", variant: "destructive" }); return; }
    if (withdrawMethod === "upi" && !upiId) { toast({ title: "UPI ID ज़रूरी है", variant: "destructive" }); return; }
    if (withdrawMethod === "bank" && (!bankHolderName || !bankAccountNumber || !bankIfsc || bankAccountNumber !== confirmAccountNumber)) {
      toast({ title: bankAccountNumber !== confirmAccountNumber ? "Account numbers don't match" : "सभी Bank details ज़रूरी हैं", variant: "destructive" }); return;
    }
    setSubmitting(true);
    const newBalance = parseFloat(wallet.balance) - amt;
    await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);
    setWallet({ ...wallet, balance: newBalance });
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id, type: "withdraw", amount: amt, status: "pending", payment_method: withdrawMethod,
      upi_id: withdrawMethod === "upi" ? upiId : null,
      bank_holder_name: withdrawMethod === "bank" ? bankHolderName : null,
      bank_account_number: withdrawMethod === "bank" ? bankAccountNumber : null,
      bank_ifsc_code: withdrawMethod === "bank" ? bankIfsc : null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Withdraw Request Submitted!" }); setWithdrawAmount(""); }
    setSubmitting(false);
    const { data: txs } = await supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setTransactions(txs || []);
  };

  const bal = wallet ? parseFloat(wallet.balance) : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="वॉलेट" />

      {/* Balance Card */}
      <div className="px-4 pt-3">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="gradient-primary rounded-2xl p-5 shadow-glow-primary relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-foreground/5" />
          <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-foreground/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary-foreground/70" />
              <p className="text-primary-foreground/70 text-sm">कुल बैलेंस</p>
            </div>
            <h2 className="font-display font-bold text-3xl text-primary-foreground">₹{bal.toFixed(2)}</h2>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setActiveTab("deposit")} className="bg-foreground/20 hover:bg-foreground/30 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"><Plus className="w-4 h-4" /> जमा</button>
              <button onClick={() => setActiveTab("withdraw")} className="bg-foreground/10 hover:bg-foreground/20 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"><ArrowUpRight className="w-4 h-4" /> निकालें</button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mt-3 grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
          <TrendingUp className="w-4 h-4 text-game-green mx-auto mb-1" />
          <p className="font-display font-bold text-foreground text-sm">₹{totalDeposited.toFixed(0)}</p>
          <p className="text-muted-foreground text-[10px]">जमा</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
          <TrendingDown className="w-4 h-4 text-destructive mx-auto mb-1" />
          <p className="font-display font-bold text-foreground text-sm">₹{totalWithdrawn.toFixed(0)}</p>
          <p className="text-muted-foreground text-[10px]">निकाला</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-display font-bold text-foreground text-sm">₹{totalWon.toFixed(0)}</p>
          <p className="text-muted-foreground text-[10px]">जीत</p>
        </div>
      </div>

      {/* Deposit / Withdraw */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex gap-2 mb-4">
            {(["deposit", "withdraw"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{tab === "deposit" ? "जमा करें" : "निकालें"}</button>
            ))}
          </div>

          {activeTab === "deposit" ? (
            <div>
              <div className="bg-secondary rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-1"><QrCode className="w-4 h-4 text-primary" /><span className="text-foreground font-semibold text-sm">UPI: {depositUpi}</span></div>
                <p className="text-muted-foreground text-xs">Payment के बाद UTR और Screenshot दें</p>
              </div>
              <div className="space-y-3">
                <input type="number" placeholder="Amount (₹)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30" />
                <input type="text" placeholder="UTR Number" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30" />
                <label className={`w-full px-4 py-3 rounded-xl text-sm border-2 border-dashed cursor-pointer flex items-center gap-2 transition-colors ${screenshotFile ? "bg-game-green/10 border-game-green/30 text-game-green" : "bg-secondary text-muted-foreground border-border hover:border-primary"}`}>
                  📎 {screenshotFile ? `✅ ${screenshotFile.name}` : "Screenshot Upload करें (ज़रूरी)"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} />
                </label>
                <button onClick={handleDeposit} disabled={submitting || !screenshotFile} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-glow-primary disabled:opacity-50">{submitting ? "Submitting..." : "Deposit Request भेजें"}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input type="number" placeholder="निकालने की रकम (₹)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30" />
              <div className="flex gap-2">
                <button onClick={() => { setWithdrawMethod("upi"); setBankInfoSaved(false); setUpiInfoSaved(false); }} className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${withdrawMethod === "upi" ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}><CreditCard className="w-4 h-4" /> UPI</button>
                <button onClick={() => { setWithdrawMethod("bank"); setUpiInfoSaved(false); setBankInfoSaved(false); }} className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${withdrawMethod === "bank" ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}><Building2 className="w-4 h-4" /> Bank</button>
              </div>
              {withdrawMethod === "upi" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <input type="text" placeholder="UPI ID (eg: name@upi)" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                  {!upiInfoSaved && upiId && <button onClick={() => setUpiInfoSaved(true)} className="w-full bg-game-green/15 text-game-green py-2.5 rounded-xl font-semibold text-sm">✅ Save UPI</button>}
                </motion.div>
              )}
              {withdrawMethod === "bank" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <input type="text" placeholder="Account Holder Name" value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                  <input type="text" placeholder="Account Number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                  <input type="text" placeholder="Confirm Account Number" value={confirmAccountNumber} onChange={(e) => setConfirmAccountNumber(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                  <input type="text" placeholder="IFSC Code" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                  {!bankInfoSaved && bankHolderName && bankAccountNumber && bankIfsc && (
                    <button onClick={() => { if (bankAccountNumber !== confirmAccountNumber) { toast({ title: "Account numbers don't match!", variant: "destructive" }); return; } setBankInfoSaved(true); }} className="w-full bg-game-green/15 text-game-green py-2.5 rounded-xl font-semibold text-sm">✅ Save Bank Info</button>
                  )}
                </motion.div>
              )}
              {(upiInfoSaved || bankInfoSaved) && (
                <button onClick={handleWithdraw} disabled={submitting} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-glow-primary disabled:opacity-50">{submitting ? "Processing..." : "Withdraw Request भेजें"}</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-foreground">💳 Payment History</h3>
          <span className="text-muted-foreground text-xs">{filteredTx.length} records</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
          {(["all", "deposit", "withdraw", "win"] as const).map(f => (
            <button key={f} onClick={() => setTxFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${txFilter === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {f === "all" ? "सभी" : f === "deposit" ? "जमा" : f === "withdraw" ? "निकाला" : "जीत"}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredTx.map((tx) => (
            <motion.button key={tx.id} onClick={() => setSelectedTx(tx)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-card rounded-xl p-3 flex items-center justify-between border border-border/50 text-left hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === "deposit" || tx.type === "win" ? "bg-game-green/10" : "bg-destructive/10"}`}>
                  {tx.type === "deposit" || tx.type === "win" ? <ArrowDownLeft className="w-4 h-4 text-game-green" /> : <ArrowUpRight className="w-4 h-4 text-destructive" />}
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm capitalize">{tx.type === "win" ? "🏆 जीत" : tx.type === "deposit" ? "जमा" : "निकाला"}</p>
                  <p className="text-muted-foreground text-[11px]">{tx.payment_method || "-"} · {new Date(tx.created_at).toLocaleDateString("hi-IN")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-bold text-sm ${tx.type === "deposit" || tx.type === "win" ? "text-game-green" : "text-destructive"}`}>
                  {tx.type === "deposit" || tx.type === "win" ? "+" : "-"}₹{parseFloat(tx.amount).toFixed(0)}
                </p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tx.status === "pending" ? "bg-accent/10 text-accent" : tx.status === "approved" || tx.status === "completed" ? "bg-game-green/10 text-game-green" : "bg-destructive/10 text-destructive"}`}>{tx.status}</span>
              </div>
            </motion.button>
          ))}
          {filteredTx.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">कोई लेनदेन नहीं</p>}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedTx(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card rounded-2xl p-5 border border-border/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-foreground">Transaction Details</h3>
                <button onClick={() => setSelectedTx(null)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">Transaction ID:</span><span className="font-mono text-foreground text-[10px]">{selectedTx.id.slice(0, 12).toUpperCase()}</span></div>
                <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">Type:</span><span className="text-foreground capitalize font-medium">{selectedTx.type}</span></div>
                <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">Amount:</span><span className="font-bold text-foreground">₹{parseFloat(selectedTx.amount).toFixed(2)}</span></div>
                <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">Method:</span><span className="text-foreground">{selectedTx.payment_method || "-"}</span></div>
                <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">Status:</span><span className={`font-bold ${selectedTx.status === "approved" || selectedTx.status === "completed" ? "text-game-green" : selectedTx.status === "pending" ? "text-accent" : "text-destructive"}`}>{selectedTx.status}</span></div>
                <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">Date:</span><span className="text-foreground">{new Date(selectedTx.created_at).toLocaleString("hi-IN")}</span></div>
                {selectedTx.utr_number && <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">UTR:</span><span className="font-mono text-foreground">{selectedTx.utr_number}</span></div>}
                {selectedTx.upi_id && <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">UPI:</span><span className="text-foreground">{selectedTx.upi_id}</span></div>}
                {selectedTx.bank_holder_name && <div className="flex justify-between py-1 border-b border-border/30"><span className="text-muted-foreground">Bank:</span><span className="text-foreground">{selectedTx.bank_holder_name}</span></div>}
                {selectedTx.bank_account_number && <div className="flex justify-between py-1"><span className="text-muted-foreground">A/C:</span><span className="font-mono text-foreground">****{selectedTx.bank_account_number.slice(-4)}</span></div>}
                {selectedTx.admin_note && <div className="mt-2 bg-secondary rounded-lg p-2"><span className="text-muted-foreground text-[10px]">Admin Note: </span><span className="text-foreground text-[10px]">{selectedTx.admin_note}</span></div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletPage;
