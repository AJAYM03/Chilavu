import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Wallet, Zap } from "lucide-react";
import { differenceInDays } from "date-fns";

interface MetricsCardsProps {
  dateRange: { start: string; end: string };
}

export const MetricsCards = ({ dateRange }: MetricsCardsProps) => {
  const { data: metrics } = useQuery({
    queryKey: ["metrics", dateRange],
    queryFn: async () => {
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);

      if (!expenses) return null;

      const totalSpent = expenses
        .filter((e) => !e.is_income)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalIncome = expenses
        .filter((e) => e.is_income)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const impulseSpending = expenses
        .filter((e) => !e.is_income && e.is_impulse)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const daysInRange = Math.max(1, differenceInDays(new Date(dateRange.end), new Date(dateRange.start)) + 1);
      const avgDailySpend = totalSpent / daysInRange;

      return {
        totalSpent,
        totalIncome,
        netBalance: totalIncome - totalSpent,
        avgDailySpend,
        impulseSpending,
        impulsePercent: totalSpent > 0 ? (impulseSpending / totalSpent) * 100 : 0,
      };
    },
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  const netBalance = metrics?.netBalance || 0;
  const isPositive = netBalance >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Net Balance - Primary metric */}
      <Card className="col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Net Balance</p>
              <p className={`text-3xl sm:text-4xl font-bold tracking-tight ${isPositive ? 'text-accent' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{formatCurrency(netBalance)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPositive ? "You're saving money" : "Spending more than earning"}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${isPositive ? 'bg-accent/10' : 'bg-destructive/10'}`}>
              <Wallet className={`h-5 w-5 ${isPositive ? 'text-accent' : 'text-destructive'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Income */}
      <Card className="border-accent/20 hover:border-accent/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-1">Income</p>
          <p className="text-xl sm:text-2xl font-bold text-accent">
            {formatCurrency(metrics?.totalIncome || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card className="border-destructive/20 hover:border-destructive/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-1">Spent</p>
          <p className="text-xl sm:text-2xl font-bold text-destructive">
            {formatCurrency(metrics?.totalSpent || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Daily Average - Secondary */}
      <Card className="hover:bg-muted/30 transition-colors">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Daily Average</p>
          <p className="text-lg sm:text-xl font-semibold text-foreground">
            {formatCurrency(metrics?.avgDailySpend || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">per day</p>
        </CardContent>
      </Card>

      {/* Impulse Spending - With visual indicator */}
      <Card className={`hover:bg-muted/30 transition-colors ${(metrics?.impulsePercent || 0) > 30 ? 'border-warning/40' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium">Impulse</p>
            {(metrics?.impulsePercent || 0) > 30 && (
              <Zap className="h-3.5 w-3.5 text-warning" />
            )}
          </div>
          <p className="text-lg sm:text-xl font-semibold text-foreground">
            {formatCurrency(metrics?.impulseSpending || 0)}
          </p>
          <p className={`text-xs mt-1 ${(metrics?.impulsePercent || 0) > 30 ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
            {(metrics?.impulsePercent || 0).toFixed(0)}% of spending
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
