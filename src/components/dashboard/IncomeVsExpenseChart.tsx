import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
  const netSavings = totalIncome - totalExpense;

  return (
    <Card className="animate-fade-in shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Income vs Expense Trend</CardTitle>
        <CardDescription>
          Net: <span className={`font-bold ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            ₹{netSavings.toFixed(2)}
          </span>
          {" • "}
          Income: <span className="font-semibold text-green-600 dark:text-green-400">₹{totalIncome.toFixed(2)}</span>
          {" • "}
          Expense: <span className="font-semibold text-destructive">₹{totalExpense.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
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
                formatter={(value: number) => `₹${value.toFixed(2)}`}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "10px" }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={3}
                dot={{ fill: "hsl(142, 76%, 36%)", r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 7 }}
                name="Income"
                animationDuration={800}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--destructive))", r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 7 }}
                name="Expense"
                animationDuration={800}
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
