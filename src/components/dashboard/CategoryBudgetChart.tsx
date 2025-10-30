import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const currentMonthYear = format(new Date(), "yyyy-MM");

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
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Category Budget Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            {data.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.category}</span>
                  <span className={`text-sm ${item.isOver ? "text-destructive" : "text-muted-foreground"}`}>
                    ₹{item.spent.toFixed(2)} / ₹{item.budget.toFixed(2)}
                  </span>
                </div>
                <Progress 
                  value={item.percentage} 
                  className={item.isOver ? "[&>div]:bg-destructive" : ""}
                />
                {item.isOver && (
                  <p className="text-xs text-destructive">
                    Over budget by ₹{(item.spent - item.budget).toFixed(2)}
                  </p>
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
