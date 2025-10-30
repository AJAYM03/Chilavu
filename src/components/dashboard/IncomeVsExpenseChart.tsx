import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from "date-fns";
import { PeriodType } from "@/pages/Dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingUp } from "lucide-react";

interface IncomeVsExpenseChartProps {
  dateRange: { start: string; end: string };
  period: PeriodType;
}

export const IncomeVsExpenseChart = ({ dateRange, period }: IncomeVsExpenseChartProps) => {
  const { data: expenses } = useQuery({
    queryKey: ["expenses-trend", dateRange],
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

      return {
        date: format(date, period === "daily" ? "MMM dd" : period === "weekly" ? "MMM dd" : "MMM yyyy"),
        income,
        expense,
      };
    });
  };

  const data = chartData();
  const hasData = data.some(d => d.income > 0 || d.expense > 0);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Income vs Expense Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--accent))" }}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))" }}
                name="Expense"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No transaction data"
            description="Start adding income and expenses to see your trends here"
          />
        )}
      </CardContent>
    </Card>
  );
};
