import { motion } from "framer-motion";

type GameColor = "red" | "blue" | "green" | "purple" | "orange" | "cyan";

interface GameCardProps {
  title: string;
  subtitle: string;
  nextResult: string;
  multiplier: string;
  color: GameColor;
  status: "live" | "upcoming" | "closed";
  onPlay?: () => void;
}

const colorMap: Record<GameColor, string> = {
  red: "gradient-red",
  blue: "gradient-blue",
  green: "gradient-green",
  purple: "gradient-purple",
  orange: "bg-game-orange",
  cyan: "bg-game-cyan",
};

const GameCard = ({ title, subtitle, nextResult, multiplier, color, status, onPlay }: GameCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${colorMap[color]} rounded-2xl p-5 relative overflow-hidden cursor-pointer`}
      onClick={onPlay}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-foreground/5" />
      <div className="absolute -right-2 bottom-4 w-12 h-12 rounded-full bg-foreground/5" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-display font-bold text-primary-foreground">{title}</h3>
            <p className="text-primary-foreground/70 text-sm">{subtitle}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status === "live" ? "bg-foreground/20 text-primary-foreground" : "bg-foreground/10 text-primary-foreground/80"}`}>
            {status === "live" && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
            {status === "live" ? "🔴 LIVE" : status === "upcoming" ? "🕐 आने वाला" : "बंद"}
          </span>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="bg-foreground/10 rounded-xl px-4 py-2.5 flex-1">
            <p className="text-primary-foreground/60 text-xs flex items-center gap-1">⏰ नतीजा</p>
            <p className="text-primary-foreground font-display font-bold text-lg">{nextResult}</p>
          </div>
          <div className="bg-foreground/10 rounded-xl px-4 py-2.5 flex-1">
            <p className="text-primary-foreground/60 text-xs flex items-center gap-1">📈 Payout</p>
            <p className="text-primary-foreground font-display font-bold text-lg">{multiplier}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onPlay} className="bg-foreground/20 hover:bg-foreground/30 text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold transition-all">
            अभी खेलें →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;
