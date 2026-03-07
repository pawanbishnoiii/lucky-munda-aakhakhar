import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Trash2, Printer, X, Plus, Minus, Clock, Zap, Hash, Star, Target, Trophy, Wallet, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/CountdownTimer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/hooks/useGames";

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
  const { data: settings = {} } = useSettings();
  const minBet = parseInt(settings.min_bet || "10") || 10;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBetId, setLastBetId] = useState("");
  const [bettingClosed, setBettingClosed] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number>(minBet);
  const [searchNum, setSearchNum] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
        <div className="bg-card rounded-2xl p-8 text-center border border-border/50 shadow-sm max-w-sm w-full">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">Login ज़रूरी है</h2>
          <p className="text-muted-foreground text-sm mb-4">बेट लगाने के लिए पहले Login करें</p>
          <button onClick={() => navigate("/profile")} className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm w-full">Login करें →</button>
        </div>
      </div>
    );
  }

  if (!game) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
  const filteredNumbers = searchNum ? numbers.filter(n => String(n).padStart(2, "0").includes(searchNum)) : numbers;
  const balance = wallet ? Number(wallet.balance) : 0;
  const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);
  const potentialWin = (amt: number) => (amt * game.payout_percentage / 100).toFixed(0);

  const addToCart = (num: number, customAmt?: number) => {
    const amt = customAmt || quickAmount;
    if (amt < minBet) { toast({ title: `न्यूनतम बेट ₹${minBet}`, variant: "destructive" }); return; }
    const existing = cart.findIndex(c => c.number === num);
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].amount += amt;
      setCart(updated);
    } else {
      setCart([...cart, { number: num, amount: amt }]);
    }
    toast({ title: `#${String(num).padStart(2, "0")} — ₹${amt} added` });
  };

  const updateCartAmount = (index: number, newAmount: number) => {
    if (newAmount < minBet) { removeFromCart(index); return; }
    const updated = [...cart];
    updated[index].amount = newAmount;
    setCart(updated);
  };

  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const placeBets = async () => {
    if (cart.length === 0) return;
    if (bettingClosed) { toast({ title: "बेटिंग बंद!", variant: "destructive" }); return; }
    if (totalAmount > balance) { toast({ title: "अपर्याप्त बैलेंस!", description: `ज़रूरत: ₹${totalAmount}, बैलेंस: ₹${balance}`, variant: "destructive" }); return; }
    setSubmitting(true);
    const betsData = cart.map(item => ({
      user_id: user.id, game_id: gameId!, bet_type: "aakhar",
      number: item.number, amount: item.amount, status: "pending",
    }));
    const { error } = await supabase.from("bets").insert(betsData);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSubmitting(false); return; }
    const newBalance = balance - totalAmount;
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
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>Bet Receipt</title><style>body{font-family:monospace;padding:20px;max-width:400px;margin:auto}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;font-size:12px}</style></head><body>${billRef.current.innerHTML}</body></html>`);
    pw.document.close(); pw.print();
  };

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Sticky Header */}
      <header className="bg-card/95 backdrop-blur-xl sticky top-0 z-40 border-b border-border/50 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/game/${gameId}`)} className="w-9 h-9 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="font-display font-bold text-foreground text-sm leading-tight">{game.name_hindi || game.name}</h1>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground">बैलेंस: <b className="text-foreground">₹{balance.toFixed(0)}</b></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CountdownTimer targetTime={game.result_time} label="" />
            <button onClick={() => setShowCart(!showCart)} className="relative w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary">
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
              {cart.length > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] text-destructive-foreground font-bold flex items-center justify-center">
                  {cart.length}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Game Info Strip */}
        <div className="px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          <div className="bg-primary/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shrink-0">
            <Trophy className="w-3 h-3 text-primary" />
            <span className="text-primary font-bold text-xs">{game.payout_percentage}x Win</span>
          </div>
          <div className="bg-secondary rounded-lg px-3 py-1.5 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-secondary-foreground text-xs">{game.result_time}</span>
          </div>
          <div className="bg-secondary rounded-lg px-3 py-1.5 flex items-center gap-1.5 shrink-0">
            <Info className="w-3 h-3 text-muted-foreground" />
            <span className="text-secondary-foreground text-xs">Min ₹{minBet}</span>
          </div>
          {bettingClosed && (
            <div className="bg-destructive/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shrink-0">
              <X className="w-3 h-3 text-destructive" />
              <span className="text-destructive font-bold text-xs">बंद</span>
            </div>
          )}
        </div>
      </header>

      {/* Quick Amount Selector */}
      <div className="px-4 pt-3 space-y-2.5">
        <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground font-semibold text-xs">Quick Amount</span>
            </div>
            <span className="text-primary font-mono font-bold text-sm">₹{quickAmount}</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => setQuickAmount(amt)}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  quickAmount === amt
                    ? "gradient-primary text-primary-foreground shadow-sm scale-[1.03]"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border/50 shadow-sm">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="नंबर खोजें (01-100)..." value={searchNum}
            onChange={(e) => setSearchNum(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchNum && <button onClick={() => setSearchNum("")} className="text-muted-foreground"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* Number Grid */}
      <div className="px-3 pt-3 pb-28">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" /> नंबर चुनें
            <span className="text-muted-foreground font-normal text-xs ml-1">({filteredNumbers.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {filteredNumbers.map((num) => {
            const displayNum = String(num).padStart(2, "0");
            const inCart = cart.some(c => c.number === num);
            const cartAmt = cart.find(c => c.number === num)?.amount;
            return (
              <motion.button
                key={num}
                whileTap={{ scale: 0.93 }}
                onClick={() => !bettingClosed && addToCart(num)}
                disabled={bettingClosed}
                className={`relative rounded-xl border-2 transition-all p-2 disabled:opacity-40 ${
                  inCart
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/40 bg-card hover:border-primary/40"
                }`}
              >
                <span className={`font-mono font-bold text-base block ${inCart ? "text-primary" : "text-foreground"}`}>
                  {displayNum}
                </span>
                {inCart ? (
                  <motion.span initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] text-primary font-bold flex items-center justify-center gap-0.5">
                    <Star className="w-2 h-2" /> ₹{cartAmt}
                  </motion.span>
                ) : (
                  <span className="text-[9px] text-muted-foreground/50">₹{quickAmount}</span>
                )}
                {inCart && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      {cart.length > 0 && !showCart && !bettingClosed && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background to-transparent pt-6">
          <div className="max-w-lg mx-auto px-4 pb-4">
            <button onClick={() => setShowCart(true)} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-2xl font-bold shadow-glow-primary flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">{cart.length} नंबर</span>
              <span className="w-px h-4 bg-primary-foreground/30" />
              <span className="text-sm">₹{totalAmount}</span>
              <span className="w-px h-4 bg-primary-foreground/30" />
              <span className="text-xs opacity-80">जीत ₹{potentialWin(totalAmount)}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[85vh] overflow-hidden border-t border-border/50 flex flex-col">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 pb-3 border-b border-border/30">
                <h3 className="font-display font-bold text-lg text-foreground">🛒 कार्ट ({cart.length})</h3>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.map((item, i) => (
                  <motion.div key={i} layout className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-foreground text-lg w-10">#{String(item.number).padStart(2, "0")}</span>
                      <div>
                        <p className="text-primary text-[11px] font-medium">Win: ₹{potentialWin(item.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartAmount(i, item.amount - minBet)} className="w-7 h-7 rounded-lg bg-card flex items-center justify-center border border-border/50">
                        <Minus className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <span className="font-bold text-foreground text-sm w-14 text-center">₹{item.amount}</span>
                      <button onClick={() => updateCartAmount(i, item.amount + minBet)} className="w-7 h-7 rounded-lg bg-card flex items-center justify-center border border-border/50">
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button onClick={() => removeFromCart(i)} className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="p-4 pt-2 border-t border-border/30 space-y-3">
                <div className="bg-secondary/50 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">कुल बेट्स</span><span className="text-foreground font-medium">{cart.length} नंबर</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">बैलेंस</span><span className={`font-medium ${totalAmount > balance ? "text-destructive" : "text-foreground"}`}>₹{balance.toFixed(0)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-primary">संभावित जीत</span><span className="text-primary font-bold">₹{potentialWin(totalAmount)}</span></div>
                  <div className="border-t border-border/30 pt-1.5 flex justify-between font-bold text-foreground text-sm"><span>कुल राशि</span><span>₹{totalAmount}</span></div>
                </div>
                <button onClick={placeBets} disabled={submitting || bettingClosed || totalAmount > balance} className="w-full gradient-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm shadow-glow-primary disabled:opacity-50">
                  {submitting ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Processing...</span> : `बेट लगाएं — ₹${totalAmount}`}
                </button>
              </div>
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
                  <div className="w-12 h-12 bg-game-green/15 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-game-green" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-foreground">बेट सफल! ✅</h2>
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
                <button onClick={printBill} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> प्रिंट</button>
                <button onClick={() => { setShowBill(false); setCart([]); navigate(`/game/${gameId}`); }} className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">ठीक है ✅</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BettingPage;
