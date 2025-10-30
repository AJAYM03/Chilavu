import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const BudgetGoal = () => {
  const currentMonthYear = format(new Date(), "yyyy-MM");

  const { data: budgetData } = useQuery({
    queryKey: ["budget-goal", currentMonthYear],
    queryFn: async () => {
      const { data: budget } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("month_year", currentMonthYear)
        .maybeSingle();

      const startOfMonth = format(new Date(), "yyyy-MM-01");
      const endOfMonth = format(new Date(), "yyyy-MM-31");

      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("is_income", false)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      const totalSpent = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      return {
        budgetAmount: budget?.amount || 0,
        spent: totalSpent,
      };
    },
  });

  const percentage = budgetData?.budgetAmount
    ? (budgetData.spent / budgetData.budgetAmount) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Spent: ₹{budgetData?.spent.toFixed(2) || 0}</span>
          <span>Budget: ₹{budgetData?.budgetAmount.toFixed(2) || 0}</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {percentage.toFixed(1)}% of monthly budget used
        </p>
      </CardContent>
    </Card>
  );
};