import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface BudgetGoalProps {
  dateRange: { start: string; end: string };
}

export const BudgetGoal = ({ dateRange }: BudgetGoalProps) => {
  // Use parseISO to avoid timezone issues ("2024-11-01" → interpreted correctly in local time)
  const selectedDate = parseISO(dateRange.start);

  // Format key for DB (matches "2024-11")
  const currentMonthYear = format(selectedDate, "yyyy-MM");

  const { data: budgetData = { budgetAmount: 0, spent: 0 } } = useQuery({
    queryKey: ["budget-goal", currentMonthYear],

    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { budgetAmount: 0, spent: 0 };

      // Fetch monthly budget goal
      const { data: budget } = await supabase
        .from("budget_goals")
        .select("amount")
        .eq("month_year", currentMonthYear)
        .eq("user_id", user.id)
        .maybeSingle();

      // Month boundaries
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      // Fetch expenses within this month
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .eq("is_income", false)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

      const totalSpent = expenses?.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      ) || 0;

      return {
        budgetAmount: budget?.amount || 0,
        spent: totalSpent,
      };
    },
  });

  const percentage = budgetData.budgetAmount
    ? Math.min((budgetData.spent / budgetData.budgetAmount) * 100, 100)
    : 0;

  const displayPercentage = budgetData.budgetAmount
    ? (budgetData.spent / budgetData.budgetAmount) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Monthly Budget Goal ({format(selectedDate, "MMMM yyyy")})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Spent: ₹{budgetData.spent.toFixed(2)}</span>
          <span>Budget: ₹{budgetData.budgetAmount.toFixed(2)}</span>
        </div>

        <Progress value={percentage} className="h-2" />

        <p className="text-xs text-muted-foreground text-center">
          {displayPercentage.toFixed(1)}% of monthly budget used
        </p>
      </CardContent>
    </Card>
  );
};
