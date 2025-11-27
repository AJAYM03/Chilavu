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
    <Card className="animate-fade-in shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">Daily Spending Trend</CardTitle>
        <CardDescription className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          <span className="flex items-center gap-2">
            <span className="text-sm">Daily Average:</span>
            <span className="font-bold text-foreground text-lg">₹{avgAmount.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sm">Peak Day:</span>
            <span className="font-bold text-foreground text-lg">₹{maxAmount.toFixed(2)}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {trendData && trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={trendData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
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
                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Spent"]}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "12px 16px",
                  color: "hsl(var(--popover-foreground))"
                }}
                cursor={{ fill: "hsl(var(--accent))", opacity: 0.1 }}
                labelStyle={{ 
                  fontWeight: 700, 
                  marginBottom: "6px",
                  fontSize: "14px",
                  color: "hsl(var(--popover-foreground))"
                }}
                itemStyle={{
                  color: "hsl(var(--popover-foreground))",
                  fontSize: "14px",
                  fontWeight: 600
                }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#barGradient)" 
                radius={[8, 8, 0, 0]}
                animationDuration={800}
                maxBarSize={50}
              >
                {trendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-4">
            <div className="text-6xl opacity-30">📈</div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg text-foreground">No spending data</p>
              <p className="text-sm">Your daily spending trends will appear here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};