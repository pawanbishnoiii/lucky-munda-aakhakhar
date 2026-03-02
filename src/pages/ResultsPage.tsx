import Header from "@/components/Header";
import ResultsChart from "@/components/ResultsChart";
import { motion } from "framer-motion";

const ResultsPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Results" />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-3"
      >
        <div className="glass rounded-2xl p-4 mb-4">
          <h2 className="font-display font-bold text-foreground mb-1">📊 Result Chart</h2>
          <p className="text-muted-foreground text-xs">
            View and download results for any game. No login required!
          </p>
        </div>
      </motion.div>

      <ResultsChart />
    </div>
  );
};

export default ResultsPage;
