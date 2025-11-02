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
      <CardHeader>
        <CardTitle>Impulse vs Planned Spending</CardTitle>
        <CardDescription>
          {impulsePercent > 0 && (
            <span className={impulsePercent > 30 ? "text-destructive font-semibold" : "text-muted-foreground"}>
              {impulsePercent.toFixed(1)}% of spending is impulse
              {impulsePercent > 30 && " ⚠️"}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeWidth: 1,
                }}
                label={({ name, percent, value }) => `${name}: ₹${value.toFixed(0)} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
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
          <EmptyState
            icon={Zap}
            title="No spending data"
            description="Mark your expenses as impulse purchases to see the breakdown here"
          />
        )}
      </CardContent>
    </Card>
  );
};
