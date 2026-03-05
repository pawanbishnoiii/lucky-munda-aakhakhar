import { Home, Gamepad2, Wallet, User, BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "होम", path: "/" },
  { icon: Gamepad2, label: "गेम्स", path: "/games" },
  { icon: BarChart3, label: "रिज़ल्ट", path: "/results" },
  { icon: Wallet, label: "वॉलेट", path: "/wallet" },
  { icon: User, label: "प्रोफ़ाइल", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/bet/")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-card/98 backdrop-blur-2xl border-t border-border/40 max-w-lg mx-auto shadow-[0_-8px_30px_hsl(var(--foreground)/0.08)]">
        <nav className="flex justify-around items-center px-2 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all group"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-indicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 gradient-primary rounded-full"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                  />
                )}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? "gradient-primary shadow-glow-primary scale-105" : "group-hover:bg-secondary"}`}>
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
