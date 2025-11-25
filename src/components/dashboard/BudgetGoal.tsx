import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface BudgetGoalProps {
  dateRange: { start: string; end: string };
}

export const BudgetGoal = ({ dateRange }: BudgetGoalProps) => {
  const selectedDate = new Date(dateRange.start);
  const currentMonthYear = format(selectedDate, "yyyy-MM");

  const { data: budgetData } = useQuery({
    queryKey: ["budget-goal", currentMonthYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { budgetAmount: 0, spent: 0 };
      }

      const { data: budget } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("month_year", currentMonthYear)
        .eq("user_id", user.id)
        .maybeSingle();

      // Calculate correct start and end of the selected month
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .eq("is_income", false)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

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
        <CardTitle>Monthly Budget Goal ({format(selectedDate, "MMMM yyyy")})</CardTitle>
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