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
  "hsl(var(--chart-6))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
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
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">Spending Breakdown</CardTitle>
        <CardDescription className="flex items-center gap-2 text-base pt-1">
          <span>Total Spending:</span>
          <span className="text-2xl font-bold text-foreground">₹{totalSpending.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  if (percent < 0.05) return null;

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="hsl(var(--foreground))"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      className="text-sm font-semibold"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                outerRadius={120}
                innerRadius={75}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                    strokeWidth={3}
                    stroke="hsl(var(--background))"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [`₹${value.toFixed(2)}`, name]}
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
                  fontSize: "15px",
                  marginBottom: "6px",
                  color: "hsl(var(--popover-foreground))"
                }}
                itemStyle={{
                  color: "hsl(var(--popover-foreground))",
                  fontSize: "14px",
                  padding: "4px 0"
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: "28px",
                  fontSize: "14px"
                }}
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span className="text-foreground font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-4">
            <div className="text-6xl opacity-30">📊</div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg text-foreground">No expenses yet</p>
              <p className="text-sm">Add your first expense to see the breakdown</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};