import { motion } from "framer-motion";
import { Bell, Menu } from "lucide-react";

interface HeaderProps {
  title?: string;
}

const Header = ({ title = "BetKing" }: HeaderProps) => {
  return (
    <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary">
          <span className="text-primary-foreground font-display font-bold text-sm">BK</span>
        </div>
        <h1 className="font-display font-bold text-lg text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
