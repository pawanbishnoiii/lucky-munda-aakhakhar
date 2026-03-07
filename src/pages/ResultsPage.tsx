import Header from "@/components/Header";
import ResultsChart from "@/components/ResultsChart";
import { motion } from "framer-motion";

const ResultsPage = () => {
  return (
    <div className="min-h-screen bg-background bg-dots pb-24">
      <Header title="रिज़ल्ट" />
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-3">
        <div className="bg-card rounded-2xl p-4 mb-2 border border-border/50 shadow-sm">
          <h2 className="font-display font-bold text-foreground mb-1">📊 Monthly Result Chart</h2>
          <p className="text-muted-foreground text-xs">महीने के हिसाब से नतीजे देखें, CSV या PNG में डाउनलोड करें</p>
        </div>
      </motion.div>

      <ResultsChart />
    </div>
  );
};

export default ResultsPage;
