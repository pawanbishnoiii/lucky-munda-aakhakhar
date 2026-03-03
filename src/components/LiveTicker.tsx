import { motion } from "framer-motion";

interface LiveTickerProps {
  text: string;
}

const LiveTicker = ({ text }: LiveTickerProps) => {
  return (
    <div className="mx-4 my-2 bg-card rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-hidden border border-border/50 shadow-sm">
      <span className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-destructive font-bold text-xs uppercase tracking-wider">Live</span>
      </span>
      <motion.div
        animate={{ x: [0, -800] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="text-muted-foreground text-sm whitespace-nowrap"
      >
        {text}
      </motion.div>
    </div>
  );
};

export default LiveTicker;
