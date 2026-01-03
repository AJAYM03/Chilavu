import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { PeriodType } from "@/pages/Dashboard";
import { BarChart3 } from "lucide-react";

interface SpendingTrendChartProps {
  dateRange: { start: string; end: string };
  period: PeriodType;
}

export const SpendingTrendChart = ({ dateRange }: SpendingTrendChartProps) => {
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
        date: format(parseISO(date), "dd"),
        fullDate: format(parseISO(date), "MMM dd"),
        amount,
      }));
    },
  });

  const avgAmount = trendData && trendData.length > 0 
    ? trendData.reduce((sum, d) => sum + d.amount, 0) / trendData.length 
    : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-sm">
          <p className="font-medium text-sm text-foreground">{data.fullDate}</p>
          <p className="text-sm text-muted-foreground">₹{data.amount.toFixed(0)} spent</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Daily spending</CardTitle>
          <span className="text-sm text-muted-foreground">
            Avg: <span className="font-medium text-foreground">₹{avgAmount.toFixed(0)}</span>/day
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {trendData && trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[220px] text-center">
            <div className="p-4 rounded-full bg-muted mb-3">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No spending data</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your daily trends will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
