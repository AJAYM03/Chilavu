import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

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
        const category = expense.category_name || "Other";
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount);
      });

      return Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    },
  });

  const totalSpending = chartData?.reduce((sum, item) => sum + item.value, 0) || 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / totalSpending) * 100).toFixed(0);
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-sm">
          <p className="font-medium text-sm text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            ₹{data.value.toFixed(0)} · {percent}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Where money goes</CardTitle>
          <span className="text-lg font-bold text-foreground">₹{totalSpending.toFixed(0)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {chartData && chartData.length > 0 ? (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={55}
                  dataKey="value"
                  paddingAngle={2}
                  animationDuration={500}
                >
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Simple legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full max-w-xs">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[260px] text-center">
            <div className="p-4 rounded-full bg-muted mb-3">
              <PieChartIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No expenses yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add expenses to see your breakdown
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
