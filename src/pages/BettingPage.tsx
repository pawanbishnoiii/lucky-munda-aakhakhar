import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Trash2, Printer, X, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  number: number;
  amount: number;
  betType: "munda" | "aakhar";
}

const BettingPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [betType, setBetType] = useState<"munda" | "aakhar">("munda");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [showCart, setShowCart] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBetId, setLastBetId] = useState("");
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId) return;
    supabase.from("games").select("*").eq("id", gameId).maybeSingle().then(({ data }) => setGame(data));
  }, [gameId]);

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setWallet(data));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-card rounded-2xl p-8 text-center border border-border/50 shadow-sm">
          <h2 className="font-display font-bold text-xl text-foreground mb-2">Login ज़रूरी है</h2>
          <p className="text-muted-foreground text-sm mb-4">बेट लगाने के लिए पहले Login करें</p>
          <button onClick={() => navigate("/profile")} className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">Login करें →</button>
        </div>
      </div>
    );
  }

  if (!game) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const mundaNumbers = Array.from({ length: 10 }, (_, i) => i);
  const aakharNumbers = Array.from({ length: 99 }, (_, i) => i + 1);
  const numbers = betType === "munda" ? mundaNumbers : aakharNumbers;

  const addToCart = (num: number) => {
    const key = `${betType}-${num}`;
    const amt = parseFloat(amounts[key] || "0");
    if (amt <= 0) { toast({ title: "राशि डालें", variant: "destructive" }); return; }
    const existing = cart.findIndex(c => c.number === num && c.betType === betType);
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].amount += amt;
      setCart(updated);
    } else {
      setCart([...cart, { number: num, amount: amt, betType }]);
    }
    setAmounts({ ...amounts, [key]: "" });
    toast({ title: `${betType === "munda" ? "मुंडा" : "आखर"} #${betType === "aakhar" ? String(num).padStart(2, "0") : num} — ₹${amt} कार्ट में जोड़ा` });
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);

  const placeBets = async () => {
    if (cart.length === 0) return;
    if (!wallet || totalAmount > parseFloat(wallet.balance)) {
      toast({ title: "अपर्याप्त बैलेंस!", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const betsData = cart.map(item => ({
      user_id: user.id,
      game_id: gameId!,
      bet_type: item.betType,
      number: item.number,
      amount: item.amount,
      status: "pending",
    }));
    const { error } = await supabase.from("bets").insert(betsData);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    // Deduct wallet
    const newBalance = parseFloat(wallet.balance) - totalAmount;
    await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);
    setWallet({ ...wallet, balance: newBalance });

    const betId = `BK${Date.now().toString(36).toUpperCase()}`;
    setLastBetId(betId);
    setShowBill(true);
    setSubmitting(false);
    toast({ title: "✅ बेट सफलतापूर्वक लगाई गई!" });
  };

  const printBill = () => {
    if (!billRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>BK Matka - Betting Bill</title><style>body{font-family:monospace;padding:20px;max-width:400px;margin:auto}h2{text-align:center}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}.total{font-weight:bold;font-size:14px}</style></head><body>${billRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/games")} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h1 className="font-display font-bold text-foreground">{game.name_hindi || game.name}</h1>
            <p className="text-muted-foreground text-xs">बैलेंस: ₹{wallet ? parseFloat(wallet.balance).toFixed(0) : "0"}</p>
          </div>
        </div>
        <button onClick={() => setShowCart(!showCart)} className="relative w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary">
          <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] text-destructive-foreground font-bold flex items-center justify-center">{cart.length}</span>}
        </button>
      </header>

      {/* Bet Type Toggle */}
      <div className="px-4 pt-3">
        <div className="flex gap-2 mb-3">
          {game.game_type !== "aakhar" && (
            <button onClick={() => setBetType("munda")} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${betType === "munda" ? "gradient-primary text-primary-foreground shadow-glow-primary" : "bg-secondary text-secondary-foreground"}`}>
              🎯 मुंडा (0-9)
            </button>
          )}
          {game.game_type !== "munda" && (
            <button onClick={() => setBetType("aakhar")} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${betType === "aakhar" ? "gradient-primary text-primary-foreground shadow-glow-primary" : "bg-secondary text-secondary-foreground"}`}>
              🔢 आखर (01-99)
            </button>
          )}
        </div>
      </div>

      {/* Number Grid */}
      <div className="px-4">
        <div className={`grid gap-2 ${betType === "munda" ? "grid-cols-2" : "grid-cols-5"}`}>
          {numbers.map((num) => {
            const key = `${betType}-${num}`;
            const displayNum = betType === "aakhar" ? String(num).padStart(2, "0") : String(num);
            const inCart = cart.some(c => c.number === num && c.betType === betType);
            return (
              <div key={key} className={`bg-card rounded-xl border transition-all ${inCart ? "border-primary shadow-glow-primary" : "border-border/50"} ${betType === "munda" ? "p-4" : "p-2"}`}>
                <div className="text-center mb-1.5">
                  <span className={`font-mono font-bold ${betType === "munda" ? "text-2xl" : "text-lg"} text-foreground`}>{displayNum}</span>
                </div>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="₹"
                    value={amounts[key] || ""}
                    onChange={(e) => setAmounts({ ...amounts, [key]: e.target.value })}
                    className={`flex-1 bg-secondary text-foreground rounded-lg text-center outline-none placeholder:text-muted-foreground ${betType === "munda" ? "px-2 py-2 text-sm" : "px-1 py-1.5 text-[11px]"}`}
                  />
                  <button onClick={() => addToCart(num)} className={`gradient-primary text-primary-foreground rounded-lg font-bold flex items-center justify-center ${betType === "munda" ? "px-3 py-2 text-sm" : "px-2 py-1.5 text-xs"}`}>
                    <Plus className={betType === "munda" ? "w-4 h-4" : "w-3 h-3"} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Bottom Bar */}
      {cart.length > 0 && !showCart && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto px-4 pb-4">
            <button onClick={() => setShowCart(true)} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-sm shadow-glow-primary flex items-center justify-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              कार्ट देखें ({cart.length} items) — ₹{totalAmount}
            </button>
          </div>
        </motion.div>
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto border-t border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-foreground">🛒 आपका कार्ट</h3>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">कार्ट खाली है</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {cart.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">{item.betType === "munda" ? "मुंडा" : "आखर"}</span>
                          <p className="font-mono font-bold text-foreground text-lg">#{item.betType === "aakhar" ? String(item.number).padStart(2, "0") : item.number}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">₹{item.amount}</span>
                          <button onClick={() => removeFromCart(i)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-secondary rounded-xl p-4 mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1"><span>कुल बेट्स</span><span>{cart.length}</span></div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2"><span>बैलेंस</span><span>₹{wallet ? parseFloat(wallet.balance).toFixed(0) : "0"}</span></div>
                    <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-foreground"><span>कुल राशि</span><span>₹{totalAmount}</span></div>
                  </div>

                  <button onClick={placeBets} disabled={submitting} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-sm shadow-glow-primary disabled:opacity-50">
                    {submitting ? "Processing..." : `बेट लगाएं — ₹${totalAmount}`}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bill Modal */}
      <AnimatePresence>
        {showBill && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-card rounded-2xl p-5 border border-border/50 shadow-lg">
              <div ref={billRef}>
                <div className="text-center mb-4">
                  <h2 className="font-display font-bold text-xl text-foreground">BK Matka</h2>
                  <p className="text-muted-foreground text-xs">Betting Receipt</p>
                  <div className="border-t border-dashed border-border my-2" />
                </div>
                <div className="space-y-1 text-xs mb-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Bet ID:</span><span className="font-mono font-bold text-foreground">{lastBetId}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">User:</span><span className="text-foreground">{user.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Game:</span><span className="text-foreground">{game.name_hindi || game.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="text-foreground">{new Date().toLocaleString("hi-IN")}</span></div>
                </div>
                <table className="w-full text-xs mb-3">
                  <thead><tr className="border-b border-border"><th className="text-left py-1 text-muted-foreground">Type</th><th className="text-center py-1 text-muted-foreground">No.</th><th className="text-right py-1 text-muted-foreground">Amount</th></tr></thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-1 text-foreground">{item.betType === "munda" ? "मुंडा" : "आखर"}</td>
                        <td className="text-center font-mono font-bold text-foreground">{item.betType === "aakhar" ? String(item.number).padStart(2, "0") : item.number}</td>
                        <td className="text-right text-foreground">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-dashed border-border pt-2 flex justify-between font-bold text-foreground text-sm">
                  <span>कुल राशि</span><span>₹{totalAmount}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={printBill} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> प्रिंट</button>
                <button onClick={() => { setShowBill(false); setCart([]); setShowCart(false); navigate("/games"); }} className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">ठीक है ✅</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BettingPage;
