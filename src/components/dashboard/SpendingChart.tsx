import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SpendingChartProps {
  dateRange: { start: string; end: string };
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

export const SpendingChart = ({ dateRange }: SpendingChartProps) => {
  const { data: chartData } = useQuery({
    queryKey: ["spending-chart", dateRange],
    queryFn: async () => {
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("is_income", false)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);

      if (!expenses) return [];

      const categoryTotals: Record<string, number> = {};
      expenses.forEach((expense) => {
        const category = expense.category_name || "Uncategorized";
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount);
      });

      return Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });

  const totalSpending = chartData?.reduce((sum, item) => sum + item.value, 0) || 0;

  return (
    <Card className="animate-fade-in shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Spending Breakdown</CardTitle>
        <CardDescription>
          Total: <span className="text-lg font-bold text-primary">₹{totalSpending.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeWidth: 1,
                }}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
              />
            </PieChart>
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