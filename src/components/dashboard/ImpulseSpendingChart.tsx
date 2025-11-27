import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Zap } from "lucide-react";

interface ImpulseSpendingChartProps {
  dateRange: { start: string; end: string };
}

export const ImpulseSpendingChart = ({ dateRange }: ImpulseSpendingChartProps) => {
  const { data: expenses } = useQuery({
    queryKey: ["expenses-impulse", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .eq("is_income", false)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);
      return data || [];
    },
  });

  const chartData = () => {
    if (!expenses || expenses.length === 0) return [];

    const impulseTotal = expenses
      .filter((e) => e.is_impulse)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const plannedTotal = expenses
      .filter((e) => !e.is_impulse)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (impulseTotal === 0 && plannedTotal === 0) return [];

    return [
      { name: "Planned", value: plannedTotal, color: "hsl(var(--primary))" },
      { name: "Impulse", value: impulseTotal, color: "hsl(var(--destructive))" },
    ];
  };

  const data = chartData();
  const hasData = data.length > 0;

  const impulsePercent = data.length > 0 && data[1] ? (data[1].value / (data[0].value + data[1].value)) * 100 : 0;

  return (
    <Card className="animate-fade-in shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">Impulse vs Planned</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
          {impulsePercent > 0 ? (
            <>
              <span className={`font-bold text-xl ${impulsePercent > 30 ? "text-destructive" : impulsePercent > 20 ? "text-amber-500" : "text-green-600 dark:text-green-400"}`}>
                {impulsePercent.toFixed(1)}%
              </span>
              <span>impulse spending</span>
              {impulsePercent > 30 && <span className="text-xl">⚠️</span>}
              {impulsePercent <= 10 && <span className="text-xl">✨</span>}
            </>
          ) : (
            <span>Track your impulse purchases</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="hsl(var(--foreground))"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      className="text-sm font-semibold"
                    >
                      {`${name}: ${(percent * 100).toFixed(0)}%`}
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
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
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
          <EmptyState
            icon={Zap}
            title="No spending data"
            description="Mark expenses as impulse purchases to see the breakdown"
          />
        )}
      </CardContent>
    </Card>
  );
};
