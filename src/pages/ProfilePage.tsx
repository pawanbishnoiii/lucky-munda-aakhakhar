import Header from "@/components/Header";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ChevronRight, Shield, History, HelpCircle, LogOut, Send, Ticket, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, loading, signIn, signUp, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [telegramLink, setTelegramLink] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [bets, setBets] = useState<any[]>([]);
  const [showBets, setShowBets] = useState(false);

  useEffect(() => {
    supabase.from("admin_settings").select("*").eq("key", "telegram_link").maybeSingle()
      .then(({ data }) => { if (data) setTelegramLink(data.value); });
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => setProfile(data));
      supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        .then(({ data }) => setTickets(data || []));
      supabase.from("bets").select("*, games(name, name_hindi)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
        .then(({ data }) => setBets(data || []));
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password) { toast({ title: "कृपया सभी फ़ील्ड भरें", variant: "destructive" }); return; }
    setSubmitting(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } else {
      if (!fullName) { toast({ title: "नाम ज़रूरी है", variant: "destructive" }); setSubmitting(false); return; }
      const { error } = await signUp(email, password, fullName);
      if (error) toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
      else toast({ title: "✅ Account Created!", description: "Please check your email to verify." });
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) toast({ title: "Google Login Failed", description: String(error), variant: "destructive" });
  };

  const handleTicketSubmit = async () => {
    if (!ticketSubject || !ticketMessage) return;
    const { error } = await supabase.from("support_tickets").insert({ user_id: user!.id, subject: ticketSubject, message: ticketMessage });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Ticket Submitted!" });
    setTicketSubject(""); setTicketMessage(""); setShowTicket(false);
    const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setTickets(data || []);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background bg-dots pb-24">
        <Header title="Account" />
        <div className="px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 text-center border border-border/50 shadow-sm">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-1">{isLogin ? "Welcome Back" : "Account बनाएं"}</h2>
            <p className="text-muted-foreground text-sm mb-6">{isLogin ? "Login करें खेलने के लिए" : "Sign up करें शुरू करने के लिए"}</p>

            <div className="space-y-3 text-left">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="पूरा नाम" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-secondary text-foreground pl-10 pr-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-secondary text-foreground pl-10 pr-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-secondary text-foreground pl-10 pr-10 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50" onKeyDown={(e) => e.key === "Enter" && handleAuth()} />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={handleAuth} disabled={submitting} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-glow-primary hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? "Processing..." : isLogin ? "Login" : "Sign Up"}
              </button>
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-muted-foreground text-xs">or continue with</span></div>
              </div>
              <button onClick={handleGoogle} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google से Login करें
              </button>
            </div>
            <p className="text-muted-foreground text-xs mt-4">
              {isLogin ? "Account नहीं है?" : "पहले से Account है?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold">{isLogin ? "Sign Up" : "Login"}</button>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dots pb-24">
      <Header title="प्रोफ़ाइल" />

      <div className="px-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-glow-primary">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-foreground">{profile?.full_name || user.email}</h3>
              <p className="text-muted-foreground text-xs">{user.email}</p>
              {isAdmin && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">ADMIN</span>}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {/* Bet History */}
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => setShowBets(!showBets)} className="w-full bg-card rounded-xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center"><History className="w-4 h-4 text-primary" /></div>
            <div className="text-left"><p className="text-foreground font-medium text-sm">बेट हिस्ट्री</p><p className="text-muted-foreground text-xs">अपनी सभी बेट देखें</p></div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showBets ? "rotate-90" : ""}`} />
        </motion.button>

        {showBets && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-3 space-y-2 border border-border/50">
            {bets.length > 0 ? bets.slice(0, 20).map(b => (
              <div key={b.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                <div>
                  <p className="text-foreground text-xs font-medium">{(b as any).games?.name_hindi || (b as any).games?.name}</p>
                  <p className="text-muted-foreground text-[10px]">{b.bet_type === "munda" ? "मुंडा" : "आखर"} #{b.number} · {new Date(b.created_at).toLocaleDateString("hi-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-foreground">₹{parseFloat(b.amount).toFixed(0)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.status === "won" ? "bg-game-green/10 text-game-green" : b.status === "lost" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{b.status}</span>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-xs text-center py-4">कोई बेट नहीं</p>}
          </motion.div>
        )}

        {/* Help */}
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} onClick={() => setShowHelp(!showHelp)} className="w-full bg-card rounded-xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center"><HelpCircle className="w-4 h-4 text-primary" /></div>
            <div className="text-left"><p className="text-foreground font-medium text-sm">Help & Support</p><p className="text-muted-foreground text-xs">कभी भी मदद लें</p></div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showHelp ? "rotate-90" : ""}`} />
        </motion.button>

        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 space-y-3 border border-border/50">
            {telegramLink && (
              <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-secondary rounded-xl p-3 hover:bg-secondary/80 transition-colors">
                <Send className="w-4 h-4 text-game-blue" />
                <div><p className="text-foreground text-sm font-medium">Telegram पर संपर्क करें</p><p className="text-muted-foreground text-xs">तुरंत सहायता प्राप्त करें</p></div>
              </a>
            )}
            <button onClick={() => setShowTicket(!showTicket)} className="flex items-center gap-3 bg-secondary rounded-xl p-3 w-full hover:bg-secondary/80 transition-colors">
              <Ticket className="w-4 h-4 text-accent" />
              <div className="text-left"><p className="text-foreground text-sm font-medium">Report / Ticket भेजें</p><p className="text-muted-foreground text-xs">समस्या की रिपोर्ट करें</p></div>
            </button>
            {showTicket && (
              <div className="space-y-2 pt-2">
                <input type="text" placeholder="विषय" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <textarea placeholder="अपनी समस्या बताएं..." value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} rows={3} className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground resize-none" />
                <button onClick={handleTicketSubmit} className="w-full gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm">Submit Ticket</button>
              </div>
            )}
            {tickets.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-muted-foreground text-xs font-semibold">आपकी Tickets:</p>
                {tickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="bg-secondary rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-foreground text-sm font-medium">{t.subject}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.status === "open" ? "bg-accent/10 text-accent" : "bg-game-green/10 text-game-green"}`}>{t.status}</span>
                    </div>
                    {t.admin_reply && <p className="text-game-green text-xs mt-1">Admin: {t.admin_reply}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Admin */}
        {isAdmin && (
          <motion.button onClick={() => navigate("/admin")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-card rounded-xl p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border border-border/50">
            <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center"><Settings className="w-4 h-4 text-accent" /></div>
            <div className="text-left"><p className="text-foreground font-medium text-sm">Admin Dashboard</p><p className="text-muted-foreground text-xs">Manage everything</p></div>
          </motion.button>
        )}

        {/* Logout */}
        <button onClick={signOut} className="w-full bg-card rounded-xl p-4 flex items-center gap-3 hover:bg-destructive/5 transition-colors border border-border/50">
          <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center"><LogOut className="w-4 h-4 text-destructive" /></div>
          <p className="text-destructive font-medium text-sm">Logout</p>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
