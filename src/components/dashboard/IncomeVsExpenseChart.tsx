import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from "date-fns";
import { PeriodType } from "@/pages/Dashboard";
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
        date: format(date, period === "monthly" ? "MMM" : "dd"),
        fullDate: format(date, "MMM dd"),
        income,
        expense,
      };
    });
  };

  const data = chartData();
  const hasData = data.some(d => d.income > 0 || d.expense > 0);

  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-sm">
          <p className="font-medium text-sm text-foreground mb-1">{d.fullDate}</p>
          <p className="text-sm text-accent">Income: ₹{d.income.toFixed(0)}</p>
          <p className="text-sm text-destructive">Expense: ₹{d.expense.toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Income vs Expense</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <span className="text-muted-foreground">₹{totalIncome.toFixed(0)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-destructive"></span>
              <span className="text-muted-foreground">₹{totalExpense.toFixed(0)}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--accent))", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[220px] text-center">
            <div className="p-4 rounded-full bg-muted mb-3">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add income and expenses to see trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
