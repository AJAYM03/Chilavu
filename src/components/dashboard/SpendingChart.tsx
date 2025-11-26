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
    <Card className="animate-fade-in shadow-lg hover:shadow-2xl transition-all duration-300 border-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Spending Breakdown
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-base">
          <span className="text-muted-foreground">Total Spending:</span>
          <span className="text-2xl font-bold text-primary drop-shadow-sm">₹{totalSpending.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <defs>
                {COLORS.map((color, index) => (
                  <filter key={`shadow-${index}`} id={`shadow-${index}`} height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeWidth: 2,
                  strokeDasharray: "3 3",
                }}
                label={({ name, percent, value }) => 
                  `${name}\n₹${value.toFixed(0)}\n(${(percent * 100).toFixed(1)}%)`
                }
                outerRadius={110}
                innerRadius={70}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-90 transition-all duration-200 cursor-pointer drop-shadow-md"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Spent']}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "calc(var(--radius) + 2px)",
                  boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.2)",
                  padding: "12px"
                }}
                labelStyle={{ 
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "4px"
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: "24px",
                  fontSize: "13px"
                }}
                iconType="circle"
                iconSize={12}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[380px] text-muted-foreground gap-3">
            <div className="text-5xl opacity-20">📊</div>
            <p className="font-medium">No expenses in this period</p>
            <p className="text-sm">Start adding expenses to see your breakdown</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};