import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { PeriodType } from "@/pages/Dashboard";

interface SpendingTrendChartProps {
  dateRange: { start: string; end: string };
  period: PeriodType;
}

export const SpendingTrendChart = ({ dateRange, period }: SpendingTrendChartProps) => {
  const { data: trendData } = useQuery({
    queryKey: ["spending-trend", dateRange],
    queryFn: async () => {
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("is_income", false)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date", { ascending: true });

      if (!expenses) return [];

      const dailyTotals: Record<string, number> = {};
      expenses.forEach((expense) => {
        const date = expense.date;
        dailyTotals[date] = (dailyTotals[date] || 0) + Number(expense.amount);
      });

      return Object.entries(dailyTotals).map(([date, amount]) => ({
        date: format(parseISO(date), "MMM dd"),
        amount,
      }));
    },
  });

  const maxAmount = trendData ? Math.max(...trendData.map(d => d.amount)) : 0;
  const avgAmount = trendData ? trendData.reduce((sum, d) => sum + d.amount, 0) / trendData.length : 0;

  return (
    <Card className="animate-fade-in shadow-lg hover:shadow-2xl transition-all duration-300 border-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Daily Spending Trend
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Average:</span>
            <span className="font-bold text-primary text-base">₹{avgAmount.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Peak:</span>
            <span className="font-bold text-destructive text-base">₹{maxAmount.toFixed(2)}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {trendData && trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-gradient-start))" stopOpacity={0.95} />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="hsl(var(--chart-gradient-end))" stopOpacity={0.4} />
                </linearGradient>
                <filter id="barShadow" height="150%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25"/>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="5 5" 
                className="stroke-muted" 
                opacity={0.4}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Spent"]}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "calc(var(--radius) + 2px)",
                  boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.2)",
                  padding: "12px"
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.15, radius: 4 }}
                labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#barGradient)" 
                radius={[10, 10, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
                maxBarSize={60}
                filter="url(#barShadow)"
              >
                {trendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    className="hover:opacity-90 transition-all duration-200 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[380px] text-muted-foreground gap-3">
            <div className="text-5xl opacity-20">📈</div>
            <p className="font-medium">No expenses in this period</p>
            <p className="text-sm">Your daily spending trends will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};