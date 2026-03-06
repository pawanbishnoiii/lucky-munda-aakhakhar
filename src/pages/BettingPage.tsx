import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Trash2, Printer, X, Plus, Clock, Zap, Hash, Star, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/CountdownTimer";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CartItem {
  number: number;
  amount: number;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

const BettingPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [showCart, setShowCart] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBetId, setLastBetId] = useState("");
  const [bettingClosed, setBettingClosed] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number>(10);
  const [searchNum, setSearchNum] = useState("");
  const billRef = useRef<HTMLDivElement>(null);

  const { data: game } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      const { data } = await supabase.from("games").select("*").eq("id", gameId!).maybeSingle();
      return data;
    },
    enabled: !!gameId,
    staleTime: 30000,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 10000,
  });

  useEffect(() => {
    if (!game) return;
    const checkClosure = () => {
      const now = new Date();
      const [h, m] = game.result_time.split(":").map(Number);
      const gameTime = new Date(); gameTime.setHours(h, m, 0);
      const closureTime = new Date(gameTime.getTime() - (game.closure_minutes || 30) * 60000);
      setBettingClosed(now >= closureTime);
    };
    checkClosure();
    const interval = setInterval(checkClosure, 10000);
    return () => clearInterval(interval);
  }, [game]);

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

  const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
  const filteredNumbers = searchNum ? numbers.filter(n => String(n).padStart(2, "0").includes(searchNum)) : numbers;

  const addToCart = (num: number) => {
    const key = `num-${num}`;
    const amt = parseFloat(amounts[key] || String(quickAmount));
    if (amt <= 0) { toast({ title: "राशि डालें", variant: "destructive" }); return; }
    const existing = cart.findIndex(c => c.number === num);
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].amount += amt;
      setCart(updated);
    } else {
      setCart([...cart, { number: num, amount: amt }]);
    }
    setAmounts({ ...amounts, [key]: "" });
    toast({ title: `#${String(num).padStart(2, "0")} — ₹${amt} added` });
  };

  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index));
  const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);
  const potentialWin = (amt: number) => (amt * game.payout_percentage / 100).toFixed(0);

  const placeBets = async () => {
    if (cart.length === 0) return;
    if (bettingClosed) { toast({ title: "बेटिंग बंद!", variant: "destructive" }); return; }
    if (!wallet || totalAmount > Number(wallet.balance)) {
      toast({ title: "अपर्याप्त बैलेंस!", variant: "destructive" }); return;
    }
    setSubmitting(true);
    const betsData = cart.map(item => ({
      user_id: user.id, game_id: gameId!, bet_type: "aakhar",
      number: item.number, amount: item.amount, status: "pending",
    }));
    const { error } = await supabase.from("bets").insert(betsData);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSubmitting(false); return; }
    
    const newBalance = Number(wallet.balance) - totalAmount;
    await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["wallet"] });

    const betId = `BET-${Date.now().toString(36).toUpperCase()}`;
    setLastBetId(betId);
    setShowBill(true);
    setShowCart(false);
    setSubmitting(false);
    toast({ title: "✅ बेट सफलतापूर्वक लगाई गई!" });
  };

  const printBill = () => {
    if (!billRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Betting Bill</title><style>body{font-family:monospace;padding:20px;max-width:400px;margin:auto}h2{text-align:center}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}.total{font-weight:bold;font-size:14px}</style></head><body>${billRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const balance = wallet ? Number(wallet.balance) : 0;

  return (
    <div className="min-h-screen bg-background bg-grid pb-4">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-border/50 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/game/${gameId}`)} className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-foreground text-base">{game.name_hindi || game.name}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">₹{balance.toFixed(0)}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-primary font-semibold">Win {game.payout_percentage}x</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownTimer targetTime={game.result_time} label="" />
          <button onClick={() => setShowCart(!showCart)} className="relative w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary hover:opacity-90 transition-opacity">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            {cart.length > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-destructive rounded-full text-[11px] text-destructive-foreground font-bold flex items-center justify-center shadow-md">
                {cart.length}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      {/* Betting Closed Banner */}
      {bettingClosed && (
        <div className="px-4 pt-3">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
            <p className="text-destructive font-bold text-sm">🚫 बेटिंग बंद — नतीजा जल्द आएगा</p>
          </motion.div>
        </div>
      )}

      {/* Quick Amount & Search */}
      <div className="px-4 pt-3 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border/50 shadow-sm">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <input 
            type="text" placeholder="नंबर खोजें (01-100)..." value={searchNum} 
            onChange={(e) => setSearchNum(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground" 
          />
        </div>

        {/* Quick Amounts */}
        <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-foreground font-semibold text-xs">Quick Amount</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_AMOUNTS.map(amt => (
              <button 
                key={amt} 
                onClick={() => setQuickAmount(amt)} 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  quickAmount === amt 
                    ? "gradient-primary text-primary-foreground shadow-glow-primary scale-105" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Number Grid */}
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> नंबर चुनें
          </h3>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">₹{quickAmount}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {filteredNumbers.map((num) => {
            const key = `num-${num}`;
            const displayNum = String(num).padStart(2, "0");
            const inCart = cart.some(c => c.number === num);
            const cartAmt = cart.find(c => c.number === num)?.amount;
            return (
              <motion.div 
                key={key} 
                whileTap={{ scale: 0.92 }}
                className={`bg-card rounded-xl border-2 transition-all overflow-hidden ${
                  inCart 
                    ? "border-primary shadow-glow-primary" 
                    : "border-border/40 hover:border-primary/30"
                }`}
              >
                {/* Number display */}
                <div className={`text-center py-2 ${inCart ? "bg-primary/5" : ""}`}>
                  <span className="font-mono font-bold text-lg text-foreground">{displayNum}</span>
                  {inCart && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-primary font-bold flex items-center justify-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> ₹{cartAmt}
                    </motion.p>
                  )}
                </div>
                {/* Input + Add */}
                <div className="flex gap-0.5 p-1 pt-0">
                  <input
                    type="number"
                    placeholder={`₹${quickAmount}`}
                    value={amounts[key] || ""}
                    onChange={(e) => setAmounts({ ...amounts, [key]: e.target.value })}
                    disabled={bettingClosed}
                    className="flex-1 bg-secondary text-foreground rounded-lg text-center outline-none placeholder:text-muted-foreground/50 px-1 py-1.5 text-[11px] min-w-0 focus:ring-1 focus:ring-primary/30"
                  />
                  <button 
                    onClick={() => addToCart(num)} 
                    disabled={bettingClosed} 
                    className="gradient-primary text-primary-foreground rounded-lg font-bold flex items-center justify-center px-2 py-1.5 text-xs disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Cart Bottom Bar */}
      {cart.length > 0 && !showCart && !bettingClosed && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto px-4 pb-4">
            <button onClick={() => setShowCart(true)} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-glow-primary flex items-center justify-center gap-3 hover:opacity-90 transition-opacity">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm">कार्ट ({cart.length})</span>
              <span className="w-px h-5 bg-primary-foreground/30" />
              <span className="text-sm">₹{totalAmount}</span>
              <span className="w-px h-5 bg-primary-foreground/30" />
              <span className="text-xs opacity-80">Win ₹{potentialWin(totalAmount)}</span>
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
                <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">कार्ट खाली है</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {cart.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                        <div>
                          <p className="font-mono font-bold text-foreground text-lg">#{String(item.number).padStart(2, "0")}</p>
                          <p className="text-primary text-xs font-medium">Win: ₹{potentialWin(item.amount)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground text-lg">₹{item.amount}</span>
                          <button onClick={() => removeFromCart(i)} className="w-9 h-9 rounded-xl bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="bg-secondary rounded-xl p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground"><span>कुल बेट्स</span><span className="text-foreground font-medium">{cart.length}</span></div>
                    <div className="flex justify-between text-sm text-muted-foreground"><span>बैलेंस</span><span className="text-foreground font-medium">₹{balance.toFixed(0)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-primary">संभावित जीत</span><span className="text-primary font-bold">₹{potentialWin(totalAmount)}</span></div>
                    <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-foreground text-base"><span>कुल राशि</span><span>₹{totalAmount}</span></div>
                  </div>

                  <button onClick={placeBets} disabled={submitting || bettingClosed} className="w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-base shadow-glow-primary disabled:opacity-50 hover:opacity-90 transition-opacity">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : `बेट लगाएं — ₹${totalAmount}`}
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
                  <h2 className="font-display font-bold text-xl text-foreground">Betting Receipt</h2>
                  <p className="text-muted-foreground text-xs">सफल बेट</p>
                  <div className="border-t border-dashed border-border my-2" />
                </div>
                <div className="space-y-1 text-xs mb-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Bet ID:</span><span className="font-mono font-bold text-foreground">{lastBetId}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Game:</span><span className="text-foreground">{game.name_hindi || game.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="text-foreground">{new Date().toLocaleString("hi-IN")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payout:</span><span className="text-foreground">{game.payout_percentage}x</span></div>
                </div>
                <table className="w-full text-xs mb-3">
                  <thead><tr className="border-b border-border"><th className="text-left py-1 text-muted-foreground">No.</th><th className="text-right py-1 text-muted-foreground">Amount</th><th className="text-right py-1 text-muted-foreground">Win</th></tr></thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-1 font-mono font-bold text-foreground">#{String(item.number).padStart(2, "0")}</td>
                        <td className="text-right text-foreground">₹{item.amount}</td>
                        <td className="text-right text-primary font-bold">₹{potentialWin(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-dashed border-border pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-foreground"><span>कुल राशि</span><span>₹{totalAmount}</span></div>
                  <div className="flex justify-between text-primary font-bold"><span>संभावित जीत</span><span>₹{potentialWin(totalAmount)}</span></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={printBill} className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"><Printer className="w-4 h-4" /> प्रिंट</button>
                <button onClick={() => { setShowBill(false); setCart([]); setShowCart(false); navigate(`/game/${gameId}`); }} className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">ठीक है ✅</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BettingPage;
