import { motion } from "framer-motion";
import { Clock, Circle } from "lucide-react";

interface LiveTickerProps {
  text: string;
}

const LiveTicker = ({ text }: LiveTickerProps) => {
  return (
    <div className="mx-4 my-2 glass rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-hidden">
      <span className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-destructive font-bold text-xs uppercase tracking-wider">Live</span>
      </span>
      <motion.div
        animate={{ x: [0, -500] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="text-muted-foreground text-sm whitespace-nowrap"
      >
        {text}
      </motion.div>
    </div>
  );
};

export default LiveTicker;
