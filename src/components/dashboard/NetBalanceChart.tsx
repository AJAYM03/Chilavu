import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from "date-fns";
import { PeriodType } from "@/pages/Dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet } from "lucide-react";

interface NetBalanceChartProps {
  dateRange: { start: string; end: string };
  period: PeriodType;
}

export const NetBalanceChart = ({ dateRange, period }: NetBalanceChartProps) => {
  const { data: expenses } = useQuery({
    queryKey: ["expenses-balance", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date");
      return data || [];
    },
  });

  const chartData = () => {
    if (!expenses) return [];

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    let intervals: Date[];

    switch (period) {
      case "daily":
        intervals = eachDayOfInterval({ start, end });
        break;
      case "weekly":
        intervals = eachWeekOfInterval({ start, end });
        break;
      case "monthly":
        intervals = eachMonthOfInterval({ start, end });
        break;
    }

    let cumulativeBalance = 0;

    return intervals.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const periodExpenses = expenses.filter((e) => {
        if (period === "daily") return e.date === dateStr;
        if (period === "weekly") return format(startOfWeek(new Date(e.date)), "yyyy-MM-dd") === dateStr;
        if (period === "monthly") return format(startOfMonth(new Date(e.date)), "yyyy-MM-dd") === dateStr;
        return false;
      });

      const income = periodExpenses
        .filter((e) => e.is_income)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const expense = periodExpenses
        .filter((e) => !e.is_income)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      cumulativeBalance += income - expense;

      return {
        date: format(date, period === "daily" ? "MMM dd" : period === "weekly" ? "MMM dd" : "MMM yyyy"),
        balance: cumulativeBalance,
      };
    });
  };

  const data = chartData();
  const hasData = data.some(d => d.balance !== 0);

  const currentBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const startBalance = data.length > 0 ? data[0].balance : 0;
  const balanceChange = currentBalance - startBalance;

  return (
    <Card className="animate-fade-in shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Net Balance Trend</CardTitle>
        <CardDescription>
          Current: <span className={`font-bold text-lg ${currentBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            ₹{currentBalance.toFixed(2)}
          </span>
          {" • "}
          Change: <span className={`font-semibold ${balanceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            {balanceChange >= 0 ? '+' : ''}₹{balanceChange.toFixed(2)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Balance"]}
              />
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: "Break Even", position: "right", fill: "hsl(var(--muted-foreground))" }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fill="url(#balanceGradient)"
                dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={Wallet}
            title="No balance data"
            description="Your net balance trend will appear here as you add transactions"
          />
        )}
      </CardContent>
    </Card>
  );
};
