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
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">Net Balance Trend</CardTitle>
        <CardDescription className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          <span className="flex items-center gap-2">
            <span className="text-sm">Current Balance:</span>
            <span className={`font-bold text-xl ${currentBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              ₹{currentBalance.toFixed(2)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sm">Period Change:</span>
            <span className={`font-bold text-lg ${balanceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {balanceChange >= 0 ? '↗' : '↘'} {balanceChange >= 0 ? '+' : ''}₹{balanceChange.toFixed(2)}
            </span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
                <filter id="balanceShadow" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 13, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 13, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
                tickFormatter={(value) => `₹${value}`}
                dx={-5}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "12px 16px",
                  color: "hsl(var(--popover-foreground))"
                }}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Balance"]}
                labelStyle={{ 
                  fontWeight: 700,
                  fontSize: "14px",
                  marginBottom: "6px",
                  color: "hsl(var(--popover-foreground))"
                }}
                itemStyle={{
                  color: "hsl(var(--popover-foreground))",
                  fontSize: "14px",
                  fontWeight: 600
                }}
              />
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ 
                  value: "Break Even", 
                  position: "insideTopRight", 
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 13,
                  fontWeight: 600
                }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fill="url(#balanceGradient)"
                dot={{ 
                  fill: "hsl(var(--primary))", 
                  r: 5, 
                  strokeWidth: 2, 
                  stroke: "hsl(var(--background))"
                }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                animationDuration={800}
                filter="url(#balanceShadow)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={Wallet}
            title="No balance data"
            description="Your net balance trend will appear as you add transactions"
          />
        )}
      </CardContent>
    </Card>
  );
};
