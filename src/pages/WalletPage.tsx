import Header from "@/components/Header";
import { motion } from "framer-motion";
import { Plus, ArrowDownLeft, ArrowUpRight, Clock, IndianRupee, CreditCard, Building2, QrCode } from "lucide-react";
import { useState } from "react";

const transactions = [
  { type: "deposit", amount: 500, status: "approved", date: "2 Mar, 12:30 PM", method: "UPI" },
  { type: "bet", amount: -100, status: "completed", date: "2 Mar, 11:00 AM", method: "New Gali" },
  { type: "win", amount: 930, status: "credited", date: "1 Mar, 05:15 PM", method: "Desawar" },
  { type: "withdraw", amount: -500, status: "pending", date: "1 Mar, 03:00 PM", method: "Bank Transfer" },
];

const WalletPage = () => {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Wallet" />

      {/* Balance Card */}
      <div className="px-4 pt-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gradient-primary rounded-2xl p-5 shadow-glow-primary relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-foreground/5" />
          <p className="text-primary-foreground/70 text-sm">Total Balance</p>
          <h2 className="font-display font-bold text-3xl text-primary-foreground mt-1">₹0.00</h2>
          <div className="flex gap-3 mt-4">
            <button className="bg-foreground/20 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-foreground/30 transition-colors">
              <Plus className="w-4 h-4" /> Add Money
            </button>
            <button className="bg-foreground/10 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-foreground/20 transition-colors">
              <ArrowUpRight className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </motion.div>
      </div>

      {/* Deposit/Withdraw Tabs */}
      <div className="px-4 mt-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex gap-2 mb-4">
            {(["deposit", "withdraw"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "deposit" ? (
            <div>
              <p className="text-muted-foreground text-xs mb-3">Send payment to:</p>
              <div className="bg-secondary rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-semibold text-sm">UPI: admin@upi</span>
                </div>
                <p className="text-muted-foreground text-xs">After payment, enter UTR & upload screenshot</p>
              </div>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="UTR Number"
                  className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground"
                />
                <button className="w-full bg-secondary text-muted-foreground px-4 py-3 rounded-xl text-sm border-2 border-dashed border-border hover:border-primary transition-colors">
                  📎 Upload Payment Screenshot
                </button>
                <button className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-glow-primary">
                  Submit Deposit Request
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Withdraw Amount (₹)"
                  className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground"
                />
                <select className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none">
                  <option value="">Select Method</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </select>
                <input
                  type="text"
                  placeholder="UPI ID / Account Number"
                  className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl text-sm outline-none placeholder:text-muted-foreground"
                />
                <button className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm shadow-glow-primary">
                  Submit Withdraw Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="px-4 mt-4">
        <h3 className="font-display font-bold text-foreground mb-3">Transaction History</h3>
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  tx.type === "deposit" || tx.type === "win" ? "bg-game-green/10" : "bg-destructive/10"
                }`}>
                  {tx.type === "deposit" || tx.type === "win" ? (
                    <ArrowDownLeft className="w-4 h-4 text-game-green" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm capitalize">{tx.type}</p>
                  <p className="text-muted-foreground text-xs">{tx.method} · {tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-bold text-sm ${
                  tx.amount > 0 ? "text-game-green" : "text-destructive"
                }`}>
                  {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount)}
                </p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  tx.status === "pending" ? "bg-accent/10 text-accent" :
                  tx.status === "approved" || tx.status === "credited" ? "bg-game-green/10 text-game-green" :
                  "bg-primary/10 text-primary"
                }`}>
                  {tx.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
