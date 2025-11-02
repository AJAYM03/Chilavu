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
      <CardHeader>
        <CardTitle>Daily Spending Trend</CardTitle>
        <CardDescription>
          Average: <span className="font-semibold text-primary">₹{avgAmount.toFixed(2)}</span>
          {" • "}
          Peak: <span className="font-semibold text-destructive">₹{maxAmount.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trendData && trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
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
                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Amount"]}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#barGradient)" 
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              >
                {trendData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            No expenses in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};