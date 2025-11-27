import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { Target } from "lucide-react";

interface CategoryBudgetChartProps {
  dateRange: { start: string; end: string };
}

export const CategoryBudgetChart = ({ dateRange }: CategoryBudgetChartProps) => {
  const currentMonthYear = format(new Date(dateRange.start), "yyyy-MM");

  const { data: categoryBudgets } = useQuery({
    queryKey: ["category-budgets-chart", currentMonthYear],
    queryFn: async () => {
      const { data } = await supabase
        .from("category_budgets")
        .select("*")
        .eq("month_year", currentMonthYear);
      return data || [];
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses-by-category", dateRange],
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

  const budgetData = () => {
    if (!categoryBudgets || !expenses) return [];

    return categoryBudgets.map((budget) => {
      const spent = expenses
        .filter((e) => e.category_name === budget.category_name)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const percentage = (spent / Number(budget.budget_amount)) * 100;

      return {
        category: budget.category_name,
        spent,
        budget: Number(budget.budget_amount),
        percentage: Math.min(percentage, 100),
        isOver: spent > Number(budget.budget_amount),
      };
    });
  };

  const data = budgetData();
  const hasData = data.length > 0;

  return (
    <Card className="animate-fade-in shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Budget Progress</CardTitle>
        <CardDescription>Track spending against your budgets</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-5">
            {data.map((item, index) => (
              <div 
                key={item.category} 
                className="space-y-3 p-5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors animate-fade-in border border-border/50"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-base text-foreground">{item.category}</span>
                  <span className={`text-sm font-bold whitespace-nowrap ${item.isOver ? "text-destructive" : "text-foreground"}`}>
                    ₹{item.spent.toFixed(2)} / ₹{item.budget.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className={item.percentage > 80 ? "text-foreground font-bold" : "text-muted-foreground"}>
                      {item.percentage.toFixed(1)}% used
                    </span>
                    <span className="text-muted-foreground">
                      ₹{Math.max(0, item.budget - item.spent).toFixed(2)} left
                    </span>
                  </div>
                  <Progress 
                    value={item.percentage} 
                    className={`h-3.5 ${
                      item.isOver 
                        ? "[&>div]:bg-destructive" 
                        : item.percentage > 80 
                        ? "[&>div]:bg-amber-500" 
                        : "[&>div]:bg-primary"
                    }`}
                  />
                </div>
                {item.isOver && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive bg-destructive/15 p-3 rounded-md">
                    <span>⚠️ Over budget by ₹{(item.spent - item.budget).toFixed(2)}</span>
                  </div>
                )}
                {!item.isOver && item.percentage > 90 && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 p-3 rounded-md">
                    <span>⚡ Approaching limit - {(100 - item.percentage).toFixed(0)}% remaining</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="No budgets set"
            description="Set category budgets in Settings to track your spending progress"
          />
        )}
      </CardContent>
    </Card>
  );
};
