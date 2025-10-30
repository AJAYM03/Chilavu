import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {trendData && trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No expenses in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};