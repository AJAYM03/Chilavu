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
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">Income vs Expense</CardTitle>
        <CardDescription className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          <span className="flex items-center gap-2">
            <span className="text-sm">Net Savings:</span>
            <span className={`font-bold text-xl ${netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {netSavings >= 0 ? '+' : ''}₹{netSavings.toFixed(2)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-600 dark:bg-green-400"></span>
            <span className="font-bold text-foreground">₹{totalIncome.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-destructive"></span>
            <span className="font-bold text-foreground">₹{totalExpense.toFixed(2)}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <filter id="lineShadow" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
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
                formatter={(value: number, name: string) => [`₹${value.toFixed(2)}`, name === "income" ? "Income" : "Expense"]}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "12px 16px",
                  color: "hsl(var(--popover-foreground))"
                }}
                labelStyle={{ 
                  fontWeight: 700,
                  fontSize: "14px",
                  marginBottom: "6px",
                  color: "hsl(var(--popover-foreground))"
                }}
                itemStyle={{
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "4px 0"
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "24px", fontSize: "14px" }}
                iconType="line"
                formatter={(value) => <span className="text-foreground font-medium capitalize">{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={3}
                dot={{ 
                  fill: "hsl(142, 76%, 36%)", 
                  r: 5, 
                  strokeWidth: 2, 
                  stroke: "hsl(var(--background))"
                }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                name="Income"
                animationDuration={800}
                filter="url(#lineShadow)"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={3}
                dot={{ 
                  fill: "hsl(var(--destructive))", 
                  r: 5, 
                  strokeWidth: 2, 
                  stroke: "hsl(var(--background))"
                }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                name="Expense"
                animationDuration={800}
                filter="url(#lineShadow)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No transaction data"
            description="Add income and expenses to see your trends here"
          />
        )}
      </CardContent>
    </Card>
  );
};
