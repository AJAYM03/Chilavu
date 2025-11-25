import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

interface BudgetGoalProps {
  dateRange: { start: string; end: string };
}

export const BudgetGoal = ({ dateRange }: BudgetGoalProps) => {
  // FIX: Use parseISO to strictly interpret the date string as local time.
  // 'new Date("2024-11-01")' defaults to UTC, which can shift to 'Oct 31' in many timezones.
  // This shift causes the app to fetch data for the previous month instead of the current one.
  const selectedDate = parseISO(dateRange.start);
  
  // Format as "yyyy-MM" to match the database column for budget goals
  const currentMonthYear = format(selectedDate, "yyyy-MM");

  const { data: budgetData } = useQuery({
    queryKey: ["budget-goal", currentMonthYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { budgetAmount: 0, spent: 0 };
      }

      // 1. Fetch the budget goal for the CORRECTLY identified month
      const { data: budget } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("month_year", currentMonthYear)
        .eq("user_id", user.id)
        .maybeSingle();

      // 2. Calculate the exact start and end of the selected month
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      // 3. Fetch expenses specifically for this calculated month range
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

  // Calculate percentage for the progress bar (clamped at 100%)
  const percentage = budgetData?.budgetAmount
    ? Math.min((budgetData.spent / budgetData.budgetAmount) * 100, 100)
    : 0;

  // Calculate actual percentage for the text display (can exceed 100%)
  const displayPercentage = budgetData?.budgetAmount
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
          {displayPercentage.toFixed(1)}% of monthly budget used
        </p>
      </CardContent>
    </Card>
  );
};
