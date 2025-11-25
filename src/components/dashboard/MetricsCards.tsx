import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Zap } from "lucide-react";
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

      const expenseCount = expenses.filter((e) => !e.is_income).length;

      // Fix: Calculate days in range for correct "Daily Average"
      const daysInRange = Math.max(1, differenceInDays(new Date(dateRange.end), new Date(dateRange.start)) + 1);
      const avgDailySpend = totalSpent / daysInRange;

      return {
        totalSpent,
        totalIncome,
        netBalance: totalIncome - totalSpent,
        avgDailySpend,
        expenseCount,
        impulseSpending,
      };
    },
  });

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.totalSpent || 0)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.totalIncome || 0)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.netBalance || 0)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Daily Spend</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.avgDailySpend || 0)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Expense Entries</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.expenseCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Impulse Spending</CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics?.impulseSpending || 0)}</div>
        </CardContent>
      </Card>
    </div>
  );
};