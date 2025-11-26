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
    <Card className="animate-fade-in shadow-lg hover:shadow-2xl transition-all duration-300 border-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Impulse vs Planned Spending
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {impulsePercent > 0 ? (
            <>
              <span className={`font-bold text-lg ${impulsePercent > 30 ? "text-destructive" : impulsePercent > 20 ? "text-amber-500" : "text-green-600 dark:text-green-400"}`}>
                {impulsePercent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">of spending is impulse</span>
              {impulsePercent > 30 && <span className="text-xl">⚠️</span>}
              {impulsePercent <= 10 && <span className="text-xl">✨</span>}
            </>
          ) : (
            <span className="text-muted-foreground">Track your impulse purchases</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <defs>
                <filter id="impulseShadow" height="150%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.3"/>
                </filter>
              </defs>
              <Pie
                data={data}
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
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-90 transition-all duration-200 cursor-pointer drop-shadow-lg"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                    filter="url(#impulseShadow)"
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
