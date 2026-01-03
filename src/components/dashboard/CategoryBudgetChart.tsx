import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Target, AlertCircle, CheckCircle } from "lucide-react";

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
      const remaining = Math.max(0, Number(budget.budget_amount) - spent);

      return {
        category: budget.category_name,
        spent,
        budget: Number(budget.budget_amount),
        remaining,
        percentage: Math.min(percentage, 100),
        actualPercentage: percentage,
        isOver: spent > Number(budget.budget_amount),
        isClose: percentage > 80 && percentage <= 100,
      };
    });
  };

  const data = budgetData();
  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Budget progress</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {item.isOver ? (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    ) : item.isClose ? (
                      <AlertCircle className="h-3.5 w-3.5 text-warning" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 text-accent" />
                    )}
                    <span className="font-medium text-foreground">{item.category}</span>
                  </div>
                  <span className={`text-xs ${item.isOver ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    ₹{item.spent.toFixed(0)} / ₹{item.budget.toFixed(0)}
                  </span>
                </div>
                <Progress 
                  value={item.percentage} 
                  className={`h-2 ${
                    item.isOver 
                      ? "[&>div]:bg-destructive" 
                      : item.isClose 
                      ? "[&>div]:bg-warning" 
                      : "[&>div]:bg-primary"
                  }`}
                />
                {item.isOver ? (
                  <p className="text-xs text-destructive">
                    Over by ₹{(item.spent - item.budget).toFixed(0)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    ₹{item.remaining.toFixed(0)} left
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <div className="p-4 rounded-full bg-muted mb-3">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No budgets set</p>
            <p className="text-sm text-muted-foreground mt-1">
              Set category budgets in Settings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
