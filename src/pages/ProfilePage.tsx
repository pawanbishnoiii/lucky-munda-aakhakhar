import Header from "@/components/Header";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ChevronRight, Shield, History, HelpCircle, LogOut, Send, Settings, Edit2, Phone, Save } from "lucide-react";
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
  const [editProfile, setEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [selectedBet, setSelectedBet] = useState<any>(null);

  useEffect(() => {
    supabase.from("admin_settings").select("*").eq("key", "telegram_link").maybeSingle()
      .then(({ data }) => { if (data) setTelegramLink(data.value); });
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { setProfile(data); if (data) { setEditName(data.full_name || ""); setEditPhone(data.phone || ""); } });
      supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        .then(({ data }) => setTickets(data || []));
      supabase.from("bets").select("*, games(name, name_hindi, payout_percentage, commission_percentage)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
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

  const handleApple = async () => {
    const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
    if (error) toast({ title: "Apple Login Failed", description: String(error), variant: "destructive" });
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

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ full_name: editName, phone: editPhone }).eq("user_id", user!.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setProfile({ ...profile, full_name: editName, phone: editPhone });
    setEditProfile(false);
    toast({ title: "✅ Profile Updated!" });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background bg-dots pb-24">
        <Header title="Account" />
        <div className="px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 text-center border border-border/50 shadow-sm">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary"><User className="w-8 h-8 text-primary-foreground" /></div>
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
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <button onClick={handleAuth} disabled={submitting} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-glow-primary disabled:opacity-50">{submitting ? "Processing..." : isLogin ? "Login" : "Sign Up"}</button>
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-muted-foreground text-xs">or continue with</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleGoogle} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button onClick={handleApple} className="flex-1 bg-foreground text-background py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Apple
                </button>
              </div>
            </div>
            <p className="text-muted-foreground text-xs mt-4">{isLogin ? "Account नहीं?" : "पहले से Account?"}{" "}<button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold">{isLogin ? "Sign Up" : "Login"}</button></p>
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
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-glow-primary"><User className="w-7 h-7 text-primary-foreground" /></div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-foreground">{profile?.full_name || user.email}</h3>
              <p className="text-muted-foreground text-xs">{user.email}</p>
              {profile?.phone && <p className="text-muted-foreground text-xs">📞 {profile.phone}</p>}
              {isAdmin && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">ADMIN</span>}
            </div>
            <button onClick={() => setEditProfile(!editProfile)} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Edit2 className="w-4 h-4 text-primary" /></button>
          </div>

          {editProfile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2 pt-3 border-t border-border/50">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" className="w-full bg-secondary text-foreground pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone Number" className="w-full bg-secondary text-foreground pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
              </div>
              <button onClick={saveProfile} className="w-full gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Profile</button>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {/* Bet History */}
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => setShowBets(!showBets)} className="w-full bg-card rounded-xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center"><History className="w-4 h-4 text-primary" /></div>
            <div className="text-left"><p className="text-foreground font-medium text-sm">बेट हिस्ट्री</p><p className="text-muted-foreground text-xs">सभी बेट व जीत देखें</p></div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showBets ? "rotate-90" : ""}`} />
        </motion.button>

        {showBets && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-3 space-y-2 border border-border/50">
            {bets.length > 0 ? bets.slice(0, 30).map(b => (
              <button key={b.id} onClick={() => setSelectedBet(b)} className="w-full flex items-center justify-between bg-secondary rounded-lg px-3 py-2 hover:bg-secondary/80 transition-colors text-left">
                <div>
                  <p className="text-foreground text-xs font-medium">{(b as any).games?.name_hindi || (b as any).games?.name}</p>
                  <p className="text-muted-foreground text-[10px]">#{String(b.number).padStart(2, "0")} · {new Date(b.created_at).toLocaleDateString("hi-IN")}</p>
                  <p className="text-muted-foreground text-[9px]">Bet: {b.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-foreground">₹{parseFloat(b.amount).toFixed(0)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.status === "won" ? "bg-game-green/10 text-game-green" : b.status === "lost" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{b.status}</span>
                </div>
              </button>
            )) : <p className="text-muted-foreground text-xs text-center py-4">कोई बेट नहीं</p>}
          </motion.div>
        )}

        {/* Bet Detail Modal */}
        {selectedBet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedBet(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card rounded-2xl p-5 border border-border/50 shadow-lg">
              <div className="text-center mb-4">
                <h2 className="font-display font-bold text-lg text-foreground">Bet Details</h2>
                <div className="border-t border-dashed border-border my-2" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Bet ID:</span><span className="font-mono font-bold text-foreground">{selectedBet.id.slice(0, 12).toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">User:</span><span className="text-foreground">{user.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Game:</span><span className="text-foreground">{(selectedBet as any).games?.name_hindi || (selectedBet as any).games?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Number:</span><span className="font-mono font-bold text-foreground">#{String(selectedBet.number).padStart(2, "0")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="font-bold text-foreground">₹{parseFloat(selectedBet.amount).toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span className="text-foreground">{new Date(selectedBet.created_at).toLocaleString("hi-IN")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className={`font-bold ${selectedBet.status === "won" ? "text-game-green" : selectedBet.status === "lost" ? "text-destructive" : "text-accent"}`}>{selectedBet.status.toUpperCase()}</span></div>
                {selectedBet.status === "won" && selectedBet.payout && (
                  <>
                    <div className="border-t border-dashed border-border my-2" />
                    <div className="flex justify-between bg-game-green/10 rounded-lg px-2 py-1.5"><span className="text-game-green font-bold">Net Winning:</span><span className="text-game-green font-bold">₹{parseFloat(selectedBet.payout).toFixed(0)}</span></div>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedBet(null)} className="w-full gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm mt-4">बंद करें</button>
            </motion.div>
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
              <a href={telegramLink} target="_blank" rel="noreferrer" className="w-full bg-game-blue/10 text-game-blue py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Telegram पर संपर्क करें</a>
            )}
            <button onClick={() => setShowTicket(!showTicket)} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl text-sm font-semibold">🎫 Support Ticket भेजें</button>
            {showTicket && (
              <div className="space-y-2">
                <input placeholder="Subject" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} className="w-full bg-secondary text-foreground px-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground" />
                <textarea placeholder="Message" value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} rows={3} className="w-full bg-secondary text-foreground px-4 py-2.5 rounded-xl text-sm outline-none placeholder:text-muted-foreground resize-none" />
                <button onClick={handleTicketSubmit} className="w-full gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm">Submit Ticket</button>
              </div>
            )}
            {tickets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-foreground font-bold text-xs">Your Tickets</p>
                {tickets.map(t => (
                  <div key={t.id} className="bg-secondary rounded-lg p-2.5">
                    <div className="flex justify-between items-start">
                      <p className="text-foreground text-xs font-medium">{t.subject}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.status === "open" ? "bg-accent/10 text-accent" : "bg-game-green/10 text-game-green"}`}>{t.status}</span>
                    </div>
                    {t.admin_reply && <p className="text-game-green text-[10px] mt-1">↳ {t.admin_reply}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Admin */}
        {isAdmin && (
          <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} onClick={() => navigate("/admin")} className="w-full bg-card rounded-xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent/20 rounded-xl flex items-center justify-center"><Shield className="w-4 h-4 text-accent" /></div>
              <div className="text-left"><p className="text-foreground font-medium text-sm">Admin Dashboard</p><p className="text-muted-foreground text-xs">Manage everything</p></div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}

        {/* Logout */}
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} onClick={signOut} className="w-full bg-destructive/10 rounded-xl p-4 flex items-center gap-3 hover:bg-destructive/20 transition-colors border border-destructive/20">
          <div className="w-9 h-9 bg-destructive/20 rounded-xl flex items-center justify-center"><LogOut className="w-4 h-4 text-destructive" /></div>
          <p className="text-destructive font-medium text-sm">Logout</p>
        </motion.button>
      </div>
    </div>
  );
};

export default ProfilePage;
