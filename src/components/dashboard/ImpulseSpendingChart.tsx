import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Impulse vs Planned Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
              />
              <Legend />
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
