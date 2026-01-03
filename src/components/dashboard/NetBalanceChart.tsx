import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from "date-fns";
import { PeriodType } from "@/pages/Dashboard";
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
        date: format(date, period === "monthly" ? "MMM" : "dd"),
        fullDate: format(date, "MMM dd"),
        balance: cumulativeBalance,
      };
    });
  };

  const data = chartData();
  const hasData = data.some(d => d.balance !== 0);
  const currentBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const isPositive = currentBalance >= 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const positive = d.balance >= 0;
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-sm">
          <p className="font-medium text-sm text-foreground">{d.fullDate}</p>
          <p className={`text-sm ${positive ? 'text-accent' : 'text-destructive'}`}>
            Balance: {positive ? '+' : ''}₹{d.balance.toFixed(0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Balance trend</CardTitle>
          <span className={`text-lg font-bold ${isPositive ? 'text-accent' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}₹{currentBalance.toFixed(0)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#balanceGradient)"
                dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[220px] text-center">
            <div className="p-4 rounded-full bg-muted mb-3">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No balance data</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your balance trend will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
