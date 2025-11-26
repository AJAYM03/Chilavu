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
    <Card className="animate-fade-in shadow-lg hover:shadow-2xl transition-all duration-300 border-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Income vs Expense Trend
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Net:</span>
            <span className={`font-bold text-lg ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {netSavings >= 0 ? '+' : ''}₹{netSavings.toFixed(2)}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-green-600 dark:bg-green-400"></span>
            <span className="text-muted-foreground">Income:</span>
            <span className="font-bold text-green-600 dark:text-green-400">₹{totalIncome.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-destructive"></span>
            <span className="text-muted-foreground">Expense:</span>
            <span className="font-bold text-destructive">₹{totalExpense.toFixed(2)}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
                </linearGradient>
                <filter id="lineShadow" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
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
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "calc(var(--radius) + 2px)",
                  boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.2)",
                  padding: "12px"
                }}
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                labelStyle={{ fontWeight: 600, marginBottom: "4px" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "16px" }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={4}
                dot={{ 
                  fill: "hsl(142, 76%, 36%)", 
                  r: 6, 
                  strokeWidth: 3, 
                  stroke: "hsl(var(--background))",
                  filter: "url(#lineShadow)"
                }}
                activeDot={{ r: 8, strokeWidth: 3 }}
                name="Income"
                animationDuration={1200}
                animationEasing="ease-in-out"
                filter="url(#lineShadow)"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={4}
                dot={{ 
                  fill: "hsl(var(--destructive))", 
                  r: 6, 
                  strokeWidth: 3, 
                  stroke: "hsl(var(--background))",
                  filter: "url(#lineShadow)"
                }}
                activeDot={{ r: 8, strokeWidth: 3 }}
                name="Expense"
                animationDuration={1200}
                animationEasing="ease-in-out"
                filter="url(#lineShadow)"
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
