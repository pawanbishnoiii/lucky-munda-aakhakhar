import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetTime: string; // "HH:MM" format
  label: string;
}

const CountdownTimer = ({ targetTime, label }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calcTimeLeft = () => {
      const now = new Date();
      const [h, m] = targetTime.split(":").map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-muted-foreground text-xs flex items-center gap-1">
        <Clock className="w-3 h-3" /> {label}
      </span>
      <div className="flex gap-1">
        {[
          { val: pad(timeLeft.hours), label: "H" },
          { val: pad(timeLeft.minutes), label: "M" },
          { val: pad(timeLeft.seconds), label: "S" },
        ].map((unit, i) => (
          <div key={i} className="bg-secondary rounded-lg px-2 py-1 text-center min-w-[36px]">
            <motion.span
              key={unit.val}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono font-bold text-foreground text-sm block"
            >
              {unit.val}
            </motion.span>
            <span className="text-muted-foreground text-[8px]">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
