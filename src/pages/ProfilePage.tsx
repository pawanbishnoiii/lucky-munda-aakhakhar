import Header from "@/components/Header";
import { motion } from "framer-motion";
import { User, LogIn, Mail, Lock, Eye, EyeOff, ChevronRight, Shield, History, Settings, HelpCircle, LogOut } from "lucide-react";
import { useState } from "react";

const ProfilePage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const isLoggedIn = false; // Will be managed by auth later

  const menuItems = [
    { icon: History, label: "Bet History", desc: "View all your bets" },
    { icon: Shield, label: "Responsible Gaming", desc: "Set limits and controls" },
    { icon: Settings, label: "Settings", desc: "App preferences" },
    { icon: HelpCircle, label: "Help & Support", desc: "Get help anytime" },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title="Account" />
        <div className="px-4 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-1">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isLogin ? "Login to start playing" : "Sign up to get started"}
            </p>

            <div className="space-y-3 text-left">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-secondary text-foreground pl-10 pr-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-secondary text-foreground pl-10 pr-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-secondary text-foreground pl-10 pr-10 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-glow-primary hover:opacity-90 transition-opacity">
                {isLogin ? "Login" : "Sign Up"}
              </button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-muted-foreground text-xs">or continue with</span>
                </div>
              </div>

              <button className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="text-muted-foreground text-xs mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Profile" />
      <div className="px-4 pt-4 space-y-3">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-full glass rounded-xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-foreground font-medium text-sm">{item.label}</p>
                <p className="text-muted-foreground text-xs">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
