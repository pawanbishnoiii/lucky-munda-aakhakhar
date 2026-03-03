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
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/60 px-1 pt-1 pb-[env(safe-area-inset-bottom,8px)] max-w-lg mx-auto shadow-[0_-4px_20px_hsl(var(--foreground)/0.05)]">
        <nav className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomnav"
                    className="absolute inset-0 gradient-primary rounded-2xl opacity-10"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? "gradient-primary shadow-glow-primary" : ""}`}>
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
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
