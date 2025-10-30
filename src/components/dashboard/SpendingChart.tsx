import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SpendingChartProps {
  dateRange: { start: string; end: string };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ₹${entry.value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
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